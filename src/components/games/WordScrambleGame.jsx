import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameLayout from './GameLayout.jsx';
import GameResult from './GameResult.jsx';
import Button from '../common/Button.jsx';
import { buildRoute } from '../../constants/routes.js';
import { GAME_CONFIG, GAME_TYPES } from '../../constants/games.js';
import { shuffleArray, scrambleWord, isCorrectAnswer, calculateScore } from '../../utils/gameUtils.js';

/**
 * WordScrambleGame - Unscramble letters to form words
 */
export default function WordScrambleGame({ lessonId, vocabulary }) {
  const navigate = useNavigate();
  const gameConfig = GAME_CONFIG[GAME_TYPES.WORD_SCRAMBLE];

  const [questions, setQuestions] = useState(() => generateScrambledWords(vocabulary));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
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

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameComplete(true);
    }
  };

  const handlePlayAgain = () => {
    setQuestions(generateScrambledWords(vocabulary));
    setCurrentIndex(0);
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setGameComplete(false);
  };

  const handleBackToGames = () => {
    navigate(buildRoute.games(lessonId));
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
      <div className="word-scramble-game">
        <div className="word-scramble-game__counter">
          Word {currentIndex + 1} of {questions.length}
        </div>

        <div className="word-scramble-game__definition">
          <div className="word-scramble-game__label">Definition:</div>
          <div className="word-scramble-game__text">
            {currentQuestion.definition}
          </div>
        </div>

        <div className="word-scramble-game__scrambled">
          <div className="word-scramble-game__label">Scrambled letters:</div>
          <div className="word-scramble-game__letters">
            {currentQuestion.scrambled}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="word-scramble-game__form">
          <input
            type="text"
            className="word-scramble-game__input"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type the word..."
            disabled={isAnswered}
            autoFocus
          />

          {!isAnswered && (
            <Button
              type="submit"
              variant="primary"
              disabled={!userAnswer.trim()}
            >
              Submit
            </Button>
          )}
        </form>

        {isAnswered && (
          <div className="word-scramble-game__feedback">
            {isCorrect ? (
              <div className="feedback feedback--correct">
                Correct! The word is "{currentQuestion.word}"
              </div>
            ) : (
              <div className="feedback feedback--wrong">
                Incorrect. The correct word is "{currentQuestion.word}"
              </div>
            )}
          </div>
        )}

        {isAnswered && (
          <div className="word-scramble-game__actions">
            <Button variant="primary" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next Word' : 'Finish'} (Press Enter)
            </Button>
          </div>
        )}
      </div>
    </GameLayout>
  );
}

/**
 * Generate scrambled word questions
 */
function generateScrambledWords(vocabulary, count = 10) {
  const shuffled = shuffleArray(vocabulary);
  const selected = shuffled.slice(0, Math.min(count, vocabulary.length));

  return selected.map(item => ({
    word: item.word,
    definition: item.meaning,
    scrambled: scrambleWord(item.word)
  }));
}
