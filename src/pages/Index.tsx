import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SkillCard } from "@/components/SkillCard";
import { UserProfile } from "@/components/UserProfile";
import { Leaderboard } from "@/components/Leaderboard";
import { Search, BookOpen, Users, Star, TrendingUp, Zap, Brain, Code, Music, Palette, Camera, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-skillswap.jpg";

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"marketplace" | "profile" | "leaderboard">("marketplace");

  // Mock data
  const currentUser = {
    id: "1",
    name: "Alex Chen",
    avatar: "",
    level: 15,
    xp: 2800,
    xpToNextLevel: 3500,
    credits: 2450,
    skillsTaught: 12,
    skillsLearned: 8,
    rating: 4.9,
    badges: [
      { id: "1", name: "Master Teacher", icon: "🎓", description: "Taught 10+ skills", rarity: "epic" as const },
      { id: "2", name: "Quick Learner", icon: "⚡", description: "Learned 5 skills in a week", rarity: "rare" as const },
      { id: "3", name: "Community Hero", icon: "🏆", description: "Top 10 instructor", rarity: "legendary" as const },
      { id: "4", name: "Early Adopter", icon: "🚀", description: "First 100 users", rarity: "common" as const },
    ],
    achievements: [
      { id: "1", name: "First Skill", description: "Taught your first skill", unlockedAt: "2024-01-15" },
      { id: "2", name: "Student's Choice", description: "Received 50+ positive reviews", unlockedAt: "2024-02-20" },
    ]
  };

  const skills = [
    {
      id: "1",
      title: "Web Development Fundamentals",
      category: "Programming",
      instructor: { name: "Sarah Johnson", avatar: "", level: 22, rating: 4.9 },
      duration: "4 weeks",
      students: 234,
      cost: 150,
      difficulty: "Beginner" as const,
      tags: ["HTML", "CSS", "JavaScript"]
    },
    {
      id: "2", 
      title: "Advanced React Patterns",
      category: "Programming",
      instructor: { name: "Mike Rodriguez", avatar: "", level: 28, rating: 4.8 },
      duration: "6 weeks",
      students: 89,
      cost: 300,
      difficulty: "Advanced" as const,
      tags: ["React", "TypeScript", "Hooks"]
    },
    {
      id: "3",
      title: "Guitar for Beginners",
      category: "Music",
      instructor: { name: "Emma Wilson", avatar: "", level: 18, rating: 4.7 },
      duration: "8 weeks", 
      students: 156,
      cost: 120,
      difficulty: "Beginner" as const,
      tags: ["Acoustic", "Chords", "Strumming"]
    },
    {
      id: "4",
      title: "Digital Photography Masterclass",
      category: "Creative",
      instructor: { name: "David Kim", avatar: "", level: 25, rating: 4.9 },
      duration: "5 weeks",
      students: 67,
      cost: 200,
      difficulty: "Intermediate" as const,
      tags: ["DSLR", "Lighting", "Composition"]
    }
  ];

  const leaderboardUsers = [
    { id: "1", name: "Sarah Johnson", avatar: "", level: 32, credits: 5420, rating: 4.9, skillsTaught: 28, rank: 1 },
    { id: "2", name: "Mike Rodriguez", avatar: "", level: 28, credits: 4850, rating: 4.8, skillsTaught: 22, rank: 2 },
    { id: "3", name: "Emma Wilson", avatar: "", level: 25, credits: 4200, rating: 4.7, skillsTaught: 19, rank: 3 },
    { id: "4", name: "David Kim", avatar: "", level: 24, credits: 3950, rating: 4.6, skillsTaught: 17, rank: 4 },
    { id: "5", name: "Lisa Park", avatar: "", level: 21, credits: 3650, rating: 4.5, skillsTaught: 15, rank: 5 },
  ];

  const categories = [
    { name: "Programming", icon: Code, count: 124, color: "text-primary" },
    { name: "Design", icon: Palette, count: 89, color: "text-secondary" },
    { name: "Music", icon: Music, count: 67, color: "text-accent" },
    { name: "Photography", icon: Camera, count: 45, color: "text-success" },
    { name: "Languages", icon: Globe, count: 156, color: "text-destructive" },
    { name: "Business", icon: TrendingUp, count: 78, color: "text-muted-foreground" },
  ];

  const handleLearnSkill = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      toast({
        title: "Skill Enrolled! 🎉",
        description: `You've enrolled in "${skill.title}" for ${skill.cost} credits.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge variant="gaming" className="animate-pulse-glow">
              🚀 Welcome to the Future of Learning
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-slide-up">
              SkillSwap
            </h1>
            <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto">
              Trade skills, earn credits, level up! Join the gamified peer-to-peer learning revolution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="hero" size="xl" className="group">
                <BookOpen className="mr-2 h-5 w-5 group-hover:animate-scale-bounce" />
                Start Learning
              </Button>
              <Button variant="outline" size="xl">
                <Users className="mr-2 h-5 w-5" />
                Teach a Skill
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">2.4K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">850+</div>
                <div className="text-sm text-muted-foreground">Skills Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">95%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success">24/7</div>
                <div className="text-sm text-muted-foreground">Learning Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <Button
            variant={activeTab === "marketplace" ? "gaming" : "ghost"}
            onClick={() => setActiveTab("marketplace")}
            className="flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>Marketplace</span>
          </Button>
          <Button
            variant={activeTab === "profile" ? "gaming" : "ghost"}
            onClick={() => setActiveTab("profile")}
            className="flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>My Profile</span>
          </Button>
          <Button
            variant={activeTab === "leaderboard" ? "gaming" : "ghost"}
            onClick={() => setActiveTab("leaderboard")}
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Leaderboard</span>
          </Button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "marketplace" && (
          <div className="space-y-8">
            {/* Search and Categories */}
            <div className="space-y-6">
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search skills..."
                    className="pl-10 bg-card border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((category) => (
                  <Card key={category.name} className="bg-gradient-glass backdrop-blur-sm border-border/50 hover:shadow-glow transition-smooth cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <category.icon className={`h-8 w-8 mx-auto mb-2 ${category.color} group-hover:animate-scale-bounce`} />
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">{category.count} skills</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onLearn={handleLearnSkill}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="max-w-4xl mx-auto">
            <UserProfile user={currentUser} />
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="max-w-2xl mx-auto">
            <Leaderboard users={leaderboardUsers} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;