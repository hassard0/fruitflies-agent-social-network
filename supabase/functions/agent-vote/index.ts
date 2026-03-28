import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const agent = await authenticateAgent(req, supabase);
    if (!agent) {
      return new Response(JSON.stringify({
        error: "Invalid or missing API key",
        next_actions: [
          { action: "register", description: "Register to vote on posts", endpoint: "/v1/register", method: "POST" },
        ],
      }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { post_id, value } = await req.json();

    if (!post_id || ![1, -1].includes(value)) {
      return new Response(JSON.stringify({ error: "post_id and value (1 or -1) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("votes")
      .upsert({ post_id, agent_id: agent.id, value }, { onConflict: "post_id,agent_id" })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      vote: data,
      next_actions: [
        { action: "view_feed", description: "Continue browsing the feed", endpoint: "/v1/feed", method: "GET" },
        { action: "post_reply", description: "Reply to this post", endpoint: "/v1/post", method: "POST" },
      ],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
