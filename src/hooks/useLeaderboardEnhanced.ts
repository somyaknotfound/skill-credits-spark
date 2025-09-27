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
  is_trending: boolean;
  students_taught: number;
  courses_completed: number;
}

export const useLeaderboardEnhanced = (timePeriod: TimePeriod = 'all_time') => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Debug function to log data flow
  const debugDataFlow = useCallback(async () => {
    console.log('🔍 Debugging leaderboard data flow...');
    
    try {
      // Check if we have any data in key tables
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, credits_balance')
        .limit(5);
      
      console.log('👥 Profiles:', profiles?.length || 0, profilesError);

      const { data: skills, error: skillsError } = await supabase
        .from('skill_listings')
        .select('id, title, user_id, is_active')
        .eq('is_active', true)
        .limit(5);
      
      console.log('📚 Active Skills:', skills?.length || 0, skillsError);

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, user_id, skill_listing_id, transaction_type, amount')
        .limit(5);
      
      console.log('💰 Transactions:', transactions?.length || 0, transactionsError);

      // Test the leaderboard function directly
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .rpc('get_leaderboard_data_fixed', { time_period: timePeriod });
      
      console.log('🏆 Leaderboard Data:', leaderboardData?.length || 0, leaderboardError);

    } catch (err) {
      console.error('❌ Debug error:', err);
    }
  }, [timePeriod]);

  const fetchLeaderboard = useCallback(async (showDebug = false) => {
    try {
      setLoading(true);
      setError(null);

      if (showDebug) {
        await debugDataFlow();
      }

      console.log(`📊 Fetching ${timePeriod} leaderboard...`);

      // Try materialized view first
      const viewName = timePeriod === 'weekly' 
        ? 'weekly_leaderboard' 
        : timePeriod === 'monthly' 
        ? 'monthly_leaderboard' 
        : 'all_time_leaderboard';

      let data, queryError;

      // First try materialized view
      const { data: viewData, error: viewError } = await supabase
        .from(viewName)
        .select('*')
        .order('rank_position', { ascending: true })
        .limit(50);

      if (viewError || !viewData || viewData.length === 0) {
        console.log('📊 Materialized view empty, trying function...');
        
        // Fallback to function
        const { data: functionData, error: functionError } = await supabase
          .rpc('get_leaderboard_data_fixed', { time_period: timePeriod });

        if (functionError) {
          throw functionError;
        }

        data = functionData;
        queryError = functionError;
      } else {
        data = viewData;
        queryError = viewError;
      }

      if (queryError) {
        console.error('❌ Leaderboard query error:', queryError);
        throw queryError;
      }

      console.log(`✅ Found ${data?.length || 0} leaderboard entries`);

      // Transform the data
      const leaderboardUsers: LeaderboardUser[] = (data || []).map((user: any) => ({
        instructor_id: user.instructor_id,
        full_name: user.full_name || 'Unknown Instructor',
        username: user.username || 'unknown',
        avatar_url: user.avatar_url,
        level: user.level || 1,
        total_credits: Number(user.total_credits) || 0,
        skills_taught: Number(user.skills_taught) || 0,
        avg_rating: Number(user.avg_rating) || 0,
        rank_position: Number(user.rank_position) || 0,
        is_trending: Boolean(user.is_trending),
        students_taught: Number(user.students_taught) || 0,
        courses_completed: Number(user.courses_completed) || 0
      }));

      setUsers(leaderboardUsers);
      setLastUpdated(new Date());
      
      console.log('🎉 Leaderboard data loaded successfully');

    } catch (err: any) {
      console.error('❌ Leaderboard fetch error:', err);
      setError(err.message || 'Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [timePeriod, debugDataFlow]);

  const refreshLeaderboards = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Refreshing leaderboards...');
      
      const { error } = await supabase.rpc('refresh_all_leaderboards');
      if (error) {
        console.error('❌ Error refreshing leaderboards:', error);
        return;
      }
      
      console.log('✅ Leaderboards refreshed');
      // Refetch data after refresh
      await fetchLeaderboard();
    } catch (err: any) {
      console.error('❌ Error refreshing leaderboards:', err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchLeaderboard]);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔌 Setting up real-time subscriptions...');

    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('💰 Transaction change detected:', payload);
          // Debounce the refresh to avoid too many updates
          setTimeout(() => {
            fetchLeaderboard();
          }, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'skill_listings'
        },
        (payload) => {
          console.log('📚 Skill listing change detected:', payload);
          setTimeout(() => {
            fetchLeaderboard();
          }, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_progress'
        },
        (payload) => {
          console.log('📈 Progress change detected:', payload);
          setTimeout(() => {
            fetchLeaderboard();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    users,
    loading,
    error,
    refreshing,
    lastUpdated,
    refetch: fetchLeaderboard,
    refreshLeaderboards,
    debugDataFlow,
    timePeriod
  };
};
