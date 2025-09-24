import { UserProfile } from "@/components/UserProfile";

const Profile = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <UserProfile user={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default Profile;