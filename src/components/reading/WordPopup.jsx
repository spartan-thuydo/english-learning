import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Loading from '../common/Loading.jsx';
import audioService from '../../services/audioService.js';

/**
 * WordPopup Component - Shows word definition in a modal
 */
export default function WordPopup({
  word,
  isOpen,
  onClose,
  wordData,
  isLoading
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = async () => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      await audioService.play(word);
    } catch (error) {
      console.error('Failed to play audio:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loading text="Looking up..." size="small" />;
    }

    if (!wordData) {
      return <p>No definition found</p>;
    }

    return (
      <div className="word-popup__content">
        <div className="word-popup__header">
          <h2 className="word-popup__word">{wordData.word}</h2>
          {wordData.pronunciation && (
            <span className="word-popup__pronunciation">
              {wordData.pronunciation}
            </span>
          )}
          <Button
            variant="secondary"
            size="small"
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className="word-popup__audio-btn"
          >
            {isPlaying ? '⏸' : '🔊'} Play
          </Button>
        </div>

        {wordData.partOfSpeech && (
          <p className="word-popup__pos">
            <em>{wordData.partOfSpeech}</em>
          </p>
        )}

        {wordData.meaning && (
          <div className="word-popup__section">
            <h4>Vietnamese:</h4>
            <p>{wordData.meaning}</p>
          </div>
        )}

        {wordData.definition && (
          <div className="word-popup__section">
            <h4>Definition:</h4>
            <p>{wordData.definition}</p>
          </div>
        )}

        {wordData.examples && wordData.examples.length > 0 && (
          <div className="word-popup__section">
            <h4>Examples:</h4>
            <ul className="word-popup__examples">
              {wordData.examples.map((example, index) => (
                <li key={index}>{example}</li>
              ))}
            </ul>
          </div>
        )}

        {wordData.synonyms && wordData.synonyms.length > 0 && (
          <div className="word-popup__section">
            <h4>Synonyms:</h4>
            <p>{wordData.synonyms.join(', ')}</p>
          </div>
        )}

        <div className="word-popup__source">
          <small>Source: {wordData.source}</small>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Word Lookup: ${word}`}
      size="medium"
      className="word-popup"
    >
      {renderContent()}
    </Modal>
  );
}
