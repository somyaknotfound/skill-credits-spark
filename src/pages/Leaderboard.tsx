import { Leaderboard as LeaderboardComponent } from "@/components/Leaderboard";

const Leaderboard = () => {
  const leaderboardUsers = [
    { id: "1", name: "Sarah Johnson", avatar: "", level: 32, credits: 5420, rating: 4.9, skillsTaught: 28, rank: 1 },
    { id: "2", name: "Mike Rodriguez", avatar: "", level: 28, credits: 4850, rating: 4.8, skillsTaught: 22, rank: 2 },
    { id: "3", name: "Emma Wilson", avatar: "", level: 25, credits: 4200, rating: 4.7, skillsTaught: 19, rank: 3 },
    { id: "4", name: "David Kim", avatar: "", level: 24, credits: 3950, rating: 4.6, skillsTaught: 17, rank: 4 },
    { id: "5", name: "Lisa Park", avatar: "", level: 21, credits: 3650, rating: 4.5, skillsTaught: 15, rank: 5 },
    { id: "6", name: "Alex Chen", avatar: "", level: 15, credits: 2450, rating: 4.9, skillsTaught: 12, rank: 8 },
  ];

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
        
        <div className="max-w-2xl mx-auto">
          <LeaderboardComponent users={leaderboardUsers} />
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;