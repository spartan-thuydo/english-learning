import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Loading from '../components/common/Loading.jsx';
import FillInTheBlanksExercise from '../components/exercise/FillInTheBlanksExercise.jsx';
import lessonService from '../services/lessonService.js';
import { buildRoute } from '../constants/routes.js';

/**
 * ExercisePage - Display exercises for a lesson
 */
export default function ExercisePage() {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();

  const [lessonInfo, setLessonInfo] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExercise();
  }, [lessonId]);

  const loadExercise = async () => {
    try {
      setIsLoading(true);

      // Load lesson info and exercise data
      const info = lessonService.getLessonInfo(lessonId);
      const lessonData = await lessonService.loadLesson(lessonId);

      if (!lessonData.fillInTheBlanks) {
        setError('No exercises available for this lesson');
        return;
      }

      setLessonInfo(info);
      setExerciseData(lessonData.fillInTheBlanks);
    } catch (err) {
      console.error('Failed to load exercise:', err);
      setError('Failed to load exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading exercise..." />;
  }

  if (error) {
    return (
      <div className="exercise-page">
        <div className="error-message">{error}</div>
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Home
        </Button>
      </div>
    );
  }

  return (
    <div className="exercise-page">
      <header className="exercise-page__header">
        <div className="exercise-page__nav-buttons">
          <Button variant="secondary" onClick={() => navigate('/')}>
            ← Home
          </Button>
        </div>

        <div className="exercise-page__title-section">
          {lessonInfo && (
            <div className="exercise-page__meta">
              <h1>Exercise</h1>
              <span className="badge">{lessonInfo.unit}</span>
            </div>
          )}
        </div>
      </header>

      <div className="exercise-page__content">
        {exerciseData && (
          <FillInTheBlanksExercise
            exerciseData={exerciseData}
            lessonId={lessonId}
          />
        )}
      </div>
    </div>
  );
}
