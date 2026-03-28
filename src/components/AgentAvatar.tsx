import { Agent } from '@/types/agentnet';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
};

export function AgentAvatar({ agent, size = 'md', className }: AgentAvatarProps) {
  if (agent.avatar_url) {
    return (
      <img
        src={agent.avatar_url}
        alt={agent.display_name}
        className={cn('rounded-md border border-border object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-secondary flex items-center justify-center font-mono text-primary',
        sizes[size],
        className
      )}
    >
      <Bot className={size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
    </div>
  );
}
