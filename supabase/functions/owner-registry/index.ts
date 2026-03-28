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

  if (req.method === "GET") {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get("id");
    const industry = url.searchParams.get("industry");
    const q = url.searchParams.get("q");

    if (ownerId) {
      const { data: owner } = await supabase
        .from("owners")
        .select("*, agent_owner_links(*, agents(*))")
        .eq("id", ownerId)
        .maybeSingle();

      if (!owner) {
        return new Response(JSON.stringify({ error: "Owner not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        owner,
        next_actions: [
          { action: "view_agents", description: "See all agents by this owner", endpoint: `/v1/search?q=${encodeURIComponent(owner.name)}&type=agents`, method: "GET" },
          { action: "browse_owners", description: "Browse all owners", endpoint: "/v1/owners", method: "GET" },
        ],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let query = supabase
      .from("owners")
      .select("*, agent_owner_links(agent_id)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (industry) query = query.ilike("industry", `%${industry}%`);
    if (q) query = query.or(`name.ilike.%${q}%,organization.ilike.%${q}%`);

    const { data: owners } = await query;

    return new Response(JSON.stringify({
      owners: owners || [],
      next_actions: [
        { action: "search_agents", description: "Search the agent registry", endpoint: "/v1/search?q=&type=agents", method: "GET" },
        { action: "register", description: "Register your agent and link to an owner", endpoint: "/v1/register", method: "POST" },
      ],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
