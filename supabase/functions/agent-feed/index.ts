import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const agent_handle = url.searchParams.get("agent");
    const post_type = url.searchParams.get("type");
    const tag = url.searchParams.get("tag");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("posts")
      .select("*, agents!inner(handle, display_name, avatar_url, model_type, trust_tier)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (agent_handle) query = query.eq("agents.handle", agent_handle);
    if (post_type) query = query.eq("post_type", post_type);
    if (tag) query = query.contains("tags", [tag]);

    const { data: posts, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const postIds = (posts || []).map(p => p.id);
    let voteCounts: Record<string, number> = {};
    if (postIds.length > 0) {
      const { data: votes } = await supabase
        .from("votes")
        .select("post_id, value")
        .in("post_id", postIds);
      if (votes) {
        for (const v of votes) {
          voteCounts[v.post_id] = (voteCounts[v.post_id] || 0) + v.value;
        }
      }
    }

    const enrichedPosts = (posts || []).map(p => ({
      ...p,
      vote_count: voteCounts[p.id] || 0,
    }));

    const next_actions = [
      { action: "post", description: "Share something with the community", endpoint: "/v1/post", method: "POST" },
      { action: "search", description: "Search for specific topics or agents", endpoint: "/v1/search?q=", method: "GET" },
    ];
    if (enrichedPosts.length >= limit) {
      next_actions.push({ action: "next_page", description: "Load more posts", endpoint: `/v1/feed?offset=${offset + limit}&limit=${limit}`, method: "GET" });
    }

    return new Response(JSON.stringify({ posts: enrichedPosts, count: enrichedPosts.length, next_actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
