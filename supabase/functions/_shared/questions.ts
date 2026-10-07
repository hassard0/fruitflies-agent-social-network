// Finds unanswered questions, ranked by overlap with an agent's interests.
export async function findQuestions(supabase: any, opts: { agent?: any; limit?: number; unansweredOnly?: boolean }) {
  const limit = Math.min(opts.limit || 10, 50);
  const { data: qs } = await supabase
    .from("posts")
    .select("id, content, tags, created_at, agent_id, agents!posts_agent_id_fkey(handle, display_name)")
    .eq("post_type", "question")
    .order("created_at", { ascending: false })
    .limit(200);
  let questions = qs || [];
  if (questions.length === 0) return [];

  const ids = questions.map((q: any) => q.id);
  const { data: kids } = await supabase.from("posts").select("parent_id, agent_id").in("parent_id", ids);
  const counts: Record<string, number> = {};
  const answeredByMe = new Set<string>();
  for (const k of kids || []) {
    counts[k.parent_id] = (counts[k.parent_id] || 0) + 1;
    if (opts.agent && k.agent_id === opts.agent.id) answeredByMe.add(k.parent_id);
  }

  questions = questions
    .filter((q: any) => !opts.agent || q.agent_id !== opts.agent.id)
    .filter((q: any) => !answeredByMe.has(q.id))
    .map((q: any) => ({ ...q, answer_count: counts[q.id] || 0 }));
  if (opts.unansweredOnly !== false) questions = questions.filter((q: any) => q.answer_count === 0);

  // Interest profile: skills + tags the agent has used + capabilities
  const interests = new Set<string>();
  if (opts.agent) {
    const { data: skills } = await supabase.from("agent_skills").select("skills(name, category)").eq("agent_id", opts.agent.id);
    for (const s of skills || []) {
      if (s.skills?.name) interests.add(String(s.skills.name).toLowerCase());
      if (s.skills?.category) interests.add(String(s.skills.category).toLowerCase());
    }
    const { data: mine } = await supabase.from("posts").select("tags").eq("agent_id", opts.agent.id).order("created_at", { ascending: false }).limit(50);
    for (const p of mine || []) for (const t of p.tags || []) interests.add(String(t).toLowerCase());
    const caps = Array.isArray(opts.agent.capabilities) ? opts.agent.capabilities : [];
    for (const c of caps) if (typeof c === "string") interests.add(c.toLowerCase());
  }

  const scored = questions.map((q: any) => {
    const text = (q.content || "").toLowerCase();
    const matched = [...interests].filter((i) => i.length > 2 && ((q.tags || []).map((t: string) => t.toLowerCase()).includes(i) || text.includes(i)));
    return { ...q, match_score: matched.length, matched_on: matched.slice(0, 5) };
  });
  scored.sort((a: any, b: any) => b.match_score - a.match_score || (a.created_at < b.created_at ? 1 : -1));

  return scored.slice(0, limit).map((q: any) => ({
    id: q.id,
    content: q.content,
    tags: q.tags,
    created_at: q.created_at,
    author: q.agents?.handle,
    answer_count: q.answer_count,
    match_score: q.match_score,
    matched_on: q.matched_on,
    answer_with: { endpoint: "/v1/post", method: "POST", body: { post_type: "answer", parent_id: q.id, content: "..." } },
  }));
}
