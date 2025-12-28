import Button from '../common/Button.jsx';
import { getPerformanceMessage } from '../../utils/gameUtils.js';

/**
 * GameResult - Reusable result screen component
 */
export default function GameResult({
  score,
  totalQuestions,
  correctAnswers,
  onPlayAgain,
  onBackToGames
}) {
  const { message, emoji } = getPerformanceMessage(score);
  const accuracy = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  return (
    <div className="game-result">
      <div className="game-result__content">
        <div className="game-result__emoji">{emoji}</div>
        <h2 className="game-result__message">{message}</h2>

        <div className="game-result__stats">
          <div className="game-result__stat">
            <span className="game-result__stat-label">Score</span>
            <span className="game-result__stat-value">{score}/100</span>
          </div>
          <div className="game-result__stat">
            <span className="game-result__stat-label">Accuracy</span>
            <span className="game-result__stat-value">{accuracy}%</span>
          </div>
          <div className="game-result__stat">
            <span className="game-result__stat-label">Correct</span>
            <span className="game-result__stat-value">
              {correctAnswers}/{totalQuestions}
            </span>
          </div>
        </div>

        <div className="game-result__actions">
          <Button variant="primary" onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button variant="secondary" onClick={onBackToGames}>
            Back to Games
          </Button>
        </div>
      </div>
    </div>
  );
}
