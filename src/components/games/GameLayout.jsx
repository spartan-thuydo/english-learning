import { useNavigate } from 'react-router-dom';
import Button from '../common/Button.jsx';
import { buildRoute } from '../../constants/routes.js';

/**
 * GameLayout - Common layout wrapper for all games
 */
export default function GameLayout({
  lessonId,
  gameTitle,
  gameIcon,
  children,
  score,
  progress,
  currentQuestion,
  totalQuestions,
  correctCount,
  mistakeCount,
  showBackButton = true,
  onResetGame,
  onShowWordLists,
  showGameControls = false
}) {
  const navigate = useNavigate();

  return (
    <div className="game-layout">
      <header className="game-layout__header">
        <div className="game-layout__header-left">
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
          >
            ← Home
          </Button>
          {showBackButton && (
            <Button
              variant="secondary"
              onClick={() => navigate(buildRoute.games(lessonId))}
            >
              ← Back
            </Button>
          )}
        </div>

        <div className="game-layout__title">
          <span className="game-layout__icon">{gameIcon}</span>
          <h1>{gameTitle}</h1>
        </div>

        <div className="game-layout__header-right">
          {/* Reserved for future use */}
        </div>
      </header>

      <div className="game-layout__content">
        {children}
      </div>

      {progress !== undefined && (
        <div className="game-layout__footer">
          <div className="game-layout__progress">
            <div className="game-layout__progress-info">
              {currentQuestion !== undefined && totalQuestions !== undefined && (
                <span className="game-layout__progress-label">
                  Question {currentQuestion}/{totalQuestions}
                  {correctCount !== undefined && (
                    <> • <span className="game-layout__progress-correct">✓ {correctCount}</span></>
                  )}
                  {mistakeCount !== undefined && (
                    <> • <span className="game-layout__progress-mistake">✗ {mistakeCount}</span></>
                  )}
                </span>
              )}
              {currentQuestion === undefined && (
                <span className="game-layout__progress-label">{Math.round(progress)}%</span>
              )}
            </div>
            <div className="game-layout__progress-bar">
              <div
                className="game-layout__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {showGameControls && (
            <div className="game-layout__footer-actions">
              <Button
                variant="secondary"
                size="small"
                onClick={onResetGame}
              >
                🔄 Reset
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={onShowWordLists}
              >
                📋 Review
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
