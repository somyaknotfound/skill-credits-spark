import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TimePeriod = 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardUser {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  level: number;
  total_credits: number;
  skills_taught: number;
  avg_rating: number;
  rank_position: number;
  is_trending: boolean;
}

export const useLeaderboard = (timePeriod: TimePeriod = 'all_time') => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use separate queries to avoid relationship issues
      const startDate = timePeriod === 'weekly' 
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : timePeriod === 'monthly'
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : '1970-01-01';

      // First, get all teach transactions (fallback to existing schema)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('user_id, amount, created_at, skill_listing_id')
        .eq('transaction_type', 'teach')
        .gte('created_at', startDate);

      if (transactionsError) {
        console.error('Transactions query error:', transactionsError);
        throw transactionsError;
      }

      // Get unique instructor IDs
      const instructorIds = [...new Set((transactions || []).map(t => t.user_id))];

      if (instructorIds.length === 0) {
        setUsers([]);
        return;
      }

      // Then, get profiles for these instructors
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, level')
        .in('user_id', instructorIds);

      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        throw profilesError;
      }

      // Create a map of profiles for quick lookup
      const profileMap = new Map();
      (profiles || []).forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Aggregate the data
      const instructorMap = new Map<string, {
        user_id: string;
        full_name: string;
        username: string;
        avatar_url?: string;
        level: number;
        total_credits: number;
        skills_taught: Set<string>;
        transactions: any[];
      }>();

      (transactions || []).forEach((transaction: any) => {
        const instructorId = transaction.user_id;
        const profile = profileMap.get(instructorId);
        
        if (!instructorMap.has(instructorId)) {
          instructorMap.set(instructorId, {
            user_id: instructorId,
            full_name: profile?.full_name || profile?.username || 'Unknown',
            username: profile?.username || 'unknown',
            avatar_url: profile?.avatar_url,
            level: profile?.level || 1,
            total_credits: 0,
            skills_taught: new Set(),
            transactions: []
          });
        }
        
        const instructor = instructorMap.get(instructorId)!;
        instructor.total_credits += Math.abs(transaction.amount);
        instructor.skills_taught.add(transaction.skill_listing_id);
        instructor.transactions.push(transaction);
      });

      // Transform the data to match our interface
      const leaderboardUsers: LeaderboardUser[] = Array.from(instructorMap.values())
        .sort((a, b) => b.total_credits - a.total_credits)
        .map((instructor, index) => ({
          user_id: instructor.user_id,
          full_name: instructor.full_name,
          username: instructor.username,
          avatar_url: instructor.avatar_url,
          level: instructor.level,
          total_credits: instructor.total_credits,
          skills_taught: instructor.skills_taught.size,
          avg_rating: 4.5, // Default rating for now
          rank_position: index + 1,
          is_trending: false // TODO: Implement trending logic
        }));

      setUsers(leaderboardUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard data');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    users,
    loading,
    error,
    refetch: fetchLeaderboard,
    timePeriod
  };
};