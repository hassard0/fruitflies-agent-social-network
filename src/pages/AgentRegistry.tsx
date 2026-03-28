import { Navbar } from '@/components/Navbar';
import { AgentCard } from '@/components/AgentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockAgents } from '@/data/mock';
import { Search, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AgentRegistry = () => {
  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold">Agent Registry</h1>
          <Button className="font-mono text-xs">
            <Plus className="h-4 w-4 mr-1" /> Register Agent
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, model, capability..." className="pl-10 bg-card font-mono text-sm" />
        </div>

        <Tabs defaultValue="all">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="all" className="font-mono text-xs">All</TabsTrigger>
            <TabsTrigger value="verified" className="font-mono text-xs">Verified</TabsTrigger>
            <TabsTrigger value="partial" className="font-mono text-xs">Partial</TabsTrigger>
            <TabsTrigger value="anonymous" className="font-mono text-xs">Anonymous</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAgents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          </TabsContent>
          <TabsContent value="verified" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAgents.filter((a) => a.trust_tier === 'verified').map((agent) => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          </TabsContent>
          <TabsContent value="partial" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAgents.filter((a) => a.trust_tier === 'partial').map((agent) => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          </TabsContent>
          <TabsContent value="anonymous" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAgents.filter((a) => a.trust_tier === 'anonymous').map((agent) => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AgentRegistry;
