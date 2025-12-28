import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Loading from '../components/common/Loading.jsx';
import lessonService from '../services/lessonService.js';
import storageService from '../services/storageService.js';
import { buildRoute } from '../constants/routes.js';

/**
 * LessonCard Component
 */
function LessonCard({ lesson, stats, onVocabularyClick, onReadingClick, onExerciseClick }) {
  // Check if lesson has reading content and exercises
  const [hasReading, setHasReading] = useState(false);
  const [hasExercise, setHasExercise] = useState(false);
  const hasVocabulary = stats.totalWords > 0;

  useEffect(() => {
    // Check if lesson has reading and exercises
    lessonService.loadLesson(lesson.id)
      .then(lessonData => {
        setHasReading(!!lessonData.reading);
        setHasExercise(!!lessonData.fillInTheBlanks);
      })
      .catch(() => {
        setHasReading(false);
        setHasExercise(false);
      });
  }, [lesson.id]);

  return (
    <Card className="lesson-card">
      <div className="lesson-card__header">
        <span className="lesson-card__unit">{lesson.unit}</span>
      </div>

      <h2 className="lesson-card__title">{lesson.title}</h2>

      <div className="lesson-card__progress-section">
        <div className="lesson-card__progress-info">
          <span className="lesson-card__progress-text">
            {stats.learnedCount} / {stats.totalWords} words
          </span>
          <span className="lesson-card__progress-percent">
            {stats.progressPercent}%
          </span>
        </div>
        <div className="lesson-card__progress-bar">
          <div
            className="lesson-card__progress-fill"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="lesson-card__actions">
        {hasVocabulary && (
          <Button
            variant="secondary"
            onClick={(e) => onVocabularyClick(lesson.id, e)}
          >
            Vocabulary
          </Button>
        )}
        {hasReading && (
          <Button
            variant="secondary"
            onClick={(e) => onReadingClick(lesson.id, e)}
          >
            {lesson.typeLesson === 'listening' ? 'Listening' : 'Reading'}
          </Button>
        )}
        {hasExercise && (
          <Button
            variant="secondary"
            onClick={(e) => onExerciseClick(lesson.id, e)}
          >
            Exercise
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * HomePage - Display list of all lessons with progress
 */
export default function HomePage() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Load cached tab from localStorage
    return localStorage.getItem('homeActiveTab') || 'reading';
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadLessons();
  }, []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('homeActiveTab', activeTab);
  }, [activeTab]);

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      const lessonList = await lessonService.loadLessonList();

      // Get progress for each lesson
      const lessonsWithProgress = await Promise.all(
        lessonList.map(async (lesson) => {
          const progress = storageService.getLessonProgress(lesson.id);
          const stats = await getProgressStats({ ...lesson, progress });
          return {
            ...lesson,
            progress,
            stats
          };
        })
      );

      setLessons(lessonsWithProgress);
    } catch (err) {
      console.error('Failed to load lessons:', err);
      setError('Failed to load lessons. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVocabularyClick = (lessonId, e) => {
    e.stopPropagation();
    navigate(buildRoute.vocabulary(lessonId));
  };

  const handleReadingClick = (lessonId, e) => {
    e.stopPropagation();
    navigate(buildRoute.reading(lessonId));
  };

  const handleExerciseClick = (lessonId, e) => {
    e.stopPropagation();
    navigate(buildRoute.exercise(lessonId));
  };

  const filteredLessons = lessons.filter(lesson => lesson.typeLesson === activeTab);

  const getProgressStats = async (lesson) => {
    const { learnedWords = [] } = lesson.progress || {};

    // Load vocabulary to get total count
    let totalWords = 0;
    try {
      const vocab = await lessonService.getVocabulary(lesson.id);
      totalWords = vocab.length;
    } catch (error) {
      console.error('Failed to load vocabulary count:', error);
    }

    const learnedCount = learnedWords.length;
    const progressPercent = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;

    return {
      learnedCount,
      totalWords,
      progressPercent
    };
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading lessons..." />;
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-page__header">
        <h1>English Learning</h1>
      </header>

      <div className="home-page__tabs">
        <button
          className={`home-page__tab ${activeTab === 'reading' ? 'home-page__tab--active' : ''}`}
          onClick={() => setActiveTab('reading')}
        >
          📖 Reading
        </button>
        <button
          className={`home-page__tab ${activeTab === 'listening' ? 'home-page__tab--active' : ''}`}
          onClick={() => setActiveTab('listening')}
        >
          🎧 Listening
        </button>
      </div>

      <div className="home-page__lessons">
        {filteredLessons.length === 0 ? (
          <p className="home-page__empty">No {activeTab} lessons available</p>
        ) : (
          filteredLessons.map(lesson => {
            const stats = lesson.stats || { learnedCount: 0, totalWords: 0, progressPercent: 0 };
            return (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                stats={stats}
                onVocabularyClick={handleVocabularyClick}
                onReadingClick={handleReadingClick}
                onExerciseClick={handleExerciseClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
