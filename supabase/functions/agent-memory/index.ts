// agent-memory: Memory-as-a-Service for fruitflies.ai agents
// GET /v1/memory?namespace=&key= — retrieve memories
// POST /v1/memory — store/update/delete/list memories
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const agent = await authenticateAgent(req, supabase);
  if (!agent) {
    return json({ error: "Invalid or missing API key" }, 401);
  }

  // Clean expired memories opportunistically
  await supabase.from("agent_memories")
    .delete()
    .eq("agent_id", agent.id)
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString());

  if (req.method === "GET") {
    const url = new URL(req.url);
    const namespace = url.searchParams.get("namespace") || "default";
    const key = url.searchParams.get("key");

    if (key) {
      // Get single memory
      const { data } = await supabase.from("agent_memories")
        .select("*")
        .eq("agent_id", agent.id)
        .eq("namespace", namespace)
        .eq("key", key)
        .maybeSingle();
      if (!data) return json({ error: "Memory not found" }, 404);
      return json({ memory: data });
    }

    // List memories in namespace
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const { data } = await supabase.from("agent_memories")
      .select("*")
      .eq("agent_id", agent.id)
      .eq("namespace", namespace)
      .order("updated_at", { ascending: false })
      .limit(limit);

    return json({ memories: data || [], namespace });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { action } = body;

    if (action === "store" || !action) {
      const { namespace = "default", key, value, memory_type = "short_term", ttl_seconds } = body;
      if (!key) return json({ error: "key is required" }, 400);
      if (value === undefined) return json({ error: "value is required" }, 400);

      const expires_at = ttl_seconds
        ? new Date(Date.now() + ttl_seconds * 1000).toISOString()
        : null;

      const { data, error } = await supabase.from("agent_memories")
        .upsert({
          agent_id: agent.id,
          namespace,
          key,
          value: typeof value === "object" ? value : { _value: value },
          memory_type,
          ttl_seconds: ttl_seconds || null,
          expires_at,
          updated_at: new Date().toISOString(),
        }, { onConflict: "agent_id,namespace,key" })
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ memory: data, action: "stored" });
    }

    if (action === "delete") {
      const { namespace = "default", key } = body;
      if (!key) return json({ error: "key is required" }, 400);

      const { error } = await supabase.from("agent_memories")
        .delete()
        .eq("agent_id", agent.id)
        .eq("namespace", namespace)
        .eq("key", key);

      if (error) return json({ error: error.message }, 500);
      return json({ deleted: true, namespace, key });
    }

    if (action === "clear") {
      const { namespace } = body;
      let query = supabase.from("agent_memories").delete().eq("agent_id", agent.id);
      if (namespace) query = query.eq("namespace", namespace);
      const { error } = await query;
      if (error) return json({ error: error.message }, 500);
      return json({ cleared: true, namespace: namespace || "all" });
    }

    if (action === "search") {
      const { namespace = "default", prefix, limit = 20 } = body;
      let query = supabase.from("agent_memories")
        .select("*")
        .eq("agent_id", agent.id)
        .eq("namespace", namespace)
        .order("updated_at", { ascending: false })
        .limit(Math.min(limit, 100));

      if (prefix) query = query.ilike("key", `${prefix}%`);
      const { data } = await query;
      return json({ memories: data || [] });
    }

    return json({ error: "Unknown action. Use: store, delete, clear, search" }, 400);
  }

  return json({ error: "Method not allowed" }, 405);
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
