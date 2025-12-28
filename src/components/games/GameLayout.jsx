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
  showBackButton = true,
  onResetGame,
  onShowWordLists,
  showGameControls = false,
  compactHeader = false
}) {
  const navigate = useNavigate();

  return (
    <div className="game-layout">
      <header className={`game-layout__header ${compactHeader ? 'game-layout__header--compact' : ''}`}>
        {compactHeader ? (
          <>
            {/* Compact mode: Title on top, 3 buttons below */}
            <div className="game-layout__title">
              <span className="game-layout__icon">{gameIcon}</span>
              <h1>{gameTitle}</h1>
            </div>
            <div className="game-layout__header-actions">
              {showBackButton && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(buildRoute.games(lessonId))}
                >
                  ← Back
                </Button>
              )}
              {showGameControls && (
                <>
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
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Normal mode: 3 column layout */}
            <div className="game-layout__header-left">
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
              {showGameControls && (
                <>
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
                </>
              )}
              {score !== undefined && (
                <div className="game-layout__score">
                  Score: <strong>{score}</strong>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {progress !== undefined && (
        <div className="game-layout__progress">
          <div className="game-layout__progress-bar">
            <div
              className="game-layout__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="game-layout__progress-text">{Math.round(progress)}%</span>
        </div>
      )}

      <div className="game-layout__content">
        {children}
      </div>
    </div>
  );
}
