import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PurchaseResult {
  success: boolean;
  error?: string;
  transaction_id?: string;
  original_amount?: number;
  final_amount?: number;
  discount_percentage?: number;
  discount_amount?: number;
  required?: number;
  available?: number;
}

export const useSkillPurchase = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateDiscount = async (tutorCredits: number, studentCredits: number) => {
    const { data, error } = await supabase.rpc('calculate_credit_discount', {
      tutor_credits: tutorCredits,
      student_credits: studentCredits
    });

    if (error) {
      console.error('Error calculating discount:', error);
      return 0;
    }

    return data || 0;
  };

  const purchaseSkill = async (skillListingId: string): Promise<PurchaseResult> => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to purchase skills');
      }

      const { data, error } = await supabase.rpc('purchase_skill_with_discount', {
        p_skill_listing_id: skillListingId,
        p_student_id: user.id
      });

      if (error) {
        throw error;
      }

      const result = data as unknown as PurchaseResult;

      if (result.success) {
        toast({
          title: "Purchase Successful! 🎉",
          description: result.discount_percentage && result.discount_percentage > 0 
            ? `You saved ${result.discount_amount} credits (${result.discount_percentage}% discount)!`
            : `Skill purchased for ${result.final_amount} credits.`,
        });
      } else {
        toast({
          title: "Purchase Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to purchase skill';
      toast({
        title: "Purchase Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    purchaseSkill,
    calculateDiscount,
    loading
  };
};