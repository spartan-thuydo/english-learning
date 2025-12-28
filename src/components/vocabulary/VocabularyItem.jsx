import { useState } from 'react';
import Button from '../common/Button.jsx';
import audioService from '../../services/audioService.js';

/**
 * VocabularyItem Component - Display a single vocabulary word
 */
export default function VocabularyItem({
  word,
  onMarkLearned,
  onMarkUnlearned,
  isLearned = false
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handlePlayAudio = async (e) => {
    e.stopPropagation(); // Prevent card toggle
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      await audioService.play(word.word);
    } catch (error) {
      console.error('Failed to play audio:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleToggleLearned = (e) => {
    e.stopPropagation();
    if (isLearned) {
      onMarkUnlearned(word.id);
    } else {
      onMarkLearned(word.id);
    }
  };

  return (
    <div
      className={`vocabulary-item ${isLearned ? 'vocabulary-item--learned' : ''}`}
      onClick={toggleDetails}
    >
      <div className="vocabulary-item__header">
        <div className="vocabulary-item__word-info">
          <h3 className="vocabulary-item__word">{word.word}</h3>
          {word.pronunciation && (
            <span className="vocabulary-item__pronunciation">
              {word.pronunciation}
            </span>
          )}
        </div>

        <div className="vocabulary-item__actions">
          <button
            className="vocabulary-item__audio-btn"
            onClick={handlePlayAudio}
            disabled={isPlaying}
            title="Phát âm"
          >
            {isPlaying ? '⏸' : '🔊'}
          </button>
          <button
            className={`vocabulary-item__learned-btn ${isLearned ? 'learned' : 'unlearned'}`}
            onClick={handleToggleLearned}
            title={isLearned ? 'Đánh dấu học lại' : 'Đánh dấu đã học'}
          >
            ✓
          </button>
          <span className="vocabulary-item__toggle">
            {showDetails ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {word.meaning && (
        <div className="vocabulary-item__meaning">
          {word.meaning}
        </div>
      )}

      {showDetails && (
        <div className="vocabulary-item__details">
          {word.definition && (
            <div className="vocabulary-item__section">
              <strong>Definition:</strong>
              <p>{word.definition}</p>
            </div>
          )}

          {word.exampleSimple && (
            <div className="vocabulary-item__section">
              <strong>Example:</strong>
              <p className="vocabulary-item__example">{word.exampleSimple}</p>
            </div>
          )}

          {word.exampleFromReading && (
            <div className="vocabulary-item__section">
              <strong>From reading:</strong>
              <p className="vocabulary-item__example">
                {word.exampleFromReading.text}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
