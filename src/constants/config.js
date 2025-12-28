// API Configuration
export const API_CONFIG = {
  DICTIONARY_API: 'https://api.dictionaryapi.dev/api/v2/entries/en',
  GOOGLE_TTS_API: 'https://translate.google.com/translate_tts'
};

// Lessons path (in public folder for Vite)
// Use Vite's BASE_URL to handle both dev and production paths
export const LESSONS_PATH = `${import.meta.env.BASE_URL}lessons/json`.replace(/\/+/g, '/').replace(/\/$/, '');

// LocalStorage keys
export const STORAGE_KEYS = {
  PROGRESS: 'english_learning_progress',
  CACHE: 'english_learning_cache'
};

// Cache duration (1 day)
export const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Audio settings
export const AUDIO_CONFIG = {
  TTS_LANG: 'en',
  TTS_RATE: 0.85,
  TTS_PITCH: 1.0
};
