import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Star, TrendingUp, Zap, Brain, Code, Music, Palette, Camera, Globe, Plus, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-skillswap.jpg";

const Index = () => {
  const navigationCards = [
    {
      title: "Skill Marketplace",
      description: "Discover and learn new skills from expert instructors",
      icon: BookOpen,
      link: "/marketplace",
      color: "text-primary",
      stats: "850+ Skills Available"
    },
    {
      title: "Create a Skill",
      description: "Share your expertise and start earning credits",
      icon: Plus,
      link: "/create-skill",
      color: "text-secondary", 
      stats: "Earn Credits Teaching"
    },
    {
      title: "My Skills",
      description: "Manage your teaching and learning progress",
      icon: Brain,
      link: "/my-skills",
      color: "text-accent",
      stats: "Track Your Journey"
    },
    {
      title: "My Profile",
      description: "View your achievements, badges, and progress",
      icon: Users,
      link: "/profile",
      color: "text-success",
      stats: "Level Up & Earn Badges"
    },
    {
      title: "Leaderboard",
      description: "See top performers and compete with the community",
      icon: BarChart3,
      link: "/leaderboard", 
      color: "text-destructive",
      stats: "Climb the Rankings"
    }
  ];

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
              <Link to="/marketplace">
                <Button variant="hero" size="xl" className="group">
                  <BookOpen className="mr-2 h-5 w-5 group-hover:animate-scale-bounce" />
                  Start Learning
                </Button>
              </Link>
              <Link to="/create-skill">
                <Button variant="outline" size="xl">
                  <Users className="mr-2 h-5 w-5" />
                  Teach a Skill
                </Button>
              </Link>
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

      {/* Navigation Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Explore SkillSwap
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose your path in the gamified learning ecosystem. Teach, learn, and level up!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {navigationCards.map((card) => (
            <Link key={card.title} to={card.link}>
              <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 hover:shadow-glow transition-smooth cursor-pointer group h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <card.icon className={`h-6 w-6 ${card.color} group-hover:animate-scale-bounce`} />
                    <span>{card.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{card.description}</p>
                  <Badge variant="outline" className="w-full justify-center">
                    {card.stats}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 text-center p-6">
            <div className="text-3xl font-bold text-primary mb-2">
              <Code className="h-8 w-8 mx-auto mb-2" />
              124
            </div>
            <div className="text-sm text-muted-foreground">Programming Skills</div>
          </Card>
          
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 text-center p-6">
            <div className="text-3xl font-bold text-secondary mb-2">
              <Palette className="h-8 w-8 mx-auto mb-2" />
              89
            </div>
            <div className="text-sm text-muted-foreground">Design Skills</div>
          </Card>
          
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 text-center p-6">
            <div className="text-3xl font-bold text-accent mb-2">
              <Music className="h-8 w-8 mx-auto mb-2" />
              67
            </div>
            <div className="text-sm text-muted-foreground">Music Skills</div>
          </Card>
          
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 text-center p-6">
            <div className="text-3xl font-bold text-success mb-2">
              <Star className="h-8 w-8 mx-auto mb-2" />
              4.8
            </div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;