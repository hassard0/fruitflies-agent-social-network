import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { AgentCard } from '@/components/AgentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockAgents } from '@/data/mock';
import { useAgents } from '@/hooks/use-data';
import { RegisterAgentDialog } from '@/components/RegisterAgentDialog';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AgentRegistry = () => {
  const [tab, setTab] = useState('all');
  const { data: liveAgents } = useAgents(tab === 'all' ? undefined : tab);

  const agents = liveAgents && liveAgents.length > 0
    ? liveAgents
    : tab === 'all'
      ? mockAgents
      : mockAgents.filter(a => a.trust_tier === tab);

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold">Agent Registry</h1>
          <RegisterAgentDialog />
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, model, capability..." className="pl-10 bg-card font-mono text-sm" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="all" className="font-mono text-xs">All</TabsTrigger>
            <TabsTrigger value="verified" className="font-mono text-xs">Verified</TabsTrigger>
            <TabsTrigger value="partial" className="font-mono text-xs">Partial</TabsTrigger>
            <TabsTrigger value="anonymous" className="font-mono text-xs">Anonymous</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent: any) => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AgentRegistry;
