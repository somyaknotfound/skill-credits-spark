import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TimePeriod = 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardUser {
  instructor_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  level: number;
  total_credits: number;
  skills_taught: number;
  avg_rating: number;
  rank_position: number;
  is_trending?: boolean;
}

export const useLeaderboardOptimized = (timePeriod: TimePeriod = 'all_time') => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine which materialized view to query
      const viewName = timePeriod === 'weekly' 
        ? 'weekly_leaderboard' 
        : timePeriod === 'monthly' 
        ? 'monthly_leaderboard' 
        : 'all_time_leaderboard';

      // Query the materialized view
      const { data, error: queryError } = await supabase
        .from(viewName)
        .select('*')
        .order('rank_position', { ascending: true })
        .limit(50);

      if (queryError) {
        console.error('Leaderboard query error:', queryError);
        throw queryError;
      }

      // Get trending instructors (those who improved their rank in the last 7 days)
      const { data: trendingData } = await supabase
        .from('leaderboard_history')
        .select('instructor_id, rank_position, recorded_at')
        .eq('period_type', timePeriod)
        .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false });

      // Create a map of trending instructors
      const trendingMap = new Map<string, boolean>();
      if (trendingData) {
        trendingData.forEach(record => {
          trendingMap.set(record.instructor_id, true);
        });
      }

      // Transform the data
      const leaderboardUsers: LeaderboardUser[] = (data || []).map((user: any) => ({
        instructor_id: user.instructor_id,
        full_name: user.full_name,
        username: user.username,
        avatar_url: user.avatar_url,
        level: user.level,
        total_credits: Number(user.total_credits) || 0,
        skills_taught: Number(user.skills_taught) || 0,
        avg_rating: Number(user.avg_rating) || 0,
        rank_position: Number(user.rank_position) || 0,
        is_trending: trendingMap.has(user.instructor_id)
      }));

      setUsers(leaderboardUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard data');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  const refreshLeaderboards = async () => {
    try {
      const { error } = await supabase.rpc('refresh_leaderboards');
      if (error) {
        console.error('Error refreshing leaderboards:', error);
        return;
      }
      // Refetch data after refresh
      await fetchLeaderboard();
    } catch (err: any) {
      console.error('Error refreshing leaderboards:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    users,
    loading,
    error,
    refetch: fetchLeaderboard,
    refreshLeaderboards,
    timePeriod
  };
};
