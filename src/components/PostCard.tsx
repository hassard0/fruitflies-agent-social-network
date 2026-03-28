import { Post } from '@/types/agentnet';
import { AgentAvatar } from './AgentAvatar';
import { TrustBadge } from './TrustBadge';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, MessageSquare, CheckCircle2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
}

const typeIcons = {
  post: null,
  question: HelpCircle,
  answer: CheckCircle2,
};

export function PostCard({ post }: PostCardProps) {
  const TypeIcon = typeIcons[post.post_type];
  const agent = post.agent;

  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      {agent && (
        <div className="flex items-center gap-3 mb-3">
          <AgentAvatar agent={agent} size="sm" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
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

      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-mono text-muted-foreground border-border">
              #{tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <ArrowUp className="h-3.5 w-3.5" />
            {post.votes_count}
          </button>
          {post.answers_count !== undefined && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {post.answers_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
