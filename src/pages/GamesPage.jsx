import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Loading from '../components/common/Loading.jsx';
import Card from '../components/common/Card.jsx';
import lessonService from '../services/lessonService.js';
import { buildRoute } from '../constants/routes.js';
import { GAME_CONFIG, getAvailableGames, DIFFICULTY_COLORS } from '../constants/games.js';

/**
 * GamesPage - Game selection hub
 */
export default function GamesPage() {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();

  const [lessonInfo, setLessonInfo] = useState(null);
  const [vocabulary, setVocabulary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [lessonId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const info = lessonService.getLessonInfo(lessonId);
      const vocab = await lessonService.getVocabulary(lessonId);

      setLessonInfo(info);
      setVocabulary(vocab);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load games. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameSelect = (gameType) => {
    navigate(buildRoute.gamePlay(lessonId, gameType));
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading games..." />;
  }

  if (error) {
    return (
      <div className="games-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const availableGames = getAvailableGames(vocabulary.length);

  return (
    <div className="games-page">
      <header className="games-page__header">
        <div className="games-page__nav-buttons">
          <Button variant="secondary" onClick={() => navigate('/')}>
            ← Home
          </Button>
          <Button variant="secondary" onClick={() => navigate(buildRoute.vocabulary(lessonId))}>
            ← Back to Vocabulary
          </Button>
        </div>

        <div className="games-page__title-section">
          
          {lessonInfo && (
            
            <div className="games-page__meta">
              <h1>Games</h1>
              <span className="badge">{lessonInfo.unit}</span>
              <span className="games-page__word-count">
                {vocabulary.length} words
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="games-page__content">

        <div className="games-page__grid">
          {availableGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={() => handleGameSelect(game.id)}
            />
          ))}
        </div>

        {availableGames.length === 0 && (
          <div className="games-page__no-games">
            <p>Not enough vocabulary words to play games.</p>
            <p>Learn more words first!</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * GameCard Component
 */
function GameCard({ game, onSelect }) {
  return (
    <Card className="game-card" onClick={onSelect}>
      <div className="game-card__icon">{game.icon}</div>
      <h3 className="game-card__name">{game.name}</h3>
      <p className="game-card__description">{game.description}</p>
    </Card>
  );
}
