import { useState } from 'react';
import Modal from '../common/Modal.jsx';

/**
 * WordListsModal - Show detailed word lists (Known, Review, Not Marked) with tabs
 */
export default function WordListsModal({
  isOpen,
  onClose,
  knownWords,
  reviewWords,
  notMarkedWords
}) {
  const [activeTab, setActiveTab] = useState('known');

  if (!isOpen) return null;

  const tabs = [
    { id: 'known', label: 'Known', icon: '✓', count: knownWords.length, words: knownWords },
    { id: 'review', label: 'Need Review', icon: '📚', count: reviewWords.length, words: reviewWords },
    { id: 'not-marked', label: 'Not Marked', icon: '○', count: notMarkedWords.length, words: notMarkedWords }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium" title="Word Lists Review">
      <div className="word-lists-modal">
        {/* Sticky Tabs */}
        <div className="word-lists-modal__tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`word-lists-modal__tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="word-lists-modal__content">
          {currentTab.words.length > 0 ? (
            <div className="word-lists-modal__list">
              {currentTab.words.map((word, index) => (
                <WordListItem key={index} word={word} type={currentTab.id} />
              ))}
            </div>
          ) : (
            <p className="word-lists-modal__empty">
              {currentTab.id === 'known' && 'No words marked as known yet.'}
              {currentTab.id === 'review' && 'No words marked for review.'}
              {currentTab.id === 'not-marked' && 'All words have been marked!'}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * WordListItem - Individual word in the list
 */
function WordListItem({ word, type }) {
  return (
    <div className={`word-list-item word-list-item--${type}`}>
      <div className="word-list-item__header">
        <span className="word-list-item__word">{word.word}</span>
        {word.pos && (
          <span className="word-list-item__pos">{word.pos}</span>
        )}
      </div>
      <div className="word-list-item__meaning">{word.meaning}</div>
      {word.pronunciation && (
        <div className="word-list-item__pronunciation">
          /{word.pronunciation}/
        </div>
      )}
    </div>
  );
}
