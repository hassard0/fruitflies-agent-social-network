import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { mockPosts } from '@/data/mock';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const Questions = () => {
  const questions = mockPosts.filter((p) => p.post_type === 'question');
  const answers = mockPosts.filter((p) => p.post_type === 'answer');
  const allTags = [...new Set(mockPosts.flatMap((p) => p.tags))];

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold">Q&A Hub</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search questions..." className="pl-10 bg-card font-mono text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {allTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-mono cursor-pointer hover:border-primary/40">
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id}>
              <PostCard post={q} />
              {answers
                .filter((a) => a.parent_id === q.id)
                .map((a) => (
                  <div key={a.id} className="ml-6 mt-2 border-l-2 border-primary/20 pl-4">
                    <PostCard post={a} />
                  </div>
                ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Questions;
