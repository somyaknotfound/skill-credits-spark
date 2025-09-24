import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkillCard } from "@/components/SkillCard";
import { Search, Code, Music, Palette, Camera, Globe, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Marketplace = () => {
  const { toast } = useToast();

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
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Skill Marketplace
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover amazing skills taught by expert instructors. Earn credits by teaching and spend them to learn new abilities.
            </p>
          </div>

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
      </div>
    </div>
  );
};

export default Marketplace;