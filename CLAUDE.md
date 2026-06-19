# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                        # Install dependencies
npm test                           # Run unit tests (Jest + ts-jest)
npm test -- --testPathPattern=src/domain/estimation  # Run a single test file
npm run typecheck                  # Type-check with tsc --noEmit
npm run lint                       # Lint via Expo's lint tool
npx expo start --dev-client        # Start dev server (JS changes only)
npx expo run:ios                   # Full native build for iOS
npx expo run:android               # Full native build for Android
```

> The app requires a custom dev client (not Expo Go) because it uses `expo-camera` and `expo-notifications`.

## Architecture

### Layer Separation

The codebase enforces a strict four-layer architecture:

1. **`app/`** — Expo Router screens (UI only). Route files correspond directly to navigation paths. Auth-gated routes live under `app/(auth)/`, main tabs under `app/(tabs)/`.
2. **`src/services/`** — All Supabase and Google Books API calls. No component or hook should call Supabase directly.
3. **`src/hooks/`** — TanStack Query hooks that wrap service functions with caching. This is the boundary between the data layer and components.
4. **`src/domain/`** — Pure TypeScript functions with zero framework dependencies. This is the only layer covered by unit tests.

### State Management

Three mechanisms are used deliberately for different concerns:

- **TanStack Query** (`src/hooks/`) — server/remote state (books, profiles, sessions)
- **Zustand** (`src/store/timerStore.ts`) — session timer, stored as wall-clock timestamps so backgrounding doesn't corrupt elapsed time
- **React Context** — auth state (`src/auth/AuthProvider.tsx`) and theme (`src/theme/ThemeProvider.tsx`), both persisted to AsyncStorage

### Provider Stack

`app/_layout.tsx` composes providers in this order (outermost → innermost):
`GestureHandlerRootView` → `SafeAreaProvider` → `ThemeProvider` → `QueryClientProvider` → `AuthProvider` → Expo Router Stack

### Routing / Auth Flow

`app/index.tsx` is the entry dispatcher — it checks auth state and redirects to `/(auth)/sign-in` or `/(tabs)/`. The `(auth)` and `(tabs)` groups each have their own `_layout.tsx`.

### Database (Supabase)

Schema lives in `supabase/migrations/0001_init.sql`. Four tables: `profiles`, `speed_tests`, `books`, `sessions`. All have RLS enabled — every policy checks `auth.uid()`. A database trigger auto-creates a `profiles` row on user signup. The `books` table enforces a unique constraint so only one book can be `active` per user at a time.

Domain types in `src/types/models.ts` mirror the database schema and are the canonical type definitions used throughout the app.

### Path Alias

`@/` maps to `src/` (configured in both `tsconfig.json` and Jest's `moduleNameMapper`). Always use `@/` imports rather than relative paths when importing from `src/`.

## Environment

Copy `.env.example` to `.env`. Two variables are required:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

`EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` is optional — the API works unauthenticated at low volume. All `EXPO_PUBLIC_*` variables are inlined at build time by Expo.

## Key Conventions

- **Domain logic belongs in `src/domain/`** and must remain pure (no Supabase, no React, no AsyncStorage). If new business logic is non-trivial, add it here with a corresponding `.test.ts` file.
- **Tests only cover `src/domain/`**. The Jest config matches `**/src/**/*.test.ts` with `testEnvironment: "node"`.
- **New Architecture is enabled** (`expo.newArchEnabled: true` in `app.json`). Avoid libraries that are not compatible with React Native's New Architecture.
- **TypeScript strict mode is on**. `tsconfig.json` uses `extends: "expo/tsconfig.base"` with strict enabled; test files are excluded from compilation.
- **`npm install` requires `--legacy-peer-deps`** — this is set globally in `.npmrc` so plain `npm install` works.
