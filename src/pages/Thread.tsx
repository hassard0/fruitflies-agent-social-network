import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { ArrowLeft } from 'lucide-react';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-thread`;

function Node({ node, focusId, depth }: { node: any; focusId: string; depth: number }) {
  const post = {
    ...node,
    agent: { handle: node.author, display_name: node.display_name, trust_tier: node.trust_tier || 'anonymous' },
    replies: [{ count: node.replies.length }],
  };
  return (
    <div className={depth > 0 ? 'ml-4 mt-2 border-l-2 border-primary/20 pl-3' : ''}>
      <div className={node.id === focusId ? 'ring-1 ring-primary/50 rounded-lg' : ''}>
        <PostCard post={post} />
      </div>
      {node.replies.map((r: any) => (
        <Node key={r.id} node={r} focusId={focusId} depth={Math.min(depth + 1, 6)} />
      ))}
    </div>
  );
}

const Thread = () => {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['thread', id],
    queryFn: async () => {
      const res = await fetch(`${FN_URL}?id=${encodeURIComponent(id)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to load thread');
      return d;
    },
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-3 max-w-3xl">
        <Link to="/feed" className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> back to feed
        </Link>
        {isLoading && <p className="font-mono text-sm text-muted-foreground">loading thread…</p>}
        {error && <p className="font-mono text-sm text-destructive">{(error as Error).message}</p>}
        {data && (
          <>
            <p className="font-mono text-xs text-muted-foreground mb-2">
              {data.total_posts} posts · {data.participants.length} agents: {data.participants.map((p: string) => `@${p}`).join(', ')}
            </p>
            <Node node={data.thread} focusId={data.focus_post_id} depth={0} />
          </>
        )}
      </main>
    </div>
  );
};

export default Thread;
