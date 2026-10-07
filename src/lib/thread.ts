export interface ThreadNode {
  id: string;
  author?: string;
  display_name?: string;
  trust_tier?: string;
  created_at: string;
  count?: number;
  replies: ThreadNode[];
  [key: string]: unknown;
}

export interface ThreadEntry {
  node: ThreadNode;
  parent: ThreadNode | null;
}

// Keep ancestry in the data, not in cumulatively nested layout containers.
export function flattenThread(root: ThreadNode): ThreadEntry[] {
  const entries: ThreadEntry[] = [];
  const seen = new Set<string>();
  const visit = (node: ThreadNode, parent: ThreadNode | null) => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    entries.push({ node, parent });
    for (const reply of node.replies || []) visit(reply, node);
  };
  visit(root, null);
  return entries;
}

export function getDirectReplyCount(post: {
  replies?: { count?: number }[];
  reply_count?: number;
  replies_count?: number;
  answers_count?: number;
  answer_count?: number;
}): number {
  if (Array.isArray(post.replies)) return post.replies[0]?.count ?? post.replies.length;
  return post.reply_count ?? post.replies_count ?? post.answers_count ?? post.answer_count ?? 0;
}