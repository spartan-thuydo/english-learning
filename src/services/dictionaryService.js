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
          return await this.formatVocabularyResult(found);
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
   * @returns {Promise<Object>} Formatted result
   */
  async formatVocabularyResult(vocabItem) {
    // If vocabulary already has Vietnamese meaning, use it
    // Otherwise, translate the definition
    let vietnameseMeaning = vocabItem.meaning || '';

    if (!vietnameseMeaning && vocabItem.definition) {
      vietnameseMeaning = await this.translateToVietnamese(vocabItem.definition);
    }

    return {
      word: vocabItem.word,
      pronunciation: vocabItem.pronunciation || '',
      partOfSpeech: vocabItem.pos || '',
      meaning: vietnameseMeaning,
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
    const meanings = entry.meanings || [];

    // Prioritize common parts of speech over noun
    // Order: pronoun → verb → adjective → adverb → noun → others
    const priorityOrder = ['pronoun', 'verb', 'adjective', 'adverb', 'noun'];
    let meaning = null;

    for (const pos of priorityOrder) {
      meaning = meanings.find(m => m.partOfSpeech === pos);
      if (meaning) break;
    }

    // Fallback to first meaning if no priority match
    if (!meaning) {
      meaning = meanings[0];
    }

    const definitions = meaning?.definitions || [];

    // Get all word variations (base forms by removing suffixes)
    const wordVariations = this.getWordVariations(word);

    // Try to find a definition with example containing any variation of the word
    let definition = definitions.find(def => {
      if (!def.example) return false;
      const exampleLower = def.example.toLowerCase();
      // Check if example contains any variation of the word
      return wordVariations.some(variation =>
        exampleLower.includes(variation.toLowerCase())
      );
    });

    // Fallback to first definition if no match found
    if (!definition) {
      definition = definitions[0];
    }

    const definitionText = definition?.definition || '';

    // Translate definition to Vietnamese
    const vietnameseMeaning = await this.translateToVietnamese(definitionText);

    return {
      word: entry.word,
      pronunciation: entry.phonetic || this.extractPhonetic(entry.phonetics),
      meaning: vietnameseMeaning,
      definition: definitionText,
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
   * Get word variations by removing common suffixes
   * @param {string} word - Word to get variations for
   * @returns {Array<string>} Array of word variations
   */
  getWordVariations(word) {
    const variations = [word];
    const lowerWord = word.toLowerCase();

    // Remove plural suffixes: s, es
    if (lowerWord.endsWith('es') && lowerWord.length > 3) {
      variations.push(lowerWord.slice(0, -2)); // watches → watch
      variations.push(lowerWord.slice(0, -1)); // watches → watche (for safety)
    } else if (lowerWord.endsWith('s') && lowerWord.length > 2) {
      variations.push(lowerWord.slice(0, -1)); // spectacles → spectacle
    }

    // Remove past tense suffixes: ed, d
    if (lowerWord.endsWith('ed') && lowerWord.length > 3) {
      variations.push(lowerWord.slice(0, -2)); // played → play
      variations.push(lowerWord.slice(0, -1)); // played → playe (for safety)
    } else if (lowerWord.endsWith('d') && lowerWord.length > 2) {
      variations.push(lowerWord.slice(0, -1)); // used → use
    }

    // Remove -ing suffix
    if (lowerWord.endsWith('ing') && lowerWord.length > 4) {
      variations.push(lowerWord.slice(0, -3)); // running → runn
      // Try double consonant reduction: running → run
      const base = lowerWord.slice(0, -3);
      if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
        variations.push(base.slice(0, -1));
      }
    }

    // Remove comparative/superlative: er, est
    if (lowerWord.endsWith('est') && lowerWord.length > 4) {
      variations.push(lowerWord.slice(0, -3)); // fastest → fast
    } else if (lowerWord.endsWith('er') && lowerWord.length > 3) {
      variations.push(lowerWord.slice(0, -2)); // faster → fast
    }

    // Return unique variations only
    return [...new Set(variations)];
  }

  /**
   * Translate text to Vietnamese using MyMemory Translation API
   * @param {string} text - Text to translate
   * @returns {Promise<string>} Vietnamese translation
   */
  async translateToVietnamese(text) {
    if (!text || text.trim() === '') return '';

    try {
      const url = `${API_CONFIG.MYMEMORY_TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=en|vi`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Translation API returned ${response.status}`);
      }

      const data = await response.json();

      // MyMemory API returns translation in responseData.translatedText
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }

      return '';
    } catch (error) {
      console.warn('MyMemory translation failed:', error);
      return ''; // Return empty string on failure, don't block the lookup
    }
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
