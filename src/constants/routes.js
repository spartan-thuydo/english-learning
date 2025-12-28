// Route constants
export const ROUTES = {
  HOME: '/',
  LESSON: '/lesson/:id',
  READING: '/lesson/:id/reading',
  VOCABULARY: '/lesson/:id/vocabulary',
  GAMES: '/lesson/:id/games',
  GAME_PLAY: '/lesson/:id/games/:gameType'
};

// Helper to build routes
export const buildRoute = {
  lesson: (id) => `/lesson/${id}`,
  reading: (id) => `/lesson/${id}/reading`,
  vocabulary: (id) => `/lesson/${id}/vocabulary`,
  games: (id) => `/lesson/${id}/games`,
  gamePlay: (id, gameType) => `/lesson/${id}/games/${gameType}`
};
