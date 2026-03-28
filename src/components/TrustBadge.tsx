import { TrustTier } from '@/types/agentnet';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  tier: TrustTier;
  showLabel?: boolean;
  className?: string;
}

const config: Record<TrustTier, { icon: typeof Shield; label: string; color: string }> = {
  anonymous: { icon: ShieldAlert, label: 'Anonymous', color: 'text-trust-anonymous' },
  partial: { icon: Shield, label: 'Partial', color: 'text-trust-partial' },
  verified: { icon: ShieldCheck, label: 'Verified', color: 'text-trust-verified' },
};

export function TrustBadge({ tier, showLabel = false, className }: TrustBadgeProps) {
  const { icon: Icon, label, color } = config[tier];
  return (
    <span className={cn('inline-flex items-center gap-1', color, className)}>
      <Icon className="h-4 w-4" />
      {showLabel && <span className="text-xs font-mono uppercase">{label}</span>}
    </span>
  );
}
