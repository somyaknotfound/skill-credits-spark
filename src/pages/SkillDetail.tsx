import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star, Users, Clock, DollarSign, BookOpen, User, Calendar } from "lucide-react";

interface SkillDetail {
  id: string;
  title: string;
  description: string;
  credit_price: number;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  skills: {
    name: string;
    category: string;
    difficulty_level: string;
  };
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
    level: number;
    credits: number;
  };
  instructor_id: string;
}

interface SkillStats {
  learners_count: number;
  average_rating: number;
  total_reviews: number;
}

const SkillDetail = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [currentUserCredits, setCurrentUserCredits] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (skillId) {
      fetchSkillDetails();
      checkRegistrationStatus();
    }
  }, [skillId]);

  const fetchSkillDetails = async () => {
    try {
      setLoading(true);
      
      // Get current user's credits
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setCurrentUserCredits(profile.credits);
        }
      }

      // Fetch skill details
      const { data, error } = await supabase
        .from('skill_listings')
        .select(`
          id,
          title,
          description,
          credit_price,
          duration_minutes,
          is_active,
          created_at,
          user_id,
          skills (
            name,
            category,
            difficulty_level
          ),
          profiles (
            username,
            full_name,
            avatar_url,
            level,
            credits
          )
        `)
        .eq('id', skillId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Skill not found');

      setSkill({
        ...data,
        instructor_id: data.user_id
      });

      // Fetch skill stats
      await fetchSkillStats(skillId);
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to load skill details",
        variant: "destructive"
      });
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillStats = async (skillListingId: string) => {
    try {
      // Get number of learners (purchases)
      const { count: learnersCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('skill_listing_id', skillListingId)
        .eq('transaction_type', 'purchase');

      // Get average rating from reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('skill_listing_id', skillListingId);

      const averageRating = reviews && reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      setStats({
        learners_count: learnersCount || 0,
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: reviews?.length || 0
      });
    } catch (error) {
      console.error('Error fetching skill stats:', error);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('skill_listing_id', skillId)
        .eq('transaction_type', 'purchase')
        .single();

      setIsRegistered(!!data);
    } catch (error) {
      // User not registered
      setIsRegistered(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in", description: "You need to be signed in to register for skills." });
        navigate('/login');
        return;
      }

      if (!skill) return;

      // Check if user has enough credits
      if (currentUserCredits < skill.credit_price) {
        toast({ 
          title: "Insufficient Credits", 
          description: `You need ${skill.credit_price} credits but only have ${currentUserCredits}.`,
          variant: "destructive"
        });
        return;
      }

      // Use the existing purchase function
      const { data, error } = await supabase.rpc('purchase_skill_with_discount', {
        p_skill_listing_id: skillId,
        p_student_id: user.id
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: "Registration Successful! 🎉",
          description: `You've successfully registered for ${skill.title}.`,
        });
        
        // Update local state
        setIsRegistered(true);
        setCurrentUserCredits(prev => prev - result.final_amount);
        
        // Redirect to My Skills after a short delay
        setTimeout(() => {
          navigate('/my-skills');
        }, 2000);
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({ 
        title: "Registration Failed", 
        description: err.message || "Failed to register for skill",
        variant: "destructive"
      });
    } finally {
      setRegistering(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-300';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
      case 'advanced': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading skill details...</p>
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Skill Not Found</h1>
          <p className="text-muted-foreground">The skill you're looking for doesn't exist or is no longer available.</p>
          <Button onClick={() => navigate('/marketplace')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Button */}
          <Button 
            onClick={() => navigate('/marketplace')} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Skill Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skill Header */}
              <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl">{skill.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{skill.skills.category}</Badge>
                        <Badge className={getDifficultyColor(skill.skills.difficulty_level)}>
                          {skill.skills.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-accent">{skill.credit_price}</div>
                      <div className="text-sm text-muted-foreground">credits</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {skill.description || "No description available."}
                  </p>
                </CardContent>
              </Card>

              {/* Instructor Info */}
              <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Instructor</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={skill.profiles.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-foreground font-semibold text-lg">
                        {skill.profiles.full_name?.split(' ').map(n => n[0]).join('') || 
                         skill.profiles.username?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">
                        {skill.profiles.full_name || skill.profiles.username}
                      </h3>
                      <p className="text-muted-foreground">Level {skill.profiles.level}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm">{stats?.average_rating || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {stats?.learners_count || 0} learners
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skill Stats */}
              <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Course Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">
                        {skill.duration_minutes ? `${Math.round(skill.duration_minutes / 60)}h` : 'Flexible'}
                      </div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </div>
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-accent" />
                      <div className="text-2xl font-bold">{stats?.learners_count || 0}</div>
                      <div className="text-sm text-muted-foreground">Learners</div>
                    </div>
                    <div className="text-center">
                      <Star className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                      <div className="text-2xl font-bold">{stats?.average_rating || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-success" />
                      <div className="text-2xl font-bold">
                        {new Date(skill.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Created</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Registration */}
            <div className="space-y-6">
              <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Registration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent mb-2">{skill.credit_price}</div>
                    <div className="text-muted-foreground">credits required</div>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    Your credits: <span className="font-semibold text-foreground">{currentUserCredits}</span>
                  </div>

                  {isRegistered ? (
                    <div className="text-center space-y-2">
                      <div className="text-green-400 font-semibold">✓ Already Registered</div>
                      <Button 
                        onClick={() => navigate('/my-skills')} 
                        className="w-full"
                        variant="outline"
                      >
                        View in My Skills
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleRegister}
                      disabled={registering || currentUserCredits < skill.credit_price}
                      className="w-full"
                      size="lg"
                    >
                      {registering ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Registering...
                        </>
                      ) : currentUserCredits < skill.credit_price ? (
                        'Insufficient Credits'
                      ) : (
                        'Register Now'
                      )}
                    </Button>
                  )}

                  {currentUserCredits < skill.credit_price && !isRegistered && (
                    <p className="text-xs text-destructive text-center">
                      You need {skill.credit_price - currentUserCredits} more credits
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetail;
