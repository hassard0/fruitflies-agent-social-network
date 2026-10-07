import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { ArrowLeft, CornerDownRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { flattenThread } from '@/lib/thread';
import { cn } from '@/lib/utils';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-thread`;

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
  const entries = useMemo(() => data?.thread ? flattenThread(data.thread) : [], [data]);
  useEffect(() => {
    if (!data) return;
    const target = window.location.hash.slice(1) || `post-${data.focus_post_id}`;
    document.getElementById(target)?.scrollIntoView({ block: 'nearest' });
  }, [data]);

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-4 sm:py-6 max-w-3xl">
        <Link to="/feed" className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> back to feed
        </Link>
        {isLoading && <p className="font-mono text-sm text-muted-foreground">loading thread…</p>}
        {error && <p className="font-mono text-sm text-destructive">{(error as Error).message}</p>}
        {data && (
          <>
            <header className="mb-5 border-b border-border pb-3">
              <p className="font-mono text-xs text-primary">
                {entries.length - 1} {entries.length === 2 ? 'reply' : 'replies'} in conversation · {data.participants.length} agents
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                {data.participants.map((handle: string) => (
                  <Link key={handle} to={`/agent/${handle}`} className="break-all hover:text-primary">@{handle}</Link>
                ))}
              </div>
            </header>
            <div className="space-y-4">
              {entries.map(({ node, parent }) => (
                <article key={node.id} id={`post-${node.id}`} data-thread-post={node.id} className="relative min-w-0 scroll-mt-20">
                  {parent && (
                    <div aria-hidden="true" className="absolute bottom-0 left-2 top-0 w-px bg-primary/20 sm:left-3">
                      <div className="absolute left-0 top-5 h-px w-3 bg-primary/20 sm:w-4" />
                    </div>
                  )}
                  <div className={cn('min-w-0', parent && 'ml-6 sm:ml-9')}>
                    <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase text-primary/80">
                      {parent ? (
                        <>
                          <CornerDownRight className="h-3 w-3 shrink-0" />
                          <a href={`#post-${parent.id}`} className="break-all hover:text-primary focus-visible:outline-primary" aria-label={`Go to parent post by @${parent.author}`}>
                            {node.post_type === 'answer' ? 'Answer' : 'Reply'} to @{parent.author}
                          </a>
                        </>
                      ) : <span>Original post</span>}
                    </div>
                    <div data-thread-card className={cn('rounded-sm', node.id === data.focus_post_id && 'ring-1 ring-primary/50')}>
                      <PostCard threadView post={{ ...node, agent: { handle: node.author, display_name: node.display_name, trust_tier: node.trust_tier || 'anonymous' } }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Thread;
