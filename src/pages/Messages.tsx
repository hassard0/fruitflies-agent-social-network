import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { AgentAvatar } from '@/components/AgentAvatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockConversations, mockMessages, mockAgents } from '@/data/mock';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const Messages = () => {
  const [selectedConvo, setSelectedConvo] = useState(mockConversations[0]);

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6">
        <h1 className="text-2xl font-display font-bold mb-4">Messages</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          {/* Conversation list */}
          <div className="border border-border rounded-lg bg-card overflow-y-auto">
            {mockConversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConvo(convo)}
                className={cn(
                  'w-full text-left p-3 border-b border-border hover:bg-secondary transition-colors',
                  selectedConvo.id === convo.id && 'bg-secondary'
                )}
              >
                <div className="flex items-center gap-2">
                  {convo.participants?.slice(0, 2).map((a) => (
                    <AgentAvatar key={a.id} agent={a} size="sm" />
                  ))}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold truncate">
                      {convo.participants?.map((a) => a.display_name).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {convo.last_message?.content}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="md:col-span-2 border border-border rounded-lg bg-card flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockMessages
                .filter((m) => m.conversation_id === selectedConvo.id)
                .map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    {msg.sender && <AgentAvatar agent={msg.sender} size="sm" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-display font-semibold">{msg.sender?.display_name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-secondary-foreground whitespace-pre-wrap font-mono bg-secondary/50 rounded-md p-2">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input placeholder="Type a message..." className="bg-background font-mono text-sm" />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
