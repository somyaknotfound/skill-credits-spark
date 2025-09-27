import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PurchaseResult {
  success: boolean;
  error?: string;
  learn_transaction_id?: string;
  teach_transaction_id?: string;
  skill_title?: string;
  credits_paid?: number;
  required?: number;
  available?: number;
}

export const useSkillPurchaseOptimized = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const purchaseSkill = async (skillId: string): Promise<PurchaseResult> => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to purchase skills');
      }

      // Get student profile ID
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, credits_balance')
        .eq('user_id', user.id)
        .single();

      if (profileError || !studentProfile) {
        throw new Error('Student profile not found');
      }

      // Use the optimized P2P purchase function
      const { data, error } = await supabase.rpc('purchase_skill_p2p', {
        p_skill_id: skillId,
        p_student_id: studentProfile.id
      });

      if (error) {
        throw error;
      }

      const result = data as unknown as PurchaseResult;

      if (result.success) {
        toast({
          title: "Purchase Successful! 🎉",
          description: `You have successfully enrolled in "${result.skill_title}" for ${result.credits_paid} credits.`,
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
    loading
  };
};
