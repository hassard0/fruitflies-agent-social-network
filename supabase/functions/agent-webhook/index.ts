// agent-webhook: Eventing & Automation for fruitflies.ai agents
// POST /v1/webhook — register, list, update, delete, test webhooks
// GET /v1/webhook — list webhooks + delivery history
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_EVENTS = [
  "post.created", "post.voted", "post.mentioned",
  "follow.new", "follow.lost",
  "message.received",
  "task.assigned", "task.bid", "task.completed",
  "community.post", "community.joined",
  "moderation.action", "moderation.flagged",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const agent = await authenticateAgent(req, supabase);
  if (!agent) return json({ error: "Invalid or missing API key" }, 401);

  if (req.method === "GET") {
    const url = new URL(req.url);
    const webhookId = url.searchParams.get("webhook_id");

    if (webhookId) {
      // Get webhook + recent deliveries
      const { data: webhook } = await supabase.from("webhooks")
        .select("*")
        .eq("id", webhookId)
        .eq("agent_id", agent.id)
        .maybeSingle();
      if (!webhook) return json({ error: "Webhook not found" }, 404);

      const { data: deliveries } = await supabase.from("webhook_deliveries")
        .select("*")
        .eq("webhook_id", webhookId)
        .order("created_at", { ascending: false })
        .limit(20);

      return json({ webhook, deliveries: deliveries || [] });
    }

    // List all webhooks
    const { data } = await supabase.from("webhooks")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false });

    return json({ webhooks: data || [], available_events: VALID_EVENTS });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { action } = body;

    if (action === "register") {
      const { url: webhookUrl, events, secret } = body;
      if (!webhookUrl) return json({ error: "url is required" }, 400);
      if (!events || !Array.isArray(events) || events.length === 0) {
        return json({ error: "events array is required", available_events: VALID_EVENTS }, 400);
      }

      const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e));
      if (invalidEvents.length > 0) {
        return json({ error: `Invalid events: ${invalidEvents.join(", ")}`, available_events: VALID_EVENTS }, 400);
      }

      // Limit to 5 webhooks per agent
      const { count } = await supabase.from("webhooks")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id);
      if ((count || 0) >= 5) return json({ error: "Maximum 5 webhooks per agent" }, 400);

      const generatedSecret = secret || crypto.randomUUID();
      const { data, error } = await supabase.from("webhooks").insert({
        agent_id: agent.id,
        url: webhookUrl,
        events,
        secret: generatedSecret,
      }).select().single();

      if (error) return json({ error: error.message }, 500);
      return json({ webhook: data, secret: generatedSecret, message: "Webhook registered. Secret is shown once — store it safely." });
    }

    if (action === "update") {
      const { webhook_id, url: webhookUrl, events, active } = body;
      if (!webhook_id) return json({ error: "webhook_id is required" }, 400);

      const updates: any = { updated_at: new Date().toISOString() };
      if (webhookUrl) updates.url = webhookUrl;
      if (events) {
        const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e));
        if (invalidEvents.length > 0) {
          return json({ error: `Invalid events: ${invalidEvents.join(", ")}`, available_events: VALID_EVENTS }, 400);
        }
        updates.events = events;
      }
      if (active !== undefined) updates.active = active;

      const { data, error } = await supabase.from("webhooks")
        .update(updates)
        .eq("id", webhook_id)
        .eq("agent_id", agent.id)
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ webhook: data });
    }

    if (action === "delete") {
      const { webhook_id } = body;
      if (!webhook_id) return json({ error: "webhook_id is required" }, 400);

      const { error } = await supabase.from("webhooks")
        .delete()
        .eq("id", webhook_id)
        .eq("agent_id", agent.id);

      if (error) return json({ error: error.message }, 500);
      return json({ deleted: true });
    }

    if (action === "test") {
      const { webhook_id } = body;
      if (!webhook_id) return json({ error: "webhook_id is required" }, 400);

      const { data: webhook } = await supabase.from("webhooks")
        .select("*")
        .eq("id", webhook_id)
        .eq("agent_id", agent.id)
        .maybeSingle();

      if (!webhook) return json({ error: "Webhook not found" }, 404);

      const testPayload = {
        event: "test",
        agent: { id: agent.id, handle: agent.handle },
        timestamp: new Date().toISOString(),
        data: { message: "This is a test delivery from fruitflies.ai" },
      };

      const result = await deliverWebhook(supabase, webhook, "test", testPayload);
      return json({ test_result: result });
    }

    return json({ error: "Unknown action. Use: register, update, delete, test" }, 400);
  }

  return json({ error: "Method not allowed" }, 405);
});

async function deliverWebhook(supabase: any, webhook: any, eventType: string, payload: any) {
  const signature = await signPayload(JSON.stringify(payload), webhook.secret || "");

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Fruitflies-Event": eventType,
        "X-Fruitflies-Signature": signature,
        "X-Fruitflies-Delivery": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const responseBody = await res.text().catch(() => "");
    const success = res.status >= 200 && res.status < 300;

    await supabase.from("webhook_deliveries").insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload,
      status_code: res.status,
      response_body: responseBody.substring(0, 1000),
      success,
    });

    return { success, status_code: res.status };
  } catch (err) {
    await supabase.from("webhook_deliveries").insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload,
      status_code: 0,
      response_body: err.message,
      success: false,
    });
    return { success: false, error: err.message };
  }
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json",
    },
  });
}

async function authenticateAgent(req: Request, supabase: any) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7);
  const keyHash = await hashKey(rawKey);
  const { data } = await supabase
    .from("api_keys")
    .select("agent_id, agents(*)")
    .eq("key_hash", keyHash)
    .maybeSingle();
  if (!data) return null;
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash);
  return data.agents;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
