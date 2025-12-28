import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameLayout from './GameLayout.jsx';
import GameResult from './GameResult.jsx';
import { buildRoute } from '../../constants/routes.js';
import { GAME_CONFIG, GAME_TYPES } from '../../constants/games.js';
import { createMemoryCards, calculateScore } from '../../utils/gameUtils.js';

/**
 * MemoryGame - Find matching pairs of words and definitions
 */
export default function MemoryGame({ lessonId, vocabulary }) {
  const navigate = useNavigate();
  const gameConfig = GAME_CONFIG[GAME_TYPES.MEMORY];

  const [cards, setCards] = useState(() => createMemoryCards(vocabulary, 6));
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const totalPairs = cards.length / 2;
  const progress = (matchedPairs.length / totalPairs) * 100;

  const handleCardClick = (card) => {
    // Don't allow clicking if:
    // - Card is already flipped
    // - Card is already matched
    // - Two cards are already flipped
    if (
      flippedCards.find(c => c.id === card.id) ||
      matchedPairs.includes(card.pairId) ||
      flippedCards.length >= 2
    ) {
      return;
    }

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    // Check for match when two cards are flipped
    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);

      const [first, second] = newFlipped;

      if (first.pairId === second.pairId) {
        // Match found!
        setMatchedPairs(prev => {
          const newMatched = [...prev, first.pairId];

          // Check if game is complete
          if (newMatched.length === totalPairs) {
            setTimeout(() => setGameComplete(true), 500);
          }

          return newMatched;
        });
        setFlippedCards([]);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const isCardFlipped = (card) => {
    return flippedCards.find(c => c.id === card.id) || matchedPairs.includes(card.pairId);
  };

  const isCardMatched = (card) => {
    return matchedPairs.includes(card.pairId);
  };

  const handlePlayAgain = () => {
    setCards(createMemoryCards(vocabulary, 6));
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameComplete(false);
  };

  const handleBackToGames = () => {
    navigate(buildRoute.games(lessonId));
  };

  if (gameComplete) {
    const score = calculateScore(totalPairs, moves);
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
      <div className="memory-game">
        <div className="memory-game__instructions">
          Find matching pairs of words and their definitions!
        </div>

        <div className="memory-game__stats">
          <div className="stat">
            <span className="stat__value">{matchedPairs.length}/{totalPairs}</span>
            <span className="stat__label">Pairs Found</span>
          </div>
          <div className="stat">
            <span className="stat__value">{moves}</span>
            <span className="stat__label">Moves</span>
          </div>
        </div>

        <div className="memory-game__grid">
          {cards.map(card => {
            const flipped = isCardFlipped(card);
            const matched = isCardMatched(card);
            let className = `memory-card memory-card--${card.type}`;

            if (flipped) {
              className += ' memory-card--flipped';
            }
            if (matched) {
              className += ' memory-card--matched';
            }

            return (
              <button
                key={card.id}
                className={className}
                onClick={() => handleCardClick(card)}
              >
                <div className="memory-card__inner">
                  <div className="memory-card__front">
                    ?
                  </div>
                  <div className="memory-card__back">
                    <div className="memory-card__content">
                      {card.content}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}
