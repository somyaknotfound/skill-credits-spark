import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Medal, 
  Award, 
  Zap, 
  Flame, 
  Calendar, 
  Clock, 
  Star, 
  Users, 
  BookOpen,
  RefreshCw,
  TrendingUp,
  Activity,
  Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LeaderboardUser, TimePeriod } from "@/hooks/useLeaderboardEnhanced";

interface LeaderboardEnhancedProps {
  users: LeaderboardUser[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  lastUpdated: Date | null;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  onRefresh: () => void;
  onDebug: () => void;
}

export const LeaderboardEnhanced = ({ 
  users, 
  loading, 
  error, 
  refreshing,
  lastUpdated,
  timePeriod, 
  onTimePeriodChange, 
  onRefresh,
  onDebug
}: LeaderboardEnhancedProps) => {
  const navigate = useNavigate();

  const handleUserClick = (instructorId: string, username: string) => {
    navigate(`/instructor/${username || instructorId}`);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500 animate-pulse" />;
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

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/20">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );

  // Enhanced empty state
  const EmptyState = () => {
    const getEmptyStateContent = () => {
      switch (timePeriod) {
        case 'weekly':
          return {
            icon: <Calendar className="h-16 w-16 text-muted-foreground" />,
            title: "No Activity This Week",
            description: "Be the first to earn credits this week! Start teaching or complete a course to join the rankings.",
            actions: [
              { label: "Create a Skill", action: '/create-skill' },
              { label: "Browse Marketplace", action: '/marketplace' }
            ]
          };
        case 'monthly':
          return {
            icon: <Clock className="h-16 w-16 text-muted-foreground" />,
            title: "No Activity This Month",
            description: "Start teaching and climb to the top! Share your knowledge and earn credits this month.",
            actions: [
              { label: "Start Teaching", action: '/create-skill' },
              { label: "View Profile", action: '/profile' }
            ]
          };
        default:
          return {
            icon: <Trophy className="h-16 w-16 text-muted-foreground" />,
            title: "No Instructors Yet",
            description: "Be the first to teach a skill and appear on the leaderboard! Share your knowledge and earn credits.",
            actions: [
              { label: "Create Your First Skill", action: '/create-skill' },
              { label: "Learn How It Works", action: '/marketplace' }
            ]
          };
      }
    };

    const content = getEmptyStateContent();

    return (
      <div className="text-center py-12 space-y-6">
        <div className="animate-bounce">
          {content.icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{content.title}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {content.description}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {content.actions.map((action, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              onClick={() => window.location.href = action.action}
              className="animate-pulse-glow"
            >
              {action.label}
            </Button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          <p>💡 Tip: Complete courses to earn credits and climb the rankings!</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-accent" />
            <span>Top Instructors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-destructive text-6xl">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load leaderboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={onDebug} variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Debug
                </Button>
              </div>
            </div>
          </div>
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
            {lastUpdated && (
              <span className="text-xs text-muted-foreground ml-2">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={onDebug}
              variant="outline"
              size="sm"
            >
              <Activity className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Tabs value={timePeriod} onValueChange={onTimePeriodChange} className="w-full">
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
      </CardHeader>
      
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <EmptyState />
        ) : (
          users.map((user, index) => (
            <div
              key={user.instructor_id}
              onClick={() => handleUserClick(user.instructor_id, user.username)}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 hover:shadow-glow cursor-pointer group ${
                user.rank_position <= 3 
                  ? 'bg-gradient-hero border border-accent/30 shadow-accent animate-pulse-glow' 
                  : 'bg-gradient-card hover:bg-muted/50'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'slideInUp 0.5s ease-out forwards'
              }}
            >
              <div className="flex items-center justify-center w-12 h-12">
                {getRankIcon(user.rank_position)}
              </div>
              
              <Avatar className="h-12 w-12 border-2 border-primary/30 group-hover:border-primary/60 transition-colors">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-foreground font-semibold">
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                    {user.full_name}
                  </h3>
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
                    <BookOpen className="h-3 w-3" />
                    <span>{user.skills_taught} skills</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{user.students_taught} students</span>
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
                {user.courses_completed > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {user.courses_completed} completed
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
