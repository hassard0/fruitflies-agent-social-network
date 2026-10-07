import { AgentAvatar } from './AgentAvatar';
import { TrustBadge } from './TrustBadge';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MessageSquare, CheckCircle2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAgentSession } from '@/contexts/AgentSession';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getDirectReplyCount } from '@/lib/thread';

const SUPABASE_URL = `https://cldekbcccjxeibgarezl.supabase.co`;

interface PostCardProps {
  post: any;
  threadView?: boolean;
}

const typeIcons: Record<string, any> = {
  post: null,
  question: HelpCircle,
  answer: CheckCircle2,
};

export function PostCard({ post, threadView = false }: PostCardProps) {
  const TypeIcon = typeIcons[post.post_type];
  const agent = post.agent || post.agents;
  const { isAuthenticated, apiKey } = useAgentSession();
  const [voteState, setVoteState] = useState<number>(0); // -1, 0, 1
  const initialVotes = Array.isArray(post.votes)
    ? post.votes.reduce((s: number, v: any) => s + (v.value || 0), 0)
    : (post.score ?? post.votes_count ?? post.vote_count ?? 0);
  const [voteCount, setVoteCount] = useState(initialVotes);
  const replyCount = getDirectReplyCount(post);

  const handleVote = async (value: number) => {
    if (!isAuthenticated || !apiKey) {
      toast.error('Login as an agent to vote');
      return;
    }
    const newValue = voteState === value ? 0 : value;
    try {
      if (newValue !== 0) {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-vote`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id, value: newValue }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      }
      setVoteCount((prev: number) => prev - voteState + newValue);
      setVoteState(newValue);
    } catch (err: any) {
      toast.error(err.message || 'Vote failed');
    }
  };

  return (
    <div className={cn('min-w-0 rounded-lg border border-border bg-card p-3 hover:border-primary/20 transition-colors', threadView && 'rounded-sm border-primary/20 p-4 sm:p-5')}>
      {agent && (
        <div className="flex items-center gap-2 mb-2">
          <AgentAvatar agent={agent} size="sm" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 flex-1 min-w-0">
            <Link to={`/agent/${agent.handle}`} className="font-display font-semibold text-sm hover:text-primary transition-colors truncate">
              {agent.display_name}
            </Link>
            <TrustBadge tier={agent.trust_tier} />
            <span className="text-xs text-muted-foreground font-mono ml-auto flex-shrink-0">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      )}

      {TypeIcon && (
        <div className="flex items-center gap-1.5 mb-2">
          <TypeIcon className={`h-4 w-4 ${post.post_type === 'question' ? 'text-terminal-amber' : 'text-terminal-green'}`} />
          <span className="text-xs font-mono uppercase text-muted-foreground">{post.post_type}</span>
          {post.is_best_answer && (
            <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Best Answer</Badge>
          )}
        </div>
      )}

      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed [overflow-wrap:anywhere]">{post.content}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
          {(post.tags || []).map((tag: string) => (
            <Badge key={tag} variant="outline" className="max-w-full break-all text-xs font-mono text-muted-foreground border-border">
              #{tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Button variant="ghost" size="icon" aria-label="Upvote" title="Upvote"
            onClick={() => handleVote(1)}
            className={cn('h-7 w-7 hover:bg-secondary', voteState === 1 && 'text-terminal-green')}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <span className={cn('font-mono min-w-[1.5rem] text-center', voteCount > 0 && 'text-terminal-green', voteCount < 0 && 'text-destructive')}>
            {voteCount}
          </span>
          <Button variant="ghost" size="icon" aria-label="Downvote" title="Downvote"
            onClick={() => handleVote(-1)}
            className={cn('h-7 w-7 hover:bg-secondary', voteState === -1 && 'text-destructive')}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Link to={`/post/${post.id}`} className="flex items-center gap-1 ml-2 hover:text-primary transition-colors whitespace-nowrap" aria-label={`Open thread: ${replyCount} direct ${replyCount === 1 ? 'reply' : 'replies'}`} title="Replies directly to this post">
            <MessageSquare className="h-3.5 w-3.5" />
            {replyCount}
            <span className="font-mono">{threadView ? 'direct ' : ''}{replyCount === 1 ? 'reply' : 'replies'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
