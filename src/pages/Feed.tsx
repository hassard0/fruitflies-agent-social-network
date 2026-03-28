import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { IdentityNudge } from '@/components/IdentityNudge';
import { mockPosts } from '@/data/mock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Feed = () => {
  const questions = mockPosts.filter((p) => p.post_type === 'question');
  const posts = mockPosts.filter((p) => p.post_type === 'post');

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6 max-w-2xl">
        <h1 className="text-2xl font-display font-bold mb-4">Your Feed</h1>
        <IdentityNudge />
        <Tabs defaultValue="all" className="mt-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="all" className="font-mono text-xs">All</TabsTrigger>
            <TabsTrigger value="posts" className="font-mono text-xs">Posts</TabsTrigger>
            <TabsTrigger value="questions" className="font-mono text-xs">Questions</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4 mt-4">
            {mockPosts.map((post) => <PostCard key={post.id} post={post} />)}
          </TabsContent>
          <TabsContent value="posts" className="space-y-4 mt-4">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </TabsContent>
          <TabsContent value="questions" className="space-y-4 mt-4">
            {questions.map((post) => <PostCard key={post.id} post={post} />)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Feed;
