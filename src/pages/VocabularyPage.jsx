import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Loading from '../components/common/Loading.jsx';
import VocabularyList from '../components/vocabulary/VocabularyList.jsx';
import lessonService from '../services/lessonService.js';
import storageService from '../services/storageService.js';
import { buildRoute } from '../constants/routes.js';

/**
 * VocabularyPage - Display vocabulary list with learning progress
 */
export default function VocabularyPage() {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();

  const [lessonInfo, setLessonInfo] = useState(null);
  const [vocabulary, setVocabulary] = useState([]);
  const [learnedWords, setLearnedWords] = useState([]);
  const [hasReading, setHasReading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVocabulary();
  }, [lessonId]);

  const loadVocabulary = async () => {
    try {
      setIsLoading(true);

      // Load lesson info and vocabulary
      const info = lessonService.getLessonInfo(lessonId);
      const vocab = await lessonService.getVocabulary(lessonId);

      // Check if lesson has reading
      const lessonData = await lessonService.loadLesson(lessonId);
      setHasReading(!!lessonData.reading);

      // Load progress
      const progress = storageService.getLessonProgress(lessonId);

      setLessonInfo(info);
      setVocabulary(vocab);
      setLearnedWords(progress.learnedWords || []);
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
      setError('Failed to load vocabulary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkLearned = (wordId) => {
    storageService.addLearnedWord(lessonId, wordId);
    setLearnedWords(prev => {
      if (prev.includes(wordId)) return prev;
      return [...prev, wordId];
    });
  };

  const handleMarkUnlearned = (wordId) => {
    const progress = storageService.getLessonProgress(lessonId);
    progress.learnedWords = progress.learnedWords.filter(id => id !== wordId);
    storageService.saveLessonProgress(lessonId, progress);
    setLearnedWords(prev => prev.filter(id => id !== wordId));
  };

  const goToReading = () => {
    navigate(buildRoute.reading(lessonId));
  };

  const goToGames = () => {
    navigate(buildRoute.games(lessonId));
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading vocabulary..." />;
  }

  if (error) {
    return (
      <div className="vocabulary-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!vocabulary || vocabulary.length === 0) {
    return (
      <div className="vocabulary-page">
        <div className="error-message">No vocabulary found for this lesson</div>
      </div>
    );
  }

  const progressPercentage = vocabulary.length > 0
    ? Math.round((learnedWords.length / vocabulary.length) * 100)
    : 0;

  return (
    <div className="vocabulary-page">
      <header className="vocabulary-page__header">
        <div className="vocabulary-page__nav-buttons">
          <Button variant="secondary" onClick={() => navigate('/')}>
            ← Home
          </Button>
          {hasReading && (
            <Button variant="secondary" onClick={goToReading}>
              Reading
            </Button>
          )}
        </div>

        <div className="vocabulary-page__title-section">
          {lessonInfo && (
            <div className="vocabulary-page__meta">
              <h1>Vocabulary</h1>
              <div className="vocabulary-page__unit">
                <span className="badge">{lessonInfo.unit}</span>
              </div>
            </div>
          )}
        </div>

        <Button variant="primary" onClick={goToGames}>
          Play Games to Practice →
        </Button>
      </header>

      <div className="vocabulary-page__content">
        <VocabularyList
          vocabulary={vocabulary}
          learnedWords={learnedWords}
          onMarkLearned={handleMarkLearned}
          onMarkUnlearned={handleMarkUnlearned}
        />
      </div>

    </div>
  );
}
