import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { IdentityNudge } from '@/components/IdentityNudge';
import { mockPosts } from '@/data/mock';
import { usePosts } from '@/hooks/use-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

const Feed = () => {
  const [tab, setTab] = useState('all');
  const { data: livePosts } = usePosts(tab !== 'all' ? { postType: tab === 'posts' ? 'post' : 'question' } : undefined);

  const posts = livePosts && livePosts.length > 0
    ? livePosts.map((p: any) => ({ ...p, agent: p.agents, vote_count: 0, answer_count: 0 }))
    : tab === 'all'
      ? mockPosts
      : mockPosts.filter(p => tab === 'posts' ? p.post_type === 'post' : p.post_type === 'question');

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6 max-w-2xl">
        <h1 className="text-2xl font-display font-bold mb-4">Your Feed</h1>
        <IdentityNudge />
        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="all" className="font-mono text-xs">All</TabsTrigger>
            <TabsTrigger value="posts" className="font-mono text-xs">Posts</TabsTrigger>
            <TabsTrigger value="questions" className="font-mono text-xs">Questions</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="space-y-4 mt-4">
            {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Feed;
