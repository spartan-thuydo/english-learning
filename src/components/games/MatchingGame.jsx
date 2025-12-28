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
  const numPair = 7;
  const [gameData, setGameData] = useState(() => createMatchingPairs(vocabulary, numPair));
  const [selectedItems, setSelectedItems] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [errorItems, setErrorItems] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const { items, pairs } = gameData;
  const totalPairs = pairs.length;
  const progress = (matchedPairs.length / totalPairs) * 100;

  const handleItemClick = (item) => {
    // Don't allow clicking already matched items
    if (matchedPairs.includes(item.pairId)) return;

    // Don't allow selecting same item twice
    if (selectedItems.find(s => s.id === item.id)) {
      // Deselect if clicking the same item
      setSelectedItems(selectedItems.filter(s => s.id !== item.id));
      return;
    }

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
        // No match - show error state
        setMistakes(prev => prev + 1);
        setErrorItems([first.id, second.id]);
        setTimeout(() => {
          setErrorItems([]);
          setSelectedItems([]);
        }, 800);
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

  const isError = (item) => {
    return errorItems.includes(item.id);
  };

  const handlePlayAgain = () => {
    setGameData(createMatchingPairs(vocabulary, numPair));
    setSelectedItems([]);
    setMatchedPairs([]);
    setErrorItems([]);
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
      currentQuestion={matchedPairs.length}
      totalQuestions={totalPairs}
      correctCount={matchedPairs.length}
      mistakeCount={mistakes}
    >
      <div className="matching-game">
        <div className="matching-game__grid">
          <div className="matching-game__column matching-game__column--words">
            {items.filter(item => item.type === 'word').map(item => {
              const matched = isMatched(item);
              const selected = isSelected(item);
              const error = isError(item);
              let className = `matching-game__item matching-game__item--${item.type}`;

              if (matched) {
                className += ' matching-game__item--matched';
              } else if (error) {
                className += ' matching-game__item--error';
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

          <div className="matching-game__column matching-game__column--definitions">
            {items.filter(item => item.type === 'definition').map(item => {
              const matched = isMatched(item);
              const selected = isSelected(item);
              const error = isError(item);
              let className = `matching-game__item matching-game__item--${item.type}`;

              if (matched) {
                className += ' matching-game__item--matched';
              } else if (error) {
                className += ' matching-game__item--error';
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
      </div>
    </GameLayout>
  );
}
