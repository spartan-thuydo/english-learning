import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameLayout from './GameLayout.jsx';
import GameResult from './GameResult.jsx';
import Button from '../common/Button.jsx';
import { buildRoute } from '../../constants/routes.js';
import { GAME_CONFIG, GAME_TYPES } from '../../constants/games.js';
import { shuffleArray, generateWrongOptions, calculateScore } from '../../utils/gameUtils.js';

/**
 * MultipleChoiceGame - Choose the correct definition
 */
export default function MultipleChoiceGame({ lessonId, vocabulary }) {
  const navigate = useNavigate();
  const gameConfig = GAME_CONFIG[GAME_TYPES.MULTIPLE_CHOICE];

  const [questions, setQuestions] = useState(() => generateQuestions(vocabulary));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Handle Enter key press
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && isAnswered) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnswered, currentIndex]);

  const handleSelectAnswer = (option) => {
    if (isAnswered) return;

    setSelectedAnswer(option);
    setIsAnswered(true);

    if (option === currentQuestion.correctAnswer) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameComplete(true);
    }
  };

  const handlePlayAgain = () => {
    setQuestions(generateQuestions(vocabulary));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setWrongCount(0);
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
      currentQuestion={currentIndex + 1}
      totalQuestions={questions.length}
      correctCount={correctCount}
      mistakeCount={wrongCount}
    >
      <div className="multiple-choice-game">
        <div className="multiple-choice-game__question">
          <div className="multiple-choice-game__word">
            {currentQuestion.word}
          </div>
        </div>

        <div className="multiple-choice-game__options">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = option === selectedAnswer;
            let className = 'multiple-choice-game__option';

            if (isAnswered) {
              if (isSelected && isCorrect) {
                className += ' multiple-choice-game__option--correct';
              } else if (isSelected && !isCorrect) {
                className += ' multiple-choice-game__option--wrong';
              } else if (isCorrect) {
                className += ' multiple-choice-game__option--correct';
              }
            }

            return (
              <button
                key={index}
                className={className}
                onClick={() => handleSelectAnswer(option)}
                disabled={isAnswered}
              >
                <span className="multiple-choice-game__option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="multiple-choice-game__option-text">
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="multiple-choice-game__feedback">
            {selectedAnswer === currentQuestion.correctAnswer ? (
              <div className="feedback feedback--correct">
                Correct!
              </div>
            ) : (
              <div className="feedback feedback--wrong">
                Incorrect
              </div>
            )}
          </div>
        )}

        {isAnswered && (
          <div className="multiple-choice-game__actions">
            <Button variant="primary" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </div>
        )}
      </div>
    </GameLayout>
  );
}

/**
 * Generate multiple choice questions
 */
function generateQuestions(vocabulary, count = 10) {
  const shuffled = shuffleArray(vocabulary);
  const selected = shuffled.slice(0, Math.min(count, vocabulary.length));

  return selected.map(item => {
    const allDefinitions = vocabulary.map(v => v.meaning);
    const wrongOptions = generateWrongOptions(item.meaning, allDefinitions, 3);
    const options = shuffleArray([item.meaning, ...wrongOptions]);

    return {
      word: item.word,
      correctAnswer: item.meaning,
      options
    };
  });
}
