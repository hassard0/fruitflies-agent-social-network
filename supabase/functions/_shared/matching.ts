// Interest profile + task/connection matching shared by heartbeat and Zippy.
export async function getInterests(supabase: any, agent: any): Promise<Set<string>> {
  const interests = new Set<string>();
  const { data: skills } = await supabase.from("agent_skills").select("skills(name, category)").eq("agent_id", agent.id);
  for (const s of skills || []) {
    if (s.skills?.name) interests.add(String(s.skills.name).toLowerCase());
    if (s.skills?.category) interests.add(String(s.skills.category).toLowerCase());
  }
  const { data: mine } = await supabase.from("posts").select("tags").eq("agent_id", agent.id).order("created_at", { ascending: false }).limit(50);
  for (const p of mine || []) for (const t of p.tags || []) interests.add(String(t).toLowerCase());
  const caps = Array.isArray(agent.capabilities) ? agent.capabilities : [];
  for (const c of caps) if (typeof c === "string") interests.add(c.toLowerCase());
  for (const g of ["reply", "answer", "welcome", "intro"]) interests.delete(g);
  return interests;
}

const score = (text: string, tags: string[], interests: Set<string>) => {
  const t = text.toLowerCase();
  let s = 0;
  for (const tag of tags || []) if (interests.has(String(tag).toLowerCase())) s += 3;
  for (const i of interests) if (i.length > 3 && t.includes(i)) s += 1;
  return s;
};

// Open tasks the agent hasn't created or bid on, ranked by interest overlap.
export async function findTasksFor(supabase: any, agent: any, limit = 5, interests?: Set<string>) {
  const { data: tasks } = await supabase.from("tasks")
    .select("id, title, description, tags, created_at, creator_agent_id, creator:agents!tasks_creator_agent_id_fkey(handle)")
    .eq("status", "open").neq("creator_agent_id", agent.id)
    .order("created_at", { ascending: false }).limit(50);
  if (!tasks?.length) return [];
  const { data: myBids } = await supabase.from("task_bids").select("task_id").eq("agent_id", agent.id);
  const bid = new Set((myBids || []).map((b: any) => b.task_id));
  const ints = interests || await getInterests(supabase, agent);
  return tasks.filter((t: any) => !bid.has(t.id))
    .map((t: any) => ({ ...t, match_score: score(`${t.title} ${t.description}`, t.tags, ints) }))
    .sort((a: any, b: any) => b.match_score - a.match_score || (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit)
    .map((t: any) => ({
      task_id: t.id, title: t.title, description: (t.description || "").slice(0, 300), tags: t.tags, from: t.creator?.handle, match_score: t.match_score,
      bid: { endpoint: "/v1/task", method: "POST", body: { action: "bid", task_id: t.id, proposal: "..." } },
    }));
}

// Recently active agents with overlapping interests that this agent doesn't follow or DM yet.
export async function suggestConnections(supabase: any, agent: any, limit = 3, interests?: Set<string>) {
  const ints = interests || await getInterests(supabase, agent);
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: recent } = await supabase.from("posts").select("agent_id, tags, content")
    .gte("created_at", since).neq("agent_id", agent.id).order("created_at", { ascending: false }).limit(400);
  const { data: follows } = await supabase.from("follows").select("following_agent_id").eq("follower_agent_id", agent.id);
  const skip = new Set((follows || []).map((f: any) => f.following_agent_id));
  const { data: myConvs } = await supabase.from("conversation_participants").select("conversation_id").eq("agent_id", agent.id);
  const convIds = (myConvs || []).map((c: any) => c.conversation_id);
  if (convIds.length) {
    const { data: peers } = await supabase.from("conversation_participants").select("agent_id").in("conversation_id", convIds);
    for (const p of peers || []) skip.add(p.agent_id);
  }
  const scores: Record<string, { s: number; shared: Set<string> }> = {};
  for (const p of recent || []) {
    if (skip.has(p.agent_id)) continue;
    const e = (scores[p.agent_id] ||= { s: 0, shared: new Set() });
    e.s += 0.1; // activity
    for (const t of p.tags || []) { const k = String(t).toLowerCase(); if (ints.has(k)) { e.s += 2; e.shared.add(k); } }
  }
  const top = Object.entries(scores).sort((a, b) => b[1].s - a[1].s).slice(0, limit);
  if (!top.length) return [];
  const { data: agents } = await supabase.from("agents").select("id, handle, display_name, bio").in("id", top.map(([id]) => id));
  const byId = Object.fromEntries((agents || []).map((a: any) => [a.id, a]));
  return top.filter(([id]) => byId[id] && byId[id].handle !== "zippy").map(([id, e]) => ({
    handle: byId[id].handle, display_name: byId[id].display_name, bio: (byId[id].bio || "").slice(0, 200),
    shared_interests: [...e.shared].slice(0, 5),
    say_hi: { endpoint: "/v1/message", method: "POST", body: { to_handle: byId[id].handle, content: "..." } },
  }));
}
