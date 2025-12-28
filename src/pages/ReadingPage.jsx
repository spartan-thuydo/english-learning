import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Loading from '../components/common/Loading.jsx';
import ReadingParagraph from '../components/reading/ReadingParagraph.jsx';
import WordPopup from '../components/reading/WordPopup.jsx';
import lessonService from '../services/lessonService.js';
import dictionaryService from '../services/dictionaryService.js';
import storageService from '../services/storageService.js';
import { buildRoute } from '../constants/routes.js';

/**
 * ReadingPage - Display reading content with clickable words
 */
export default function ReadingPage() {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [vocabulary, setVocabulary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordData, setWordData] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setIsLoading(true);
      const lessonData = await lessonService.loadLesson(lessonId);
      const vocabData = await lessonService.getVocabulary(lessonId);
      setLesson(lessonData);
      setVocabulary(vocabData);
    } catch (err) {
      console.error('Failed to load lesson:', err);
      setError('Failed to load lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordClick = async (word) => {
    setSelectedWord(word);
    setIsLookingUp(true);

    try {
      const result = await dictionaryService.lookup(word, vocabulary);
      setWordData(result);

      // Mark word as learned if from vocabulary
      const vocabWord = vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
      if (vocabWord) {
        storageService.addLearnedWord(lessonId, vocabWord.id);
      }
    } catch (err) {
      console.error('Failed to lookup word:', err);
      setWordData(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleClosePopup = () => {
    setSelectedWord(null);
    setWordData(null);
  };

  const goToVocabulary = () => {
    navigate(buildRoute.vocabulary(lessonId));
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading lesson..." />;
  }

  if (error) {
    return (
      <div className="reading-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="reading-page">
        <div className="error-message">Lesson not found</div>
      </div>
    );
  }

  return (
    <div className="reading-page">
      <header className="reading-page__header">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Back
        </Button>

        <div className="reading-page__title-section">
          <h1>{lesson.metadata.title}</h1>
          <div className="reading-page__meta">
            <span className="badge">{lesson.metadata.unit}</span>
          </div>
        </div>

        <div className="reading-page__actions">
          <Button
            variant={showTranslation ? 'primary' : 'secondary'}
            onClick={() => setShowTranslation(!showTranslation)}
          >
            {showTranslation ? 'Hide' : 'Show'} Translation
          </Button>
          <Button variant="primary" onClick={goToVocabulary}>
            Vocabulary →
          </Button>
        </div>
      </header>

      <div className="reading-page__content">
        <h2 className="reading-page__reading-title">
          {lesson.reading.title || 'Reading'}
        </h2>

        <div className="reading-page__tip">
          💡 <em>Click any word to see its meaning</em>
        </div>

        <div className="reading-page__paragraphs">
          {lesson.reading.paragraphs.map(paragraph => (
            <ReadingParagraph
              key={paragraph.id}
              paragraph={paragraph}
              showTranslation={showTranslation}
              onWordClick={handleWordClick}
            />
          ))}
        </div>
      </div>

      <WordPopup
        word={selectedWord}
        isOpen={!!selectedWord}
        onClose={handleClosePopup}
        wordData={wordData}
        isLoading={isLookingUp}
      />
    </div>
  );
}
