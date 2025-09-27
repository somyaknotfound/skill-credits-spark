import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProgressData {
  id: string;
  skill_id: string;
  skill_title: string;
  instructor_name: string;
  progress_percent: number;
  last_activity: string;
  completed_at?: string;
  created_at: string;
}

export const useProgress = () => {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProgress([]);
        return;
      }

      // Get student profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setProgress([]);
        return;
      }

      // Fetch progress with skill and instructor details
      const { data, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          skill_id,
          progress_percent,
          last_activity,
          completed_at,
          created_at,
          skills!inner (
            title,
            instructor_id,
            profiles!skills_instructor_id_fkey (
              full_name
            )
          )
        `)
        .eq('student_id', profile.id)
        .order('updated_at', { ascending: false });

      if (progressError) {
        throw progressError;
      }

      // Transform the data
      const progressData: ProgressData[] = (data || []).map((item: any) => ({
        id: item.id,
        skill_id: item.skill_id,
        skill_title: item.skills?.title || 'Unknown Skill',
        instructor_name: item.skills?.profiles?.full_name || 'Unknown Instructor',
        progress_percent: item.progress_percent,
        last_activity: item.last_activity,
        completed_at: item.completed_at,
        created_at: item.created_at
      }));

      setProgress(progressData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch progress data');
      console.error('Progress fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgress = async (skillId: string, progressPercent: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return false;

      const { error } = await supabase
        .from('progress')
        .update({
          progress_percent: Math.min(100, Math.max(0, progressPercent)),
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          completed_at: progressPercent >= 100 ? new Date().toISOString() : null
        })
        .eq('student_id', profile.id)
        .eq('skill_id', skillId);

      if (error) {
        console.error('Error updating progress:', error);
        return false;
      }

      // Refetch progress data
      await fetchProgress();
      return true;
    } catch (err: any) {
      console.error('Error updating progress:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
    updateProgress
  };
};
