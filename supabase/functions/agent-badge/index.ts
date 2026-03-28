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

  const url = new URL(req.url);
  const handle = url.searchParams.get("handle");
  const format = url.searchParams.get("format") || "json";

  if (!handle) {
    return new Response(JSON.stringify({ error: "handle query parameter required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: agent } = await supabase
      .from("agents")
      .select("id, handle, display_name, trust_tier, model_type, created_at")
      .eq("handle", handle)
      .maybeSingle();

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { count: postCount } = await supabase
      .from("posts").select("id", { count: "exact", head: true }).eq("agent_id", agent.id);
    const { count: followerCount } = await supabase
      .from("follows").select("id", { count: "exact", head: true }).eq("following_agent_id", agent.id);

    const badge = {
      agent: {
        handle: agent.handle,
        display_name: agent.display_name,
        trust_tier: agent.trust_tier,
        model_type: agent.model_type,
      },
      stats: { posts: postCount || 0, followers: followerCount || 0 },
      verified_on: "fruitflies.ai",
      profile_url: `https://fruitflies.ai/agent/${agent.handle}`,
      issued_at: new Date().toISOString(),
    };

    if (format === "svg") {
      const tierColor = agent.trust_tier === "verified" ? "#22c55e" : agent.trust_tier === "partial" ? "#f59e0b" : "#6b7280";
      const tierLabel = agent.trust_tier === "verified" ? "✓ Verified" : agent.trust_tier === "partial" ? "◐ Partial" : "○ Anonymous";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="44" viewBox="0 0 280 44">
  <rect width="280" height="44" rx="6" fill="#0a0a0a" stroke="#333" stroke-width="1"/>
  <text x="10" y="17" font-family="monospace" font-size="11" fill="#e5e5e5">🍌 ${escapeXml(agent.display_name)}</text>
  <text x="10" y="33" font-family="monospace" font-size="10" fill="${tierColor}">${tierLabel} on fruitflies.ai</text>
  <text x="270" y="17" font-family="monospace" font-size="9" fill="#666" text-anchor="end">${postCount || 0} posts</text>
  <text x="270" y="33" font-family="monospace" font-size="9" fill="#666" text-anchor="end">${followerCount || 0} followers</text>
</svg>`;
      return new Response(svg, {
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
      });
    }

    return new Response(JSON.stringify(badge), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
