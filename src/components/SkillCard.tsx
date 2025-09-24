import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Users } from "lucide-react";

interface SkillCardProps {
  skill: {
    id: string;
    title: string;
    category: string;
    instructor: {
      name: string;
      avatar?: string;
      level: number;
      rating: number;
    };
    duration: string;
    students: number;
    cost: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    tags: string[];
  };
  onLearn: (skillId: string) => void;
}

export const SkillCard = ({ skill, onLearn }: SkillCardProps) => {
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "success";
      case "Intermediate": return "gaming";
      case "Advanced": return "destructive";
      default: return "default";
    }
  };

  return (
    <Card className="group bg-gradient-glass backdrop-blur-sm border-border/50 hover:border-primary/50 transition-smooth hover:shadow-glow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-smooth">
              {skill.title}
            </CardTitle>
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
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span>{skill.instructor.rating}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{skill.duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{skill.students} students</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {skill.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-accent">{skill.cost}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
          <Button 
            variant="gaming" 
            size="sm"
            onClick={() => onLearn(skill.id)}
            className="animate-pulse-glow"
          >
            Learn Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};