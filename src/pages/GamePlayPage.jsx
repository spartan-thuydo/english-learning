import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../components/common/Loading.jsx';
import lessonService from '../services/lessonService.js';
import { GAME_TYPES } from '../constants/games.js';
import { buildRoute } from '../constants/routes.js';

// Game components (will be imported as we create them)
import FlashCardGame from '../components/games/FlashCardGame.jsx';
import MultipleChoiceGame from '../components/games/MultipleChoiceGame.jsx';
import MatchingGame from '../components/games/MatchingGame.jsx';
import WordScrambleGame from '../components/games/WordScrambleGame.jsx';
import GuessDefinitionGame from '../components/games/GuessDefinitionGame.jsx';
import MemoryGame from '../components/games/MemoryGame.jsx';

/**
 * GameFactory - Factory pattern for game components
 */
const GameFactory = {
  [GAME_TYPES.FLASHCARD]: FlashCardGame,
  [GAME_TYPES.MULTIPLE_CHOICE]: MultipleChoiceGame,
  [GAME_TYPES.MATCHING]: MatchingGame,
  [GAME_TYPES.WORD_SCRAMBLE]: WordScrambleGame,
  [GAME_TYPES.GUESS_DEFINITION]: GuessDefinitionGame,
  [GAME_TYPES.MEMORY]: MemoryGame
};

/**
 * GamePlayPage - Main game container using Factory pattern
 */
export default function GamePlayPage() {
  const { id: lessonId, gameType } = useParams();
  const navigate = useNavigate();

  const [vocabulary, setVocabulary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVocabulary();
  }, [lessonId]);

  const loadVocabulary = async () => {
    try {
      setIsLoading(true);
      const vocab = await lessonService.getVocabulary(lessonId);
      setVocabulary(vocab);
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
      setError('Failed to load vocabulary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading game..." />;
  }

  if (error) {
    return (
      <div className="game-play-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Get the appropriate game component using Factory pattern
  const GameComponent = GameFactory[gameType];

  if (!GameComponent) {
    return (
      <div className="game-play-page">
        <div className="error-message">Game not found</div>
        <button onClick={() => navigate(buildRoute.games(lessonId))}>
          Back to Games
        </button>
      </div>
    );
  }

  return (
    <div className="game-play-page">
      <GameComponent
        lessonId={lessonId}
        vocabulary={vocabulary}
      />
    </div>
  );
}
