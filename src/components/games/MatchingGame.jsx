import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameLayout from './GameLayout.jsx';
import GameResult from './GameResult.jsx';
import Button from '../common/Button.jsx';
import { buildRoute } from '../../constants/routes.js';
import { GAME_CONFIG, GAME_TYPES } from '../../constants/games.js';
import { createMatchingPairs, calculateScore } from '../../utils/gameUtils.js';

/**
 * MatchingGame - Match words with definitions
 */
export default function MatchingGame({ lessonId, vocabulary }) {
  const navigate = useNavigate();
  const gameConfig = GAME_CONFIG[GAME_TYPES.MATCHING];

  const [gameData, setGameData] = useState(() => createMatchingPairs(vocabulary, 6));
  const [selectedItems, setSelectedItems] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const { items, pairs } = gameData;
  const totalPairs = pairs.length;
  const progress = (matchedPairs.length / totalPairs) * 100;

  const handleItemClick = (item) => {
    // Don't allow clicking already matched items
    if (matchedPairs.includes(item.pairId)) return;

    // Don't allow selecting same item twice
    if (selectedItems.find(s => s.id === item.id)) return;

    const newSelected = [...selectedItems, item];

    // If we have 2 selected items, check for match
    if (newSelected.length === 2) {
      const [first, second] = newSelected;

      if (first.pairId === second.pairId) {
        // Match found!
        setMatchedPairs(prev => [...prev, first.pairId]);
        setSelectedItems([]);

        // Check if game is complete
        if (matchedPairs.length + 1 === totalPairs) {
          setTimeout(() => setGameComplete(true), 500);
        }
      } else {
        // No match
        setMistakes(prev => prev + 1);
        setTimeout(() => setSelectedItems([]), 800);
      }
    } else {
      setSelectedItems(newSelected);
    }
  };

  const isSelected = (item) => {
    return selectedItems.find(s => s.id === item.id);
  };

  const isMatched = (item) => {
    return matchedPairs.includes(item.pairId);
  };

  const handlePlayAgain = () => {
    setGameData(createMatchingPairs(vocabulary, 6));
    setSelectedItems([]);
    setMatchedPairs([]);
    setMistakes(0);
    setGameComplete(false);
  };

  const handleBackToGames = () => {
    navigate(buildRoute.games(lessonId));
  };

  if (gameComplete) {
    const score = calculateScore(totalPairs, totalPairs + mistakes);
    return (
      <GameLayout
        lessonId={lessonId}
        gameTitle={gameConfig.name}
        gameIcon={gameConfig.icon}
        showBackButton={false}
      >
        <GameResult
          score={score}
          totalQuestions={totalPairs}
          correctAnswers={totalPairs}
          onPlayAgain={handlePlayAgain}
          onBackToGames={handleBackToGames}
        />
      </GameLayout>
    );
  }

  return (
    <GameLayout
      lessonId={lessonId}
      gameTitle={gameConfig.name}
      gameIcon={gameConfig.icon}
      progress={progress}
    >
      <div className="matching-game">
        <div className="matching-game__instructions">
          Click on a word and then its matching definition. Find all pairs!
        </div>

        <div className="matching-game__stats">
          <div className="stat">
            <span className="stat__value">{matchedPairs.length}/{totalPairs}</span>
            <span className="stat__label">Matched</span>
          </div>
          <div className="stat">
            <span className="stat__value">{mistakes}</span>
            <span className="stat__label">Mistakes</span>
          </div>
        </div>

        <div className="matching-game__grid">
          {items.map(item => {
            const matched = isMatched(item);
            const selected = isSelected(item);
            let className = `matching-game__item matching-game__item--${item.type}`;

            if (matched) {
              className += ' matching-game__item--matched';
            } else if (selected) {
              className += ' matching-game__item--selected';
            }

            return (
              <button
                key={item.id}
                className={className}
                onClick={() => handleItemClick(item)}
                disabled={matched}
              >
                <div className="matching-game__item-content">
                  {item.content}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}
