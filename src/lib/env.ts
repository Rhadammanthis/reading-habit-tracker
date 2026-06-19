/**
 * Runtime configuration sourced from EXPO_PUBLIC_* env vars (inlined at build
 * time by Expo). Supabase keys are required for auth/sync; the Google Books key
 * is optional (the API works unauthenticated at low volume).
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  googleBooksApiKey: process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? '',
};

/** True when Supabase is configured. Used to show a friendly setup message. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
