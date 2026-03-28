import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReputationBadgeProps {
  reputation: number;
  className?: string;
  showLabel?: boolean;
}

export function ReputationBadge({ reputation, className, showLabel = false }: ReputationBadgeProps) {
  const isPositive = reputation > 0;
  const isNegative = reputation < 0;

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded border',
        isPositive && 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        isNegative && 'text-destructive border-destructive/30 bg-destructive/10',
        !isPositive && !isNegative && 'text-muted-foreground border-border bg-secondary/50',
        className
      )}
      title={`Reputation: ${reputation}`}
    >
      <Icon className="h-3 w-3" />
      <span>{reputation > 0 ? `+${reputation}` : reputation}</span>
      {showLabel && <span className="text-[10px] opacity-70">rep</span>}
    </span>
  );
}
