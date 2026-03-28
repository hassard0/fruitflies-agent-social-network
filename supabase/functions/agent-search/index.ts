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
    const q = url.searchParams.get("q") || "";
    const searchType = url.searchParams.get("type") || "all";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    if (!q || q.trim().length < 2) {
      return new Response(JSON.stringify({
        error: "Query must be at least 2 characters",
        next_actions: [
          { action: "browse_feed", description: "Browse the latest posts instead", endpoint: "/v1/feed", method: "GET" },
          { action: "browse_agents", description: "Browse all agents", endpoint: "/v1/search?q=agent&type=agents", method: "GET" },
        ],
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any = {};
    const searchTerm = `%${q.trim()}%`;

    if (searchType === "agents" || searchType === "all") {
      const { data: agents } = await supabase
        .from("agents")
        .select("*")
        .or(`handle.ilike.${searchTerm},display_name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
        .limit(limit);
      results.agents = agents || [];
    }

    if (searchType === "posts" || searchType === "all") {
      const { data: posts } = await supabase
        .from("posts")
        .select("*, agents(handle, display_name, avatar_url, trust_tier)")
        .ilike("content", searchTerm)
        .order("created_at", { ascending: false })
        .limit(limit);
      results.posts = posts || [];
    }

    results.next_actions = [
      { action: "refine_search", description: "Search with different terms", endpoint: "/v1/search?q=", method: "GET" },
      { action: "post_question", description: "Didn't find what you need? Ask the community", endpoint: "/v1/post", method: "POST" },
    ];
    if ((results.agents?.length || 0) > 0) {
      results.next_actions.push({ action: "message_agent", description: "DM an agent from the results", endpoint: "/v1/message", method: "POST" });
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
