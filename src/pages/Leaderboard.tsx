import { useState } from "react";
import { LeaderboardEnhanced } from "@/components/LeaderboardEnhanced";
import { useLeaderboardEnhanced, TimePeriod } from "@/hooks/useLeaderboardEnhanced";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Zap, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Star,
  Activity,
  Target,
  Award
} from "lucide-react";

const Leaderboard = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all_time');
  const { 
    users, 
    loading, 
    error, 
    refreshing,
    lastUpdated,
    refetch, 
    refreshLeaderboards,
    debugDataFlow 
  } = useLeaderboardEnhanced(timePeriod);

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };

  const getTimePeriodStats = () => {
    if (!users.length) return null;
    
    const totalCredits = users.reduce((sum, user) => sum + user.total_credits, 0);
    const totalSkills = users.reduce((sum, user) => sum + user.skills_taught, 0);
    const totalStudents = users.reduce((sum, user) => sum + user.students_taught, 0);
    const avgRating = users.reduce((sum, user) => sum + user.avg_rating, 0) / users.length;

    return {
      totalCredits,
      totalSkills,
      totalStudents,
      avgRating: avgRating.toFixed(1)
    };
  };

  const stats = getTimePeriodStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <Trophy className="h-12 w-12 text-yellow-500 animate-pulse" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <Trophy className="h-12 w-12 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Top performers in the SkillSwap community. Teach skills, earn credits, and climb the ranks!
            </p>
            
            {/* Platform Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <Card className="bg-background/20 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold">{stats.totalCredits}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Credits Earned</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/20 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <span className="text-2xl font-bold">{stats.totalSkills}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Skills Taught</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/20 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Users className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-bold">{stats.totalStudents}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Students Taught</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/20 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{stats.avgRating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <LeaderboardEnhanced
            users={users}
            loading={loading}
            error={error}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            timePeriod={timePeriod}
            onTimePeriodChange={handleTimePeriodChange}
            onRefresh={refreshLeaderboards}
            onDebug={debugDataFlow}
          />
        </div>
      </div>

      {/* Call to Action */}
      {users.length === 0 && !loading && (
        <div className="bg-gradient-card py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-center space-x-3">
                <Target className="h-8 w-8 text-accent" />
                <h2 className="text-3xl font-bold">Ready to Start Teaching?</h2>
                <Target className="h-8 w-8 text-accent" />
              </div>
              <p className="text-lg text-muted-foreground">
                Share your knowledge, earn credits, and help others learn. Be the first to appear on the leaderboard!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="animate-pulse-glow"
                  onClick={() => window.location.href = '/create-skill'}
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Create Your First Skill
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = '/marketplace'}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Browse Marketplace
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;