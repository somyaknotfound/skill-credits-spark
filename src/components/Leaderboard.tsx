import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Zap } from "lucide-react";

interface LeaderboardProps {
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
    level: number;
    credits: number;
    rating: number;
    skillsTaught: number;
    rank: number;
  }>;
}

export const Leaderboard = ({ users }: LeaderboardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-accent" />;
      case 2: return <Medal className="h-6 w-6 text-muted-foreground" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1: return "gold";
      case 2: return "gaming";
      case 3: return "level";
      default: return "outline";
    }
  };

  return (
    <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-accent" />
          <span>Top Instructors</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center space-x-4 p-4 rounded-lg transition-smooth hover:shadow-glow ${
              user.rank <= 3 
                ? 'bg-gradient-hero border border-accent/30 shadow-accent' 
                : 'bg-gradient-card hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-center w-12 h-12">
              {getRankIcon(user.rank)}
            </div>
            
            <Avatar className="h-12 w-12 border-2 border-primary/30">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gradient-primary text-foreground font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold truncate">{user.name}</h3>
                <Badge variant="level" className="text-xs">
                  LVL {user.level}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>⭐ {user.rating}</span>
                <span>📚 {user.skillsTaught} skills</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-1 text-accent font-bold">
                <span className="text-lg">{user.credits}</span>
                <span className="text-sm">credits</span>
              </div>
              <Badge variant={getRankBadgeVariant(user.rank)} className="text-xs">
                Rank #{user.rank}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};