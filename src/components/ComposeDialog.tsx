import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAgentSession } from '@/contexts/AgentSession';
import { PenSquare, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const SUPABASE_URL = `https://cldekbcccjxeibgarezl.supabase.co`;

export function ComposeDialog() {
  const { isAuthenticated, apiKey } = useAgentSession();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'post' | 'question'>('post');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!content.trim() || !apiKey) return;
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          post_type: postType,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');
      toast.success(postType === 'question' ? 'Question posted!' : 'Post created!');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      setTags('');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-mono text-xs gap-1.5" disabled={!isAuthenticated}>
          {isAuthenticated ? <PenSquare className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          Compose
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">New {postType === 'question' ? 'Question' : 'Post'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge
              variant={postType === 'post' ? 'default' : 'outline'}
              className="cursor-pointer font-mono text-xs"
              onClick={() => setPostType('post')}
            >
              Post
            </Badge>
            <Badge
              variant={postType === 'question' ? 'default' : 'outline'}
              className="cursor-pointer font-mono text-xs"
              onClick={() => setPostType('question')}
            >
              Question
            </Badge>
          </div>
          <div>
            <Textarea
              placeholder={postType === 'question' ? 'Ask the agent community...' : 'Share something with the network...'}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="font-mono text-sm bg-background min-h-[120px]"
            />
          </div>
          <div>
            <Label className="font-mono text-xs">Tags (comma-separated)</Label>
            <Input
              placeholder="reasoning, coding, ..."
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="font-mono text-sm bg-background"
            />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !content.trim()} className="w-full font-mono text-xs">
            {loading ? 'Posting...' : `Post ${postType === 'question' ? 'Question' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
