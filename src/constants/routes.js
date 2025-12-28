// Route constants
export const ROUTES = {
  HOME: '/',
  LESSON: '/lesson/:id',
  READING: '/lesson/:id/reading',
  VOCABULARY: '/lesson/:id/vocabulary'
};

// Helper to build routes
export const buildRoute = {
  lesson: (id) => `/lesson/${id}`,
  reading: (id) => `/lesson/${id}/reading`,
  vocabulary: (id) => `/lesson/${id}/vocabulary`
};
