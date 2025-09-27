import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SkillListing {
  id: string;
  title: string;
  description: string;
  credit_price: number;
  duration_minutes: number;
  is_active: boolean;
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
}

interface DiscountInfo {
  discount_percentage: number;
  original_price: number;
  discounted_price: number;
}

export const useMarketplace = () => {
  const [skills, setSkills] = useState<SkillListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserCredits, setCurrentUserCredits] = useState(0);
  const [purchasedSkills, setPurchasedSkills] = useState<Set<string>>(new Set());

  const fetchSkills = async () => {
    try {
      setLoading(true);
      
      // Fetch current user's credits and purchased skills
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

      // Fetch skill listings with related data
      const { data, error } = await supabase
        .from('skill_listings')
        .select(`
          id,
          title,
          description,
          credit_price,
          duration_minutes,
          is_active,
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Filter out any null relations and cast to proper type
      const validSkills = (data || []).filter(
        item => item.skills && item.profiles
      ) as unknown as SkillListing[];

      setSkills(validSkills);

      // Fetch purchased skills if user is logged in
      if (user) {
        const { data: purchases } = await supabase
          .from('transactions')
          .select('skill_listing_id')
          .eq('user_id', user.id)
          .eq('transaction_type', 'purchase');

        if (purchases) {
          const purchasedIds = new Set(purchases.map(p => p.skill_listing_id));
          setPurchasedSkills(purchasedIds);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountForSkill = async (tutorCredits: number): Promise<DiscountInfo> => {
    if (currentUserCredits === 0) {
      return {
        discount_percentage: 0,
        original_price: 0,
        discounted_price: 0
      };
    }

    try {
      const { data, error } = await supabase.rpc('calculate_credit_discount', {
        tutor_credits: tutorCredits,
        student_credits: currentUserCredits
      });

      if (error) {
        console.error('Error calculating discount:', error);
        return {
          discount_percentage: 0,
          original_price: 0,
          discounted_price: 0
        };
      }

      return {
        discount_percentage: data || 0,
        original_price: 0,
        discounted_price: 0
      };
    } catch (error) {
      console.error('Error calculating discount:', error);
      return {
        discount_percentage: 0,
        original_price: 0,
        discounted_price: 0
      };
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const isSkillPurchased = (skillId: string) => {
    return purchasedSkills.has(skillId);
  };

  return {
    skills,
    loading,
    error,
    currentUserCredits,
    purchasedSkills,
    refetch: fetchSkills,
    calculateDiscountForSkill,
    isSkillPurchased
  };
};