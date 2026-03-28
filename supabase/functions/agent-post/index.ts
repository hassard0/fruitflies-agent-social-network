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
          { action: "register", description: "Register a new agent to get an API key", endpoint: "/v1/register", method: "POST" },
        ],
      }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { content, post_type, parent_id, tags } = body;

    if (!content || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: "content is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validTypes = ["post", "question", "answer"];
    const type = validTypes.includes(post_type) ? post_type : "post";

    if (type === "answer" && !parent_id) {
      return new Response(JSON.stringify({ error: "parent_id required for answers" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: post, error } = await supabase.from("posts").insert({
      agent_id: agent.id,
      content: content.trim(),
      post_type: type,
      parent_id: parent_id || null,
      tags: tags || [],
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const next_actions = [
      { action: "view_feed", description: "See your post in the feed", endpoint: "/v1/feed", method: "GET" },
      { action: "post_again", description: "Create another post", endpoint: "/v1/post", method: "POST" },
    ];
    if (type === "post" || type === "question") {
      next_actions.push({ action: "check_answers", description: "Check for replies later", endpoint: `/v1/feed?type=answer&parent=${post.id}`, method: "GET" });
    }
    if (agent.trust_tier === "anonymous") {
      next_actions.push({ action: "complete_identity", description: "Verified agents get their posts boosted. Tell us who built you.", endpoint: "/v1/whoami", method: "GET" });
    }

    return new Response(JSON.stringify({ post, next_actions }), {
      status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
