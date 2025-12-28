import { LESSONS_PATH } from '../constants/config.js';

/**
 * Lesson Service - Handle lesson data loading and parsing
 */
class LessonService {
  constructor() {
    this.lessons = new Map();
    this.lessonList = [];
  }

  /**
   * Load all available lessons
   * @returns {Promise<Array>} List of lesson metadata
   */
  async loadLessonList() {
    try {
      console.log('Loading lessons from:', `${LESSONS_PATH}/manifest.json`);

      // Load manifest file
      const manifestResponse = await fetch(`${LESSONS_PATH}/manifest.json`);
      if (!manifestResponse.ok) {
        throw new Error(`Failed to load manifest: ${manifestResponse.statusText}`);
      }

      const manifest = await manifestResponse.json();
      console.log('Manifest loaded:', manifest);

      // Load metadata from each lesson file
      const lessonPromises = manifest.lessons.map(async (item) => {
        try {
          const response = await fetch(`${LESSONS_PATH}/${item.fileName}`);
          if (!response.ok) {
            console.error(`Failed to load ${item.fileName}`);
            return null;
          }

          const lessonData = await response.json();

          return {
            id: item.id,
            fileName: item.fileName,
            unit: lessonData.metadata.unit,
            title: lessonData.metadata.title
          };
        } catch (error) {
          console.error(`Error loading lesson ${item.id}:`, error);
          return null;
        }
      });

      const lessons = await Promise.all(lessonPromises);
      this.lessonList = lessons.filter(Boolean); // Remove nulls

      console.log('Lessons loaded:', this.lessonList);
      return this.lessonList;
    } catch (error) {
      console.error('Failed to load lesson list:', error);
      throw error;
    }
  }

  /**
   * Load a specific lesson by ID
   * @param {string} lessonId
   * @returns {Promise<Object>} Lesson data
   */
  async loadLesson(lessonId) {
    // Check if already loaded
    if (this.lessons.has(lessonId)) {
      return this.lessons.get(lessonId);
    }

    try {
      // Load lesson list if not loaded yet
      if (this.lessonList.length === 0) {
        await this.loadLessonList();
      }

      const lessonInfo = this.lessonList.find(l => l.id === lessonId);
      if (!lessonInfo) {
        throw new Error(`Lesson ${lessonId} not found in lesson list`);
      }

      const response = await fetch(`${LESSONS_PATH}/${lessonInfo.fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to load lesson: ${response.statusText}`);
      }

      const lessonData = await response.json();

      // Validate lesson structure
      this.validateLesson(lessonData);

      // Cache the lesson
      this.lessons.set(lessonId, lessonData);

      return lessonData;
    } catch (error) {
      console.error(`Failed to load lesson ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Get lesson metadata by ID
   * @param {string} lessonId
   * @returns {Object|null} Lesson metadata
   */
  getLessonInfo(lessonId) {
    return this.lessonList.find(l => l.id === lessonId) || null;
  }

  /**
   * Get vocabulary from a lesson
   * @param {string} lessonId
   * @returns {Promise<Array>} Vocabulary array
   */
  async getVocabulary(lessonId) {
    const lesson = await this.loadLesson(lessonId);
    return lesson.vocabulary || [];
  }

  /**
   * Get reading content from a lesson
   * @param {string} lessonId
   * @returns {Promise<Object>} Reading object
   */
  async getReading(lessonId) {
    const lesson = await this.loadLesson(lessonId);
    return lesson.reading || { title: '', paragraphs: [] };
  }

  /**
   * Get fill-in-blanks exercises from a lesson
   * @param {string} lessonId
   * @returns {Promise<Object>} Fill-in-blanks object
   */
  async getFillInBlanks(lessonId) {
    const lesson = await this.loadLesson(lessonId);
    return lesson.fillInTheBlanks || { instructions: '', wordBank: [], questions: [] };
  }

  /**
   * Find a vocabulary word by word text
   * @param {string} lessonId
   * @param {string} word
   * @returns {Promise<Object|null>} Word object or null
   */
  async findWord(lessonId, word) {
    const vocabulary = await this.getVocabulary(lessonId);
    return vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase()) || null;
  }

  /**
   * Validate lesson structure
   * @param {Object} lessonData
   * @throws {Error} If validation fails
   */
  validateLesson(lessonData) {
    if (!lessonData.metadata) {
      throw new Error('Lesson missing metadata');
    }
    if (!lessonData.vocabulary || !Array.isArray(lessonData.vocabulary)) {
      throw new Error('Lesson missing vocabulary array');
    }
    if (!lessonData.reading || !lessonData.reading.paragraphs) {
      throw new Error('Lesson missing reading content');
    }
  }

  /**
   * Clear cached lessons
   */
  clearCache() {
    this.lessons.clear();
  }
}

export default new LessonService();
