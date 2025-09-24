import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, Star, Edit, Eye, Trash2, Play, CheckCircle } from "lucide-react";

const MySkills = () => {
  const [activeTab, setActiveTab] = useState("teaching");

  const teachingSkills = [
    {
      id: "1",
      title: "Advanced React Patterns",
      category: "Programming",
      students: 15,
      rating: 4.8,
      status: "active",
      earnings: 450,
      nextSession: "Tomorrow 2:00 PM"
    },
    {
      id: "2",
      title: "TypeScript Fundamentals", 
      category: "Programming",
      students: 8,
      rating: 4.9,
      status: "active",
      earnings: 240,
      nextSession: "Friday 10:00 AM"
    }
  ];

  const learningSkills = [
    {
      id: "1",
      title: "Digital Photography Masterclass",
      instructor: "David Kim",
      progress: 75,
      status: "in-progress",
      nextSession: "Wednesday 3:00 PM",
      rating: 4.9
    },
    {
      id: "2", 
      title: "Guitar for Beginners",
      instructor: "Emma Wilson",
      progress: 30,
      status: "in-progress", 
      nextSession: "Thursday 6:00 PM",
      rating: 4.7
    },
    {
      id: "3",
      title: "UI/UX Design Basics",
      instructor: "Sarah Johnson",
      progress: 100,
      status: "completed",
      completedDate: "2024-01-15",
      rating: 4.8
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300";
      case "in-progress":
        return "bg-blue-500/20 text-blue-300";
      case "completed":
        return "bg-purple-500/20 text-purple-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            My Skills
          </h1>
          <p className="text-muted-foreground">
            Manage your teaching and learning journey
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teaching" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Teaching ({teachingSkills.length})</span>
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Learning ({learningSkills.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teaching" className="space-y-4">
              {teachingSkills.map((skill) => (
                <Card key={skill.id} className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center space-x-2">
                          <span>{skill.title}</span>
                          <Badge variant="outline">{skill.category}</Badge>
                        </CardTitle>
                        <Badge className={getStatusColor(skill.status)}>
                          {skill.status}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{skill.students}</div>
                        <div className="text-sm text-muted-foreground">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-2xl font-bold">{skill.rating}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{skill.earnings}</div>
                        <div className="text-sm text-muted-foreground">Credits Earned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{skill.nextSession}</div>
                        <div className="text-xs text-muted-foreground">Next Session</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="learning" className="space-y-4">
              {learningSkills.map((skill) => (
                <Card key={skill.id} className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center space-x-2">
                          <span>{skill.title}</span>
                          {skill.status === "completed" && (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Instructor: {skill.instructor}
                        </p>
                        <Badge className={getStatusColor(skill.status)}>
                          {skill.status.replace("-", " ")}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {skill.status === "completed" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">100%</div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-2xl font-bold">{skill.rating}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">Your Rating</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">{skill.progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                            style={{ width: `${skill.progress}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{skill.nextSession}</div>
                          <div className="text-xs text-muted-foreground">Next Session</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MySkills;