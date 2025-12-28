import { STORAGE_KEYS, CACHE_DURATION } from '../constants/config.js';

/**
 * Storage Service - Handle localStorage operations
 */
class StorageService {
  /**
   * Get user progress for a specific lesson
   * @param {string} lessonId
   * @returns {Object} Progress data
   */
  getLessonProgress(lessonId) {
    const allProgress = this.getAllProgress();
    return allProgress[lessonId] || {
      learnedWords: [],
      completedExercises: [],
      flashcardKnownWords: [],
      flashcardReviewWords: [],
      lastAccessed: null
    };
  }

  /**
   * Update learned words for a lesson
   * @param {string} lessonId
   * @param {string} wordId
   */
  addLearnedWord(lessonId, wordId) {
    const progress = this.getLessonProgress(lessonId);
    if (!progress.learnedWords.includes(wordId)) {
      progress.learnedWords.push(wordId);
      progress.lastAccessed = new Date().toISOString();
      this.saveLessonProgress(lessonId, progress);
    }
  }

  /**
   * Mark exercise as completed
   * @param {string} lessonId
   * @param {string} exerciseType - 'fillBlanks', 'flashCards', etc.
   */
  markExerciseComplete(lessonId, exerciseType) {
    const progress = this.getLessonProgress(lessonId);
    if (!progress.completedExercises.includes(exerciseType)) {
      progress.completedExercises.push(exerciseType);
      progress.lastAccessed = new Date().toISOString();
      this.saveLessonProgress(lessonId, progress);
    }
  }

  /**
   * Get flashcard game progress
   * @param {string} lessonId
   * @returns {Object} { knownWords: string[], reviewWords: string[] }
   */
  getFlashcardProgress(lessonId) {
    const progress = this.getLessonProgress(lessonId);
    return {
      knownWords: progress.flashcardKnownWords || [],
      reviewWords: progress.flashcardReviewWords || []
    };
  }

  /**
   * Save flashcard game progress
   * @param {string} lessonId
   * @param {string[]} knownWords - Array of word IDs
   * @param {string[]} reviewWords - Array of word IDs
   */
  saveFlashcardProgress(lessonId, knownWords, reviewWords) {
    const progress = this.getLessonProgress(lessonId);
    progress.flashcardKnownWords = knownWords;
    progress.flashcardReviewWords = reviewWords;
    progress.lastAccessed = new Date().toISOString();
    this.saveLessonProgress(lessonId, progress);
  }

  /**
   * Save lesson progress
   * @param {string} lessonId
   * @param {Object} progressData
   */
  saveLessonProgress(lessonId, progressData) {
    const allProgress = this.getAllProgress();
    allProgress[lessonId] = progressData;
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
  }

  /**
   * Get all progress data
   * @returns {Object} All lessons progress
   */
  getAllProgress() {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Cache dictionary lookup result
   * @param {string} word
   * @param {Object} result
   */
  cacheDictionaryResult(word, result) {
    const cache = this.getDictionaryCache();
    cache[word.toLowerCase()] = {
      data: result,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
  }

  /**
   * Get cached dictionary result
   * @param {string} word
   * @returns {Object|null} Cached result or null if not found/expired
   */
  getCachedDictionaryResult(word) {
    const cache = this.getDictionaryCache();
    const cached = cache[word.toLowerCase()];

    if (!cached) return null;

    // Check if cache is expired
    const isExpired = (Date.now() - cached.timestamp) > CACHE_DURATION;
    if (isExpired) {
      delete cache[word.toLowerCase()];
      localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
      return null;
    }

    return cached.data;
  }

  /**
   * Get all dictionary cache
   * @returns {Object} Cache object
   */
  getDictionaryCache() {
    const data = localStorage.getItem(STORAGE_KEYS.CACHE);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Clear all cache
   */
  clearCache() {
    localStorage.removeItem(STORAGE_KEYS.CACHE);
  }

  /**
   * Clear all progress
   */
  clearProgress() {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  }

  /**
   * Clear all data
   */
  clearAll() {
    this.clearCache();
    this.clearProgress();
  }
}

export default new StorageService();
