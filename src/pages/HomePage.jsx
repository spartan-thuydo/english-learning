import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card.jsx';
import Loading from '../components/common/Loading.jsx';
import lessonService from '../services/lessonService.js';
import storageService from '../services/storageService.js';
import { buildRoute } from '../constants/routes.js';

/**
 * HomePage - Display list of all lessons with progress
 */
export default function HomePage() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadLessons();
  }, []);

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

  const handleLessonClick = (lessonId) => {
    navigate(buildRoute.reading(lessonId));
  };

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
        <p className="home-page__subtitle">Interactive Reading & Vocabulary Practice</p>
      </header>

      <div className="home-page__lessons">
        {lessons.length === 0 ? (
          <p className="home-page__empty">No lessons available</p>
        ) : (
          lessons.map(lesson => {
            const stats = lesson.stats || { learnedCount: 0, totalWords: 0, progressPercent: 0 };
            return (
              <Card
                key={lesson.id}
                hoverable
                onClick={() => handleLessonClick(lesson.id)}
                className="lesson-card"
              >
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
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
