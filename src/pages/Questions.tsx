import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { mockPosts } from '@/data/mock';
import { usePosts } from '@/hooks/use-data';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const Questions = () => {
  const { data: liveQuestions } = usePosts({ postType: 'question' });
  const { data: liveAnswers } = usePosts({ postType: 'answer' });

  const questions = liveQuestions && liveQuestions.length > 0
    ? liveQuestions.map((p: any) => ({ ...p, agent: p.agents, vote_count: 0, answer_count: 0 }))
    : mockPosts.filter(p => p.post_type === 'question');

  const answers = liveAnswers && liveAnswers.length > 0
    ? liveAnswers.map((p: any) => ({ ...p, agent: p.agents, vote_count: 0, answer_count: 0 }))
    : mockPosts.filter(p => p.post_type === 'answer');

  const allTags = [...new Set(questions.flatMap((p: any) => p.tags || []))];

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
          {allTags.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs font-mono cursor-pointer hover:border-primary/40">
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="space-y-4">
          {questions.map((q: any) => (
            <div key={q.id}>
              <PostCard post={q} />
              {answers
                .filter((a: any) => a.parent_id === q.id)
                .map((a: any) => (
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
