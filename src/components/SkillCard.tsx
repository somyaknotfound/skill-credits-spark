import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Users, Zap, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SkillCardProps {
  skill: {
    id: string;
    title: string;
    category: string;
    instructor: {
      name: string;
      avatar?: string;
      level: number;
      rating?: number;
      credits: number;
    };
    duration: string;
    students?: number;
    cost: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    tags?: string[];
  };
  onLearn: (skillId: string) => void;
  discountPercentage?: number;
  currentUserCredits?: number;
  loading?: boolean;
  isPurchased?: boolean;
  onViewCourse?: (skillId: string) => void;
}

export const SkillCard = ({ skill, onLearn, discountPercentage = 0, currentUserCredits = 0, loading = false, isPurchased = false, onViewCourse }: SkillCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/skills/${skill.id}`);
  };
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "success";
      case "Intermediate": return "gaming";
      case "Advanced": return "destructive";
      default: return "default";
    }
  };

  const discountedPrice = Math.round(skill.cost * (100 - discountPercentage) / 100);
  const canAfford = currentUserCredits >= discountedPrice;
  const hasDiscount = discountPercentage > 0;

  return (
    <Card 
      onClick={handleCardClick}
      className="group bg-gradient-glass backdrop-blur-sm border-border/50 hover:border-primary/50 transition-smooth hover:shadow-glow cursor-pointer"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-smooth">
                {skill.title}
              </CardTitle>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-smooth" />
            </div>
            <Badge variant="outline">{skill.category}</Badge>
          </div>
          <Badge variant={getDifficultyVariant(skill.difficulty)}>
            {skill.difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={skill.instructor.avatar} />
            <AvatarFallback className="bg-gradient-primary text-foreground font-semibold">
              {skill.instructor.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium truncate">{skill.instructor.name}</p>
              <Badge variant="level" className="text-xs">
                LVL {skill.instructor.level}
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {skill.instructor.rating && (
                <>
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <span>{skill.instructor.rating}</span>
                </>
              )}
              <Zap className="h-3 w-3 text-primary" />
              <span>{skill.instructor.credits} credits</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{skill.duration}</span>
          </div>
          {skill.students && (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{skill.students} students</span>
            </div>
          )}
        </div>

        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skill.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-2">
          {hasDiscount && (
            <div className="flex items-center justify-between bg-accent/10 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs animate-pulse">
                  {discountPercentage}% OFF
                </Badge>
                <span className="text-xs text-muted-foreground">Credit similarity bonus!</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isPurchased ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-500 font-medium">Purchased</span>
                </div>
              ) : (
                <>
                  {hasDiscount && (
                    <span className="text-sm line-through text-muted-foreground">{skill.cost}</span>
                  )}
                  <span className={`text-lg font-bold ${hasDiscount ? 'text-accent' : 'text-foreground'}`}>
                    {hasDiscount ? discountedPrice : skill.cost}
                  </span>
                  <span className="text-sm text-muted-foreground">credits</span>
                </>
              )}
            </div>
            {isPurchased ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewCourse ? onViewCourse(skill.id) : navigate(`/my-course/${skill.id}`)}
              >
                View Course
              </Button>
            ) : (
              <Button 
                variant={canAfford ? "gaming" : "outline"} 
                size="sm"
                onClick={() => onLearn(skill.id)}
                className={canAfford ? "animate-pulse-glow" : ""}
                disabled={!canAfford || loading}
              >
                {loading ? 'Processing...' : !canAfford ? 'Need More Credits' : 'Learn Now'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};