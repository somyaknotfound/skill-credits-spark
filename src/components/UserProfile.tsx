import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, BookOpen, Users, Coins } from "lucide-react";

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    credits: number;
    skillsTaught: number;
    skillsLearned: number;
    rating: number;
    badges: Array<{
      id: string;
      name: string;
      icon: string;
      description: string;
      rarity: "common" | "rare" | "epic" | "legendary";
    }>;
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      unlockedAt: string;
    }>;
  };
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const getBadgeVariant = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "gold";
      case "epic": return "gaming";
      case "rare": return "level";
      case "common": return "secondary";
      default: return "outline";
    }
  };

  const xpProgress = (user.xp / user.xpToNextLevel) * 100;

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-primary shadow-glow">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gradient-primary text-foreground text-2xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="level" className="text-sm">
                  Level {user.level}
                </Badge>
                <div className="flex items-center space-x-1 text-accent">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{user.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-6">
          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Experience Points</span>
              <span className="font-semibold">{user.xp} / {user.xpToNextLevel} XP</span>
            </div>
            <Progress value={xpProgress} variant="level" className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-card">
              <div className="p-2 rounded-full bg-accent/20">
                <Coins className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{user.credits}</p>
                <p className="text-xs text-muted-foreground">Credits</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-card">
              <div className="p-2 rounded-full bg-primary/20">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user.skillsTaught}</p>
                <p className="text-xs text-muted-foreground">Skills Taught</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-card">
              <div className="p-2 rounded-full bg-secondary/20">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user.skillsLearned}</p>
                <p className="text-xs text-muted-foreground">Skills Learned</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-card">
              <div className="p-2 rounded-full bg-success/20">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user.badges.length}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-accent" />
            <span>Badges & Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {user.badges.map((badge) => (
              <div key={badge.id} className="flex items-center space-x-2 p-3 rounded-lg bg-gradient-card hover:shadow-glow transition-smooth">
                <div className="text-2xl">{badge.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{badge.name}</p>
                  <Badge variant={getBadgeVariant(badge.rarity)} className="text-xs">
                    {badge.rarity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};