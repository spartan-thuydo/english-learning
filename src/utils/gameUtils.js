/**
 * Utility functions for game logic
 */

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get random items from array
 */
export const getRandomItems = (array, count) => {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
};

/**
 * Scramble letters in a word
 */
export const scrambleWord = (word) => {
  const letters = word.split('');
  let scrambled;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    scrambled = shuffleArray(letters).join('');
    attempts++;
  } while (scrambled === word && attempts < maxAttempts);

  return scrambled;
};

/**
 * Normalize string for comparison (lowercase, trim)
 */
export const normalizeString = (str) => {
  return str.toLowerCase().trim();
};

/**
 * Check if answer is correct (case-insensitive)
 */
export const isCorrectAnswer = (userAnswer, correctAnswer) => {
  return normalizeString(userAnswer) === normalizeString(correctAnswer);
};

/**
 * Generate wrong options for multiple choice
 */
export const generateWrongOptions = (correctAnswer, allOptions, count = 3) => {
  const wrongOptions = allOptions.filter(
    option => normalizeString(option) !== normalizeString(correctAnswer)
  );
  return getRandomItems(wrongOptions, count);
};

/**
 * Create matching pairs for matching game
 */
export const createMatchingPairs = (vocabulary, count = 6) => {
  const selected = getRandomItems(vocabulary, count);
  const words = selected.map((item, index) => ({
    id: `word-${index}`,
    content: item.word,
    pairId: index,
    type: 'word'
  }));
  const definitions = selected.map((item, index) => ({
    id: `def-${index}`,
    content: item.meaning,
    pairId: index,
    type: 'definition'
  }));

  return {
    items: shuffleArray([...words, ...definitions]),
    pairs: selected
  };
};

/**
 * Create memory cards
 */
export const createMemoryCards = (vocabulary, count = 6) => {
  const selected = getRandomItems(vocabulary, count);
  const cards = [];

  selected.forEach((item, index) => {
    cards.push({
      id: `word-${index}`,
      content: item.word,
      pairId: index,
      type: 'word',
      isFlipped: false,
      isMatched: false
    });
    cards.push({
      id: `def-${index}`,
      content: item.meaning,
      pairId: index,
      type: 'definition',
      isFlipped: false,
      isMatched: false
    });
  });

  return shuffleArray(cards);
};

/**
 * Calculate score based on performance
 */
export const calculateScore = (correct, total, timeBonus = 0) => {
  const accuracy = (correct / total) * 100;
  const baseScore = Math.round(accuracy);
  return Math.min(100, baseScore + timeBonus);
};

/**
 * Get performance message
 */
export const getPerformanceMessage = (score) => {
  if (score >= 90) return { message: 'Excellent!', emoji: '🌟' };
  if (score >= 75) return { message: 'Great job!', emoji: '🎉' };
  if (score >= 60) return { message: 'Good work!', emoji: '👍' };
  if (score >= 40) return { message: 'Keep practicing!', emoji: '💪' };
  return { message: 'Try again!', emoji: '📚' };
};
