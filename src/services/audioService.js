import { AUDIO_CONFIG, API_CONFIG } from '../constants/config.js';

/**
 * Audio Service - Handle word pronunciation
 * Uses Web Speech API (primary) and Google TTS (fallback)
 */
class AudioService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isSupported = 'speechSynthesis' in window;
    this.voicesLoaded = false;

    // Load voices on initialization
    if (this.isSupported) {
      // Trigger voices to load
      this.synthesis.getVoices();

      // Handle voiceschanged event (for browsers that load voices async)
      if ('onvoiceschanged' in this.synthesis) {
        this.synthesis.onvoiceschanged = () => {
          this.voicesLoaded = true;
        };
      } else {
        this.voicesLoaded = true;
      }
    }
  }

  /**
   * Play word pronunciation
   * @param {string} word
   * @param {Object} options - Optional audio settings
   * @returns {Promise<void>}
   */
  async play(word, options = {}) {
    try {
      // Try Web Speech API first
      if (this.isSupported && !options.forceAPI) {
        await this.playWithSpeechAPI(word, options);
      } else {
        // Fallback to Google TTS
        await this.playWithGoogleTTS(word, options);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      throw error;
    }
  }

  /**
   * Play using Web Speech API (browser built-in)
   * @param {string} word
   * @param {Object} options
   * @returns {Promise<void>}
   */
  playWithSpeechAPI(word, options = {}) {
    return new Promise((resolve, reject) => {
      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = options.lang || AUDIO_CONFIG.TTS_LANG;
      utterance.rate = options.rate || AUDIO_CONFIG.TTS_RATE;
      utterance.pitch = options.pitch || AUDIO_CONFIG.TTS_PITCH;

      // Explicitly select an English voice to ensure correct language on mobile
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        const englishVoice = voices.find(voice =>
          voice.lang.startsWith('en-') || voice.lang === 'en'
        );

        if (englishVoice) {
          utterance.voice = englishVoice;
          utterance.lang = englishVoice.lang;
        }
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Play using Google TTS API
   * @param {string} word
   * @param {Object} options
   * @returns {Promise<void>}
   */
  async playWithGoogleTTS(word, options = {}) {
    const lang = options.lang || AUDIO_CONFIG.TTS_LANG;
    const url = `${API_CONFIG.GOOGLE_TTS_API}?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(word)}`;

    return new Promise((resolve, reject) => {
      const audio = new Audio(url);

      audio.onended = () => resolve();
      audio.onerror = (error) => reject(new Error('Google TTS playback failed'));

      audio.play().catch(reject);
    });
  }

  /**
   * Stop current playback
   */
  stop() {
    if (this.isSupported && this.synthesis.speaking) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current playback
   */
  pause() {
    if (this.isSupported && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused playback
   */
  resume() {
    if (this.isSupported && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Get available voices
   * @returns {Array<SpeechSynthesisVoice>} Available voices
   */
  getVoices() {
    if (!this.isSupported) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Get English voices only
   * @returns {Array<SpeechSynthesisVoice>} English voices
   */
  getEnglishVoices() {
    return this.getVoices().filter(voice => voice.lang.startsWith('en'));
  }

  /**
   * Set preferred voice
   * @param {SpeechSynthesisVoice} voice
   */
  setVoice(voice) {
    this.preferredVoice = voice;
  }

  /**
   * Play with specific voice
   * @param {string} word
   * @param {SpeechSynthesisVoice} voice
   * @returns {Promise<void>}
   */
  playWithVoice(word, voice) {
    return new Promise((resolve, reject) => {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = AUDIO_CONFIG.TTS_RATE;
      utterance.pitch = AUDIO_CONFIG.TTS_PITCH;

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Check if audio is currently playing
   * @returns {boolean}
   */
  isPlaying() {
    return this.isSupported && this.synthesis.speaking;
  }

  /**
   * Check if Web Speech API is supported
   * @returns {boolean}
   */
  isWebSpeechSupported() {
    return this.isSupported;
  }
}

export default new AudioService();
