/**
 * Game types configuration
 */

export const GAME_TYPES = {
  FLASHCARD: 'flashcard',
  MULTIPLE_CHOICE: 'multiple-choice',
  MATCHING: 'matching',
  GUESS_DEFINITION: 'guess-definition'
};

export const GAME_CONFIG = {
  [GAME_TYPES.FLASHCARD]: {
    id: GAME_TYPES.FLASHCARD,
    name: 'FlashCard',
    description: 'Review vocabulary with interactive flashcards. Flip cards to see definitions and examples.',
    icon: '📇',
    difficulty: 'easy',
    minWords: 1
  },
  [GAME_TYPES.MULTIPLE_CHOICE]: {
    id: GAME_TYPES.MULTIPLE_CHOICE,
    name: 'Multiple Choice',
    description: 'Choose the correct definition from multiple options. Test your understanding.',
    icon: '✓',
    difficulty: 'medium',
    minWords: 4
  },
  [GAME_TYPES.MATCHING]: {
    id: GAME_TYPES.MATCHING,
    name: 'Match Game',
    description: 'Match words with their correct definitions. Connect the pairs!',
    icon: '🔗',
    difficulty: 'medium',
    minWords: 4
  },
  [GAME_TYPES.GUESS_DEFINITION]: {
    id: GAME_TYPES.GUESS_DEFINITION,
    name: 'Guess by Definition',
    description: 'Type the correct word based on its definition. Perfect your spelling!',
    icon: '💭',
    difficulty: 'hard',
    minWords: 1
  }
};

export const DIFFICULTY_COLORS = {
  easy: '#4caf50',
  medium: '#ff9800',
  hard: '#f44336'
};

export const getAvailableGames = (vocabularyCount) => {
  return Object.values(GAME_CONFIG).filter(
    game => vocabularyCount >= game.minWords
  );
};
