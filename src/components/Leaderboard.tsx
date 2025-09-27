import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Zap, Flame, Calendar, Clock, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LeaderboardUser, TimePeriod } from "@/hooks/useLeaderboard";

interface LeaderboardProps {
  users: LeaderboardUser[];
  loading: boolean;
  error: string | null;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export const Leaderboard = ({ 
  users, 
  loading, 
  error, 
  timePeriod, 
  onTimePeriodChange 
}: LeaderboardProps) => {
  const navigate = useNavigate();

  const handleUserClick = (userId: string, username: string) => {
    navigate(`/instructor/${username || userId}`);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1: return "default";
      case 2: return "secondary";
      case 3: return "outline";
      default: return "outline";
    }
  };

  const getTimePeriodIcon = (period: TimePeriod) => {
    switch (period) {
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'monthly': return <Clock className="h-4 w-4" />;
      case 'all_time': return <Trophy className="h-4 w-4" />;
    }
  };

  const getTimePeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'all_time': return 'All-Time';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Leaderboard</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-accent" />
            <span>Top Instructors</span>
          </CardTitle>
          <Tabs value={timePeriod} onValueChange={onTimePeriodChange} className="w-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly" className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span className="hidden sm:inline">Weekly</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span className="hidden sm:inline">Monthly</span>
              </TabsTrigger>
              <TabsTrigger value="all_time" className="flex items-center space-x-1">
                <Trophy className="h-3 w-3" />
                <span className="hidden sm:inline">All-Time</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Instructors Yet</h3>
            <p className="text-muted-foreground">
              {timePeriod === 'weekly' 
                ? "No activity this week. Check back later!" 
                : timePeriod === 'monthly'
                ? "No activity this month. Check back later!"
                : "Be the first to teach a skill and appear on the leaderboard!"
              }
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.user_id}
              onClick={() => handleUserClick(user.user_id, user.username)}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-smooth hover:shadow-glow cursor-pointer ${
                user.rank_position <= 3 
                  ? 'bg-gradient-hero border border-accent/30 shadow-accent' 
                  : 'bg-gradient-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-center w-12 h-12">
                {getRankIcon(user.rank_position)}
              </div>
              
              <Avatar className="h-12 w-12 border-2 border-primary/30">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-foreground font-semibold">
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold truncate">{user.full_name}</h3>
                  <Badge variant="level" className="text-xs">
                    LVL {user.level}
                  </Badge>
                  {user.is_trending && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      <Flame className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>{user.avg_rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{user.skills_taught} skills</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-1 text-accent font-bold">
                  <span className="text-lg">{user.total_credits}</span>
                  <span className="text-sm">credits</span>
                </div>
                <Badge variant={getRankBadgeVariant(user.rank_position)} className="text-xs">
                  Rank #{user.rank_position}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};