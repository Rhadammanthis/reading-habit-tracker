# Reading Habit Tracker

A React Native (Expo) app that motivates lapsed readers by turning "finish a book"
into small, achievable daily goals. Take a reading-speed test, pick a book, set a
per-day time goal, and the app estimates how many days it'll take — then tracks each
timed session and celebrates finished books in your Library.

## Features

- **Reading-speed test** — timed passage, optionally with a comprehension check
  (both variants are built behind a flag for later A/B testing).
- **Add a book** — search Google Books by title/author, scan an ISBN barcode, or
  enter a book manually. Word counts are estimated from page counts.
- **Daily sessions** — a timer with pause/resume that fires a local notification
  when you hit your goal, even if the app is backgrounded.
- **Progress your way** — after a session, accept the pace estimate or enter the
  page you actually reached.
- **Library** — finished books with days, sessions, time read, and pages/words.
- **Light & dark** themes, daily reminder notifications, and Supabase-backed
  accounts with cross-device sync.

## Tech stack

Expo SDK 56 · Expo Router · Supabase (auth + Postgres) · TanStack Query · Zustand ·
expo-notifications · expo-camera · react-native-svg.

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/0001_init.sql` (SQL editor or
   `supabase db push`). It creates the `profiles`, `speed_tests`, `books`, and
   `sessions` tables with row-level security and an auto-create-profile trigger.
3. Copy `.env.example` to `.env` and fill in your project URL and anon key:

   ```sh
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   # optional, raises Google Books quota:
   EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY=
   ```

### 3. Run a development build

Camera (ISBN scanning) and notifications require a **custom dev client** — Expo Go
won't fully cover them.

```sh
npx expo run:ios      # or: npx expo run:android
```

For day-to-day JS changes after the first native build:

```sh
npx expo start --dev-client
```

## Quality checks

```sh
npm test          # domain unit tests (estimation + progress logic)
npm run typecheck # tsc --noEmit
```

## Project layout

```
app/                       Expo Router screens
  (auth)/sign-in.tsx       Supabase email/password
  (tabs)/                  Today (home), Library, Settings
  onboarding/speed-test    Reading-speed test
  add-book.tsx             Search / scan / manual entry
  session/timer.tsx        Session timer + finish review
  book/[id].tsx            Finished-book stats
src/
  domain/                  Pure estimation + progress logic (unit-tested)
  services/                Supabase, Google Books, notifications
  hooks/                   TanStack Query hooks
  store/                   Zustand session timer
  theme/                   Tokens + ThemeProvider
  components/              Shared UI primitives
supabase/migrations/       Database schema + RLS
```

## Notes

- Notifications are **local only** (goal-reached + daily reminder); no push server.
- Remote/streak push and the speed-test A/B experiment are intentionally out of
  scope — hooks/flags are left in place for both.
