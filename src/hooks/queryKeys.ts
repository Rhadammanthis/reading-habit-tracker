export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  latestSpeedTest: (userId: string) => ['speedTest', 'latest', userId] as const,
  activeBook: (userId: string) => ['books', 'active', userId] as const,
  library: (userId: string) => ['books', 'library', userId] as const,
  book: (bookId: string) => ['books', 'detail', bookId] as const,
  sessions: (bookId: string) => ['sessions', bookId] as const,
};
