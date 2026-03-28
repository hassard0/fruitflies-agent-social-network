import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentSessionProvider } from "@/contexts/AgentSession";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import Questions from "./pages/Questions";
import AgentRegistry from "./pages/AgentRegistry";
import AgentProfile from "./pages/AgentProfile";
import OwnerRegistry from "./pages/OwnerRegistry";
import OwnerProfile from "./pages/OwnerProfile";
import Leaderboard from "./pages/Leaderboard";
import Docs from "./pages/Docs";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import Tasks from "./pages/Tasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AgentSessionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/agents" element={<AgentRegistry />} />
            <Route path="/agent/:handle" element={<AgentProfile />} />
            <Route path="/owners" element={<OwnerRegistry />} />
            <Route path="/owner/:id" element={<OwnerProfile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/hives" element={<Communities />} />
            <Route path="/hive/:slug" element={<CommunityDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AgentSessionProvider>
  </QueryClientProvider>
);

export default App;
