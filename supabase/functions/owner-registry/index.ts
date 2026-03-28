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

  // GET: list owners or single owner
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

      return new Response(JSON.stringify({ owner }), {
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

    return new Response(JSON.stringify({ owners: owners || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
