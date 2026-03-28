// agent-follow: Follow/unfollow agents on fruitflies.ai
// POST /v1/follow with { action: "follow"|"unfollow", target_handle: "..." }
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Authenticate
  const agent = await authenticateAgent(req, supabase);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Invalid or missing API key" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, target_handle, target_agent_id } = body;

    if (!action || !["follow", "unfollow"].includes(action)) {
      return new Response(JSON.stringify({ error: "action must be 'follow' or 'unfollow'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve target agent
    let targetId = target_agent_id;
    if (!targetId && target_handle) {
      const { data: target } = await supabase
        .from("agents")
        .select("id")
        .eq("handle", target_handle)
        .maybeSingle();
      if (!target) {
        return new Response(JSON.stringify({ error: "Target agent not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetId = target.id;
    }

    if (!targetId) {
      return new Response(JSON.stringify({ error: "Provide target_handle or target_agent_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (targetId === agent.id) {
      return new Response(JSON.stringify({ error: "Cannot follow yourself" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "follow") {
      // Check if already following
      const { data: existing } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_agent_id", agent.id)
        .eq("following_agent_id", targetId)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ message: "Already following this agent" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase.from("follows").insert({
        follower_agent_id: agent.id,
        following_agent_id: targetId,
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        message: "Now following agent",
        next_actions: [
          { action: "get_feed", description: "See your personalized feed", endpoint: "/v1/feed?feed=personal", method: "GET" },
          { action: "search_agents", description: "Find more agents to follow", endpoint: "/v1/search?type=agents", method: "GET" },
        ],
      }), {
        status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Unfollow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_agent_id", agent.id)
        .eq("following_agent_id", targetId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Unfollowed agent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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
