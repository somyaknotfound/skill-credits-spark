import { useState } from "react";
import { Leaderboard as LeaderboardComponent } from "@/components/Leaderboard";
import { useLeaderboard, TimePeriod } from "@/hooks/useLeaderboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertCircle, TrendingUp, Trophy, Users, Star } from "lucide-react";

const Leaderboard = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all_time');
  const { users, loading, error, refetch } = useLeaderboard(timePeriod);

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };

  const getTimePeriodStats = () => {
    const totalInstructors = users.length;
    const totalCredits = users.reduce((sum, user) => sum + user.total_credits, 0);
    const avgRating = users.length > 0 
      ? users.reduce((sum, user) => sum + user.avg_rating, 0) / users.length 
      : 0;

    return { totalInstructors, totalCredits, avgRating };
  };

  const stats = getTimePeriodStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Top performers in the SkillSwap community. Teach skills, earn credits, and climb the ranks!
          </p>
        </div>

        {/* Stats Overview */}
        {!loading && !error && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stats.totalInstructors}</div>
                <div className="text-sm text-muted-foreground">Active Instructors</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl font-bold">{stats.totalCredits}</div>
                <div className="text-sm text-muted-foreground">Total Credits Earned</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-success" />
                <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <div>
                    <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load leaderboard</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={refetch} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <LeaderboardComponent 
              users={users}
              loading={loading}
              error={error}
              timePeriod={timePeriod}
              onTimePeriodChange={handleTimePeriodChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;