import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameLayout from './GameLayout.jsx';
import GameResult from './GameResult.jsx';
import Button from '../common/Button.jsx';
import { buildRoute } from '../../constants/routes.js';
import { GAME_CONFIG, GAME_TYPES } from '../../constants/games.js';
import { shuffleArray, isCorrectAnswer, calculateScore } from '../../utils/gameUtils.js';

/**
 * GuessDefinitionGame - Type the correct word from definition
 */
export default function GuessDefinitionGame({ lessonId, vocabulary }) {
  const navigate = useNavigate();
  const gameConfig = GAME_CONFIG[GAME_TYPES.GUESS_DEFINITION];

  const [questions, setQuestions] = useState(() => shuffleArray(vocabulary).slice(0, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Handle Enter key for next question
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && isAnswered) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnswered, currentIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAnswered || !userAnswer.trim()) return;

    const correct = isCorrectAnswer(userAnswer, currentQuestion.word);
    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameComplete(true);
    }
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  const handlePlayAgain = () => {
    setQuestions(shuffleArray(vocabulary).slice(0, 10));
    setCurrentIndex(0);
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setShowHint(false);
    setGameComplete(false);
  };

  const handleBackToGames = () => {
    navigate(buildRoute.games(lessonId));
  };

  const getHint = (word) => {
    const length = word.length;
    if (length <= 2) return word[0] + '_';
    if (length <= 4) return word[0] + '_'.repeat(length - 2) + word[length - 1];
    return word[0] + word[1] + '_'.repeat(length - 3) + word[length - 1];
  };

  if (gameComplete) {
    const score = calculateScore(correctCount, questions.length);
    return (
      <GameLayout
        lessonId={lessonId}
        gameTitle={gameConfig.name}
        gameIcon={gameConfig.icon}
        showBackButton={false}
      >
        <GameResult
          score={score}
          totalQuestions={questions.length}
          correctAnswers={correctCount}
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
      score={correctCount}
    >
      <div className="guess-definition-game">
        <div className="guess-definition-game__counter">
          Question {currentIndex + 1} of {questions.length}
        </div>

        <div className="guess-definition-game__definition">
          <div className="guess-definition-game__label">Definition:</div>
          <div className="guess-definition-game__text">
            {currentQuestion.meaning}
          </div>
        </div>

        {currentQuestion.example && !isAnswered && (
          <div className="guess-definition-game__example">
            <div className="guess-definition-game__label">Example:</div>
            <div className="guess-definition-game__text">
              {currentQuestion.example}
            </div>
          </div>
        )}

        {showHint && !isAnswered && (
          <div className="guess-definition-game__hint">
            Hint: {getHint(currentQuestion.word)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="guess-definition-game__form">
          <input
            type="text"
            className="guess-definition-game__input"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type the word..."
            disabled={isAnswered}
            autoFocus
          />

          {!isAnswered && (
            <div className="guess-definition-game__form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleShowHint}
                disabled={showHint}
              >
                Show Hint
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!userAnswer.trim()}
              >
                Submit
              </Button>
            </div>
          )}
        </form>

        {isAnswered && (
          <div className="guess-definition-game__feedback">
            {isCorrect ? (
              <div className="feedback feedback--correct">
                Correct! Perfect spelling!
              </div>
            ) : (
              <div className="feedback feedback--wrong">
                <p>Incorrect. The correct word is:</p>
                <p className="feedback__answer">"{currentQuestion.word}"</p>
                {currentQuestion.pronunciation && (
                  <p className="feedback__pronunciation">
                    /{currentQuestion.pronunciation}/
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {isAnswered && (
          <div className="guess-definition-game__actions">
            <Button variant="primary" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish'} (Press Enter)
            </Button>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
