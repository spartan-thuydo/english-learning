import { useState } from 'react';
import VocabularyItem from './VocabularyItem.jsx';

/**
 * VocabularyList Component - Display list of vocabulary words with search
 */
export default function VocabularyList({
  vocabulary,
  learnedWords = [],
  onMarkLearned,
  onMarkUnlearned
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'learned', 'unlearned'

  const filteredVocabulary = vocabulary.filter(word => {
    // Search filter
    const matchesSearch = !searchTerm ||
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchTerm.toLowerCase());

    // Learned filter
    const isLearned = learnedWords.includes(word.id);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'learned' && isLearned) ||
      (filter === 'unlearned' && !isLearned);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: vocabulary.length,
    learned: learnedWords.length,
    unlearned: vocabulary.length - learnedWords.length
  };

  return (
    <>
      <div className="vocabulary-list__sticky-controls">
        <div className="vocabulary-list__controls">
          <input
            type="text"
            className="vocabulary-list__search"
            placeholder="Search words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="vocabulary-list__filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({stats.total})
            </button>
            <button
              className={`filter-btn ${filter === 'learned' ? 'active' : ''}`}
              onClick={() => setFilter('learned')}
            >
              Learned ({stats.learned})
            </button>
            <button
              className={`filter-btn ${filter === 'unlearned' ? 'active' : ''}`}
              onClick={() => setFilter('unlearned')}
            >
              Unlearned ({stats.unlearned})
            </button>
          </div>
        </div>
      </div>

      <div className="vocabulary-list__grid">
        {filteredVocabulary.length === 0 ? (
          <p className="vocabulary-list__empty">No words found</p>
        ) : (
          filteredVocabulary.map(word => (
            <VocabularyItem
              key={word.id}
              word={word}
              isLearned={learnedWords.includes(word.id)}
              onMarkLearned={onMarkLearned}
              onMarkUnlearned={onMarkUnlearned}
            />
          ))
        )}
      </div>
    </>
  );
}
