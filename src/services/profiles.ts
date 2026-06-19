import { supabase } from './supabase';
import {
  Profile,
  DEFAULT_GOAL_MINUTES,
  DEFAULT_WORDS_PER_PAGE,
  ThemePref,
} from '@/types/models';

/**
 * Fetch the current user's profile. A row is normally created by a DB trigger
 * on sign-up; we upsert a default as a fallback so the app never blocks on it.
 */
export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, words_per_page, default_goal_minutes, theme_pref')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as Profile;

  const fallback: Profile = {
    id: userId,
    display_name: null,
    words_per_page: DEFAULT_WORDS_PER_PAGE,
    default_goal_minutes: DEFAULT_GOAL_MINUTES,
    theme_pref: 'system',
  };
  const { error: upsertError } = await supabase.from('profiles').upsert({ id: userId });
  if (upsertError) throw upsertError;
  return fallback;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'display_name' | 'words_per_page' | 'default_goal_minutes' | 'theme_pref'>>,
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export type { ThemePref };
