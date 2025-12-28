import { API_CONFIG } from '../constants/config.js';
import storageService from './storageService.js';

/**
 * Dictionary Service - Hybrid word lookup
 * Priority: JSON vocabulary → Cache → Free Dictionary API → Google Translate fallback
 */
class DictionaryService {
  /**
   * Look up word meaning with hybrid approach
   * @param {string} word
   * @param {Array} vocabulary - Lesson vocabulary array (optional)
   * @returns {Promise<Object>} Word definition
   */
  async lookup(word, vocabulary = []) {
    const normalizedWord = word.toLowerCase().trim();

    try {
      // 1. Check lesson vocabulary JSON (instant)
      if (vocabulary.length > 0) {
        const found = vocabulary.find(v => v.word.toLowerCase() === normalizedWord);
        if (found) {
          return this.formatVocabularyResult(found);
        }
      }

      // 2. Check cache (instant)
      const cached = storageService.getCachedDictionaryResult(normalizedWord);
      if (cached) {
        return cached;
      }

      // 3. Try Free Dictionary API (~500ms)
      try {
        const apiResult = await this.fetchFromDictionaryAPI(normalizedWord);
        if (apiResult) {
          storageService.cacheDictionaryResult(normalizedWord, apiResult);
          return apiResult;
        }
      } catch (apiError) {
        console.warn('Dictionary API failed, trying fallback:', apiError.message);
      }

      // 4. Fallback to Google Translate (~300ms)
      const translateResult = await this.fetchFromGoogleTranslate(normalizedWord);
      storageService.cacheDictionaryResult(normalizedWord, translateResult);
      return translateResult;

    } catch (error) {
      console.error('All lookup methods failed:', error);
      return this.createErrorResult(word);
    }
  }

  /**
   * Format vocabulary JSON result
   * @param {Object} vocabItem
   * @returns {Object} Formatted result
   */
  formatVocabularyResult(vocabItem) {
    return {
      word: vocabItem.word,
      pronunciation: vocabItem.pronunciation || '',
      meaning: vocabItem.meaning || '',
      definition: vocabItem.definition || '',
      examples: [
        vocabItem.exampleSimple,
        vocabItem.exampleFromReading?.text
      ].filter(Boolean),
      source: 'vocabulary'
    };
  }

  /**
   * Fetch from Free Dictionary API
   * @param {string} word
   * @returns {Promise<Object>} Dictionary result
   */
  async fetchFromDictionaryAPI(word) {
    const url = `${API_CONFIG.DICTIONARY_API}/${encodeURIComponent(word)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Dictionary API returned ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error('No definition found');
    }

    const entry = data[0];
    const meaning = entry.meanings?.[0];
    const definition = meaning?.definitions?.[0];

    return {
      word: entry.word,
      pronunciation: entry.phonetic || this.extractPhonetic(entry.phonetics),
      meaning: '', // API doesn't provide Vietnamese translation
      definition: definition?.definition || '',
      examples: definition?.example ? [definition.example] : [],
      partOfSpeech: meaning?.partOfSpeech || '',
      synonyms: definition?.synonyms || [],
      antonyms: definition?.antonyms || [],
      source: 'dictionary-api'
    };
  }

  /**
   * Extract phonetic from phonetics array
   * @param {Array} phonetics
   * @returns {string} Phonetic text
   */
  extractPhonetic(phonetics) {
    if (!phonetics || phonetics.length === 0) return '';
    const found = phonetics.find(p => p.text);
    return found?.text || '';
  }

  /**
   * Fetch from Google Translate (unofficial API)
   * @param {string} word
   * @returns {Promise<Object>} Translation result
   */
  async fetchFromGoogleTranslate(word) {
    // Note: This is an unofficial endpoint and may be unreliable
    // Consider using a proper translation API in production
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translation = data[0]?.[0]?.[0] || word;

      return {
        word: word,
        pronunciation: '',
        meaning: translation,
        definition: `Translation: ${translation}`,
        examples: [],
        source: 'google-translate'
      };
    } catch (error) {
      console.error('Google Translate failed:', error);
      // Return a basic result
      return {
        word: word,
        pronunciation: '',
        meaning: '',
        definition: 'Could not fetch definition',
        examples: [],
        source: 'fallback'
      };
    }
  }

  /**
   * Create error result
   * @param {string} word
   * @returns {Object} Error result
   */
  createErrorResult(word) {
    return {
      word: word,
      pronunciation: '',
      meaning: '',
      definition: 'Definition not available',
      examples: [],
      source: 'error'
    };
  }

  /**
   * Batch lookup multiple words (for prefetching)
   * @param {Array<string>} words
   * @param {Array} vocabulary
   * @returns {Promise<Map>} Map of word → definition
   */
  async batchLookup(words, vocabulary = []) {
    const results = new Map();

    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const promises = batch.map(word =>
        this.lookup(word, vocabulary).catch(err => {
          console.error(`Failed to lookup ${word}:`, err);
          return this.createErrorResult(word);
        })
      );

      const batchResults = await Promise.all(promises);
      batchResults.forEach((result, index) => {
        results.set(batch[index], result);
      });

      // Small delay between batches
      if (i + batchSize < words.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }
}

export default new DictionaryService();
