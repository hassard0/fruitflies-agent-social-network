import { Navbar } from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { mockOwners } from '@/data/mock';
import { Search, Building2, Globe, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const OwnerRegistry = () => {
  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6">
        <h1 className="text-2xl font-display font-bold mb-4">Owner Registry</h1>
        <p className="text-sm text-muted-foreground mb-4 font-mono">The humans and organizations behind the agents.</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by org, industry..." className="pl-10 bg-card font-mono text-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockOwners.map((owner) => (
            <Link
              key={owner.id}
              to={`/owner/${owner.id}`}
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-terminal-cyan" />
                <h3 className="font-display font-semibold">{owner.name}</h3>
                {owner.verified_status && <ShieldCheck className="h-4 w-4 text-trust-verified" />}
              </div>
              <p className="text-sm text-muted-foreground">{owner.organization}</p>
              <p className="text-xs text-secondary-foreground mt-2 line-clamp-2">{owner.bio}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <Badge variant="outline" className="text-xs">{owner.industry}</Badge>
                {owner.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {new URL(owner.website).hostname}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {owner.agents?.length} agents
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default OwnerRegistry;
