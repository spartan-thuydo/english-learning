import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button.jsx';
import { buildRoute } from '../../constants/routes.js';

/**
 * FillInTheBlanksExercise - Fill in the blanks exercise with drag & drop
 */
export default function FillInTheBlanksExercise({ exerciseData, lessonId }) {
  const navigate = useNavigate();

  // Check if new format (with tasks) or old format (single task)
  const hasTasks = exerciseData.tasks && exerciseData.tasks.length > 0;
  const tasks = hasTasks ? exerciseData.tasks : [{
    id: 'single_task',
    title: 'Fill In The Blanks',
    wordBank: exerciseData.wordBank,
    questions: exerciseData.questions
  }];

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showTranslations, setShowTranslations] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedBlank, setSelectedBlank] = useState(null);

  // Get cache key for current task
  const getCacheKey = (taskIdx) => `exercise-${lessonId}-task-${taskIdx}`;

  // Load cached data for current task
  const loadCachedData = (taskIdx) => {
    try {
      const cached = localStorage.getItem(getCacheKey(taskIdx));
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to load cached exercise data:', e);
    }
    return { userAnswers: {}, checkedAnswers: {}, showResults: false };
  };

  // Initialize with cached data
  const [userAnswers, setUserAnswers] = useState(() => loadCachedData(0).userAnswers);
  const [checkedAnswers, setCheckedAnswers] = useState(() => loadCachedData(0).checkedAnswers);
  const [showResults, setShowResults] = useState(() => loadCachedData(0).showResults);

  const currentTask = tasks[currentTaskIndex];
  const isLastTask = currentTaskIndex === tasks.length - 1;
  const isFirstTask = currentTaskIndex === 0;

  // Save to localStorage whenever answers change
  useEffect(() => {
    try {
      localStorage.setItem(
        getCacheKey(currentTaskIndex),
        JSON.stringify({ userAnswers, checkedAnswers, showResults })
      );
    } catch (e) {
      console.error('Failed to save exercise data:', e);
    }
  }, [userAnswers, checkedAnswers, showResults, currentTaskIndex, lessonId]);

  const handleWordClick = (word) => {
    if (showResults) return; // Don't allow changes after submit

    if (selectedBlank) {
      // If a blank is selected, fill it with this word
      setUserAnswers(prev => ({
        ...prev,
        [selectedBlank]: word
      }));
      // Clear checked status when answer changes
      if (checkedAnswers[selectedBlank] !== undefined) {
        setCheckedAnswers(prev => ({
          ...prev,
          [selectedBlank]: undefined
        }));
      }
      setSelectedBlank(null);
      setSelectedWord(null);
    } else {
      // Otherwise, just select this word
      setSelectedWord(word);
    }
  };

  const handleBlankClick = (questionId) => {
    if (showResults) return; // Don't allow changes after submit

    if (selectedWord) {
      // If a word is selected, fill this blank with it
      setUserAnswers(prev => ({
        ...prev,
        [questionId]: selectedWord
      }));
      // Clear checked status when answer changes
      if (checkedAnswers[questionId] !== undefined) {
        setCheckedAnswers(prev => ({
          ...prev,
          [questionId]: undefined
        }));
      }
      setSelectedWord(null);
      setSelectedBlank(null);
    } else {
      // Otherwise, just select this blank
      setSelectedBlank(questionId);
    }
  };

  const handleRemoveAnswer = (questionId) => {
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
    setCheckedAnswers(prev => {
      const newChecked = { ...prev };
      delete newChecked[questionId];
      return newChecked;
    });
    setSelectedWord(null);
    setSelectedBlank(null);
  };

  const checkAllAnswers = () => {
    const newChecked = {};
    currentTask.questions.forEach(q => {
      const userAnswer = userAnswers[q.id] || '';
      newChecked[q.id] = userAnswer.toLowerCase() === q.answer.toLowerCase();
    });
    setCheckedAnswers(newChecked);
    setShowResults(true);
    setSelectedWord(null);
    setSelectedBlank(null);

    // Auto scroll to top to see results
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleNextTask = () => {
    if (!isLastTask) {
      const nextIdx = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIdx);
      const cached = loadCachedData(nextIdx);
      setUserAnswers(cached.userAnswers);
      setCheckedAnswers(cached.checkedAnswers);
      setShowResults(cached.showResults);
      setShowTranslations(false);
      setShowAnswers(false);
      setSelectedWord(null);
      setSelectedBlank(null);
    }
  };

  const handlePrevTask = () => {
    if (!isFirstTask) {
      const prevIdx = currentTaskIndex - 1;
      setCurrentTaskIndex(prevIdx);
      const cached = loadCachedData(prevIdx);
      setUserAnswers(cached.userAnswers);
      setCheckedAnswers(cached.checkedAnswers);
      setShowResults(cached.showResults);
      setShowTranslations(false);
      setShowAnswers(false);
      setSelectedWord(null);
      setSelectedBlank(null);
    }
  };

  const resetTask = () => {
    setUserAnswers({});
    setCheckedAnswers({});
    setShowResults(false);
    setShowAnswers(false);
    setShowTranslations(false);
    setSelectedWord(null);
    setSelectedBlank(null);
    // Clear from localStorage
    try {
      localStorage.removeItem(getCacheKey(currentTaskIndex));
    } catch (e) {
      console.error('Failed to clear cached exercise data:', e);
    }
  };

  const getResults = () => {
    const total = currentTask.questions.length;
    const correct = Object.values(checkedAnswers).filter(Boolean).length;
    const percentage = Math.round((correct / total) * 100);
    return { total, correct, percentage };
  };

  const results = showResults ? getResults() : null;

  // Build word bank from answers instead of config
  const usedWords = Object.values(userAnswers);
  const allAnswers = currentTask.questions.map(q => q.answer);
  const availableWords = allAnswers.filter(word =>
    !usedWords.includes(word)
  );

  // Parse sentence to replace "…………." with drop zone
  const renderSentenceWithDropZone = (sentence, questionId, userAnswer, isChecked, isCorrect) => {
    const blankPattern = /[.…]{2,}/; // Match dots or ellipsis
    const parts = sentence.split(blankPattern);

    if (parts.length === 1) {
      // No blank found, return sentence as is
      return <span>{sentence}</span>;
    }

    return (
      <span className="fill-blanks-question__sentence-with-blank">
        {parts[0]}
        <span
          className={`fill-blanks-question__inline-drop-zone ${
            userAnswer ? 'fill-blanks-question__inline-drop-zone--filled' : ''
          } ${isChecked && isCorrect ? 'fill-blanks-question__inline-drop-zone--correct' : ''} ${
            isChecked && !isCorrect ? 'fill-blanks-question__inline-drop-zone--wrong' : ''
          } ${selectedBlank === questionId ? 'fill-blanks-question__inline-drop-zone--selected' : ''}`}
          onClick={() => handleBlankClick(questionId)}
        >
          {userAnswer ? (
            <span
              className="fill-blanks-question__inline-answer"
              onClick={(e) => {
                if (!showResults) {
                  e.stopPropagation();
                  handleRemoveAnswer(questionId);
                }
              }}
              style={{ cursor: showResults ? 'default' : 'pointer' }}
            >
              {userAnswer}
            </span>
          ) : (
            <span className="fill-blanks-question__blank-placeholder"></span>
          )}
        </span>
        {parts[1]}
      </span>
    );
  };

  return (
    <div className="fill-blanks-exercise">

            {/* Task Navigation */}
      {hasTasks && (
        <div className="fill-blanks-exercise__task-nav">
          <Button
            variant="secondary"
            size="small"
            onClick={handlePrevTask}
            disabled={isFirstTask}
          >
            ← Previous Task
          </Button>
          <span className="fill-blanks-exercise__task-counter">
            Task {currentTaskIndex + 1} / {tasks.length}
          </span>
          <Button
            variant="secondary"
            size="small"
            onClick={handleNextTask}
            disabled={isLastTask}
          >
            Next Task →
          </Button>
        </div>
      )}

      {/* Results Summary */}
      {showResults && results && (
        <div className="fill-blanks-exercise__results">
          <div className="fill-blanks-exercise__results-icon">
            {results.percentage >= 70 ? '🎉' : '📝'}
          </div>
          <h2>Task {currentTaskIndex + 1} Complete!</h2>
          <div className="fill-blanks-exercise__results-stats">
            <div className="stat stat--success">
              <span className="stat__value">{results.correct}</span>
              <span className="stat__label">Correct</span>
            </div>
            <div className="stat stat--neutral">
              <span className="stat__value">{results.total - results.correct}</span>
              <span className="stat__label">Wrong</span>
            </div>
            <div className="stat stat--primary">
              <span className="stat__value">{results.percentage}%</span>
              <span className="stat__label">Score</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Container for Actions and Word Bank */}
      <div className="fill-blanks-exercise__sticky-container">
        {/* Actions */}
        <div className="fill-blanks-exercise__actions">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowTranslations(!showTranslations)}
          >
            {showTranslations ? 'Hide' : 'Show'} Translations
          </Button>

          <Button
            variant=""
            size="small"
            onClick={resetTask}
          >
            Reset
          </Button>

          {!showResults ? (
            <Button
              variant="primary"
              onClick={checkAllAnswers}
            >
              Submit Answers
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowAnswers(!showAnswers)}
            >
              {showAnswers ? 'Hide' : 'Show'} Answers
            </Button>
          )}

        </div>

        {/* Word Bank - Clickable */}
        <div className="fill-blanks-exercise__word-bank">
          <div className="fill-blanks-exercise__words">
            {availableWords.map((word, index) => (
              <div
                key={index}
                className={`fill-blanks-exercise__word fill-blanks-exercise__word--clickable ${
                  selectedWord === word ? 'fill-blanks-exercise__word--selected' : ''
                }`}
                onClick={() => handleWordClick(word)}
              >
                {word}
              </div>
            ))}
            {availableWords.length === 0 && (
              <span className="fill-blanks-exercise__word-empty">All words used!</span>
            )}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="fill-blanks-exercise__questions">
        {currentTask.questions.map((question, index) => {
          const isChecked = checkedAnswers[question.id] !== undefined;
          const isCorrect = checkedAnswers[question.id];
          const userAnswer = userAnswers[question.id] || '';

          return (
            <div
              key={question.id}
              className={`fill-blanks-question ${
                isChecked
                  ? isCorrect
                    ? 'fill-blanks-question--correct'
                    : 'fill-blanks-question--wrong'
                  : ''
              }`}
            >
              <div className="fill-blanks-question__number">{index + 1}.</div>
              <div className="fill-blanks-question__content">
                <div className="fill-blanks-question__sentence">
                  {renderSentenceWithDropZone(question.sentence, question.id, userAnswer, isChecked, isCorrect)}
                </div>

                {/* Feedback */}
                {isChecked && !isCorrect && (
                  <div className="fill-blanks-question__feedback">
                    <span className="fill-blanks-question__wrong-mark">✗</span>
                    {showAnswers && (
                      <span>Correct answer: <strong>{question.answer}</strong></span>
                    )}
                  </div>
                )}
                {isChecked && isCorrect && (
                  <div className="fill-blanks-question__feedback fill-blanks-question__feedback--correct">
                    <span className="fill-blanks-question__correct-mark">✓</span>
                    Correct!
                  </div>
                )}

                {/* Translation */}
                {showTranslations && (
                  <div className="fill-blanks-question__translation">
                    {question.translation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
