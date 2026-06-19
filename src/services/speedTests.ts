import { supabase } from './supabase';
import { SpeedTest, SpeedTestVariant } from '@/types/models';

/** Most recent speed-test result, or null if the user hasn't taken one. */
export async function fetchLatestSpeedTest(userId: string): Promise<SpeedTest | null> {
  const { data, error } = await supabase
    .from('speed_tests')
    .select('id, user_id, wpm, variant, comprehension_score, taken_at')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as SpeedTest) ?? null;
}

export async function insertSpeedTest(args: {
  userId: string;
  wpm: number;
  variant: SpeedTestVariant;
  comprehensionScore?: number | null;
}): Promise<SpeedTest> {
  const { data, error } = await supabase
    .from('speed_tests')
    .insert({
      user_id: args.userId,
      wpm: Math.round(args.wpm),
      variant: args.variant,
      comprehension_score: args.comprehensionScore ?? null,
    })
    .select('id, user_id, wpm, variant, comprehension_score, taken_at')
    .single();

  if (error) throw error;
  return data as SpeedTest;
}
