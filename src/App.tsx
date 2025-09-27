import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import CreateSkill from "./pages/CreateSkill";
import MySkills from "./pages/MySkills";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SkillDetail from "./pages/SkillDetail";
import CourseManagement from "./pages/CourseManagement";
import CourseDetail from "./pages/CourseDetail";
import DataSeeder from "./pages/DataSeeder";
import RequireAuth from "@/components/RequireAuth";
import Navbar from "@/components/Navbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/create-skill" element={<RequireAuth><CreateSkill /></RequireAuth>} />
          <Route path="/my-skills" element={<RequireAuth><MySkills /></RequireAuth>} />
          <Route path="/skills/:skillId" element={<SkillDetail />} />
          <Route path="/course/:skillId" element={<RequireAuth><CourseManagement /></RequireAuth>} />
          <Route path="/my-course/:skillId" element={<RequireAuth><CourseDetail /></RequireAuth>} />
          <Route path="/data-seeder" element={<DataSeeder />} />
          <Route path="/login" element={<Login />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
