import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, BookOpen, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const CreateSkill = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [creditPrice, setCreditPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !difficulty || !creditPrice) {
      toast({ title: "Missing fields", description: "Please fill required fields." });
      return;
    }
    try {
      setSubmitting(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error("Not authenticated");

      // Check if skill already exists, if not create it
      let { data: existingSkill } = await supabase
        .from("skills")
        .select("id")
        .eq("name", title)
        .eq("category", category)
        .single();

      let skill;
      if (existingSkill) {
        skill = existingSkill;
      } else {
        const { data: newSkill, error: skillErr } = await supabase
          .from("skills")
          .insert({
            name: title,
            category,
            description,
            difficulty_level: difficulty || "beginner",
          })
          .select("id")
          .single();
        if (skillErr) throw skillErr;
        skill = newSkill;
      }

      // Create listing for this user
      const { error: listErr } = await supabase
        .from("skill_listings")
        .insert({
          user_id: user.id,
          skill_id: skill.id,
          title,
          description,
          credit_price: Number(creditPrice) || 10,
          duration_minutes: durationMinutes ? Number(durationMinutes) : null,
          is_active: true,
        });
      if (listErr) throw listErr;

      toast({
        title: "Skill Created! 🎉",
        description: "Your skill has been added to the marketplace.",
      });
      navigate("/marketplace");
    } catch (err: any) {
      toast({ title: "Failed to create skill", description: err.message || String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Create a Skill
            </h1>
            <p className="text-muted-foreground">
              Share your expertise and earn credits by teaching others
            </p>
          </div>

          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Skill Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Skill Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Advanced React Patterns" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="programming">Programming</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="languages">Languages</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what students will learn..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Duration</span>
                    </Label>
                    <Input id="duration" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="e.g., 60 (minutes)" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="credits" className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Credits</span>
                    </Label>
                    <Input id="credits" type="number" value={creditPrice} onChange={(e) => setCreditPrice(e.target.value)} placeholder="150" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" variant="gaming" disabled={submitting}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {submitting ? "Creating..." : "Create Skill"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateSkill;