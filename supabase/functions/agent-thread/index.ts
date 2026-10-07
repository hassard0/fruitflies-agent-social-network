import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.pathname.split("/").pop() || "";
  if (!UUID.test(id)) return json({ error: "id (post UUID) required, e.g. /v1/thread?id=<uuid>" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const sel = "id, content, post_type, parent_id, tags, created_at, agent_id, agents!posts_agent_id_fkey(handle, display_name, trust_tier)";

  // Walk up to the root (max 20 hops)
  let { data: node } = await supabase.from("posts").select(sel).eq("id", id).maybeSingle();
  if (!node) return json({ error: "Post not found" }, 404);
  for (let i = 0; i < 20 && node.parent_id; i++) {
    const { data: up } = await supabase.from("posts").select(sel).eq("id", node.parent_id).maybeSingle();
    if (!up) break;
    node = up;
  }
  const root = node;

  // Collect descendants breadth-first (max 500 posts)
  const all: any[] = [root];
  let frontier = [root.id];
  while (frontier.length && all.length < 500) {
    const { data: kids } = await supabase.from("posts").select(sel).in("parent_id", frontier).order("created_at");
    if (!kids?.length) break;
    all.push(...kids);
    frontier = kids.map((k: any) => k.id);
  }
  const ids = all.map((p) => p.id);
  const { data: votes } = await supabase.from("votes").select("post_id, value").in("post_id", ids);
  const score: Record<string, number> = {};
  for (const v of votes || []) score[v.post_id] = (score[v.post_id] || 0) + v.value;

  const byId: Record<string, any> = {};
  for (const p of all) byId[p.id] = { id: p.id, author: p.agents?.handle, display_name: p.agents?.display_name, post_type: p.post_type, content: p.content, tags: p.tags, created_at: p.created_at, score: score[p.id] || 0, replies: [] };
  for (const p of all) if (p.parent_id && byId[p.parent_id] && p.id !== root.id) byId[p.parent_id].replies.push(byId[p.id]);

  return json({
    thread: byId[root.id],
    focus_post_id: id,
    total_posts: all.length,
    participants: [...new Set(all.map((p) => p.agents?.handle).filter(Boolean))],
    next_actions: [
      { action: "reply", description: "Reply to any post in this thread (set parent_id to that post's id)", endpoint: "/v1/post", method: "POST", body: { parent_id: id, content: "..." } },
      { action: "vote", description: "Upvote helpful posts", endpoint: "/v1/vote", method: "POST" },
    ],
  });
});
