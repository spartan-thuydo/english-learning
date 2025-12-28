import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameLayout from './GameLayout.jsx';
import Button from '../common/Button.jsx';
import WordListsModal from './WordListsModal.jsx';
import { buildRoute } from '../../constants/routes.js';
import { GAME_CONFIG, GAME_TYPES } from '../../constants/games.js';
import { shuffleArray } from '../../utils/gameUtils.js';
import storageService from '../../services/storageService.js';

/**
 * FlashCardGame - Simple flashcard review with auto-advance
 * Click anywhere to flip, swipe to mark
 */
export default function FlashCardGame({ lessonId, vocabulary }) {
  const navigate = useNavigate();
  const gameConfig = GAME_CONFIG[GAME_TYPES.FLASHCARD];

  const [allCards] = useState(() => shuffleArray(vocabulary));
  const [knownCards, setKnownCards] = useState(() => {
    // Load saved progress
    const saved = storageService.getFlashcardProgress(lessonId);
    return new Set(saved.knownWords);
  });
  const [reviewCards, setReviewCards] = useState(() => {
    // Load saved progress
    const saved = storageService.getFlashcardProgress(lessonId);
    return new Set(saved.reviewWords);
  });

  // Filter to show only unlearned cards
  const [currentCards, setCurrentCards] = useState(() => {
    const saved = storageService.getFlashcardProgress(lessonId);
    const learned = new Set([...saved.knownWords, ...saved.reviewWords]);
    const unlearned = vocabulary.filter(card => !learned.has(card.word));
    return shuffleArray(unlearned);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showWordListsModal, setShowWordListsModal] = useState(false);

  // Swipe gesture handling
  const cardRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const reviewBtnRef = useRef(null);
  const knowBtnRef = useRef(null);

  const currentCard = currentCards[currentIndex];
  const progress = ((currentIndex + 1) / currentCards.length) * 100;

  // Trigger temporary button highlight animation
  const triggerButtonHighlight = (buttonRef) => {
    if (!buttonRef.current) return;

    // Remove class first to restart animation
    buttonRef.current.classList.remove('button--highlight-pulse');

    // Force reflow to restart animation
    void buttonRef.current.offsetWidth;

    // Add class to trigger animation
    buttonRef.current.classList.add('button--highlight-pulse');

    // Remove class after animation completes
    setTimeout(() => {
      if (buttonRef.current) {
        buttonRef.current.classList.remove('button--highlight-pulse');
      }
    }, 400);
  };

  // Update button highlight based on swipe direction
  const updateButtonHighlight = (diffX) => {
    const threshold = 30;
    if (diffX > threshold) {
      // Swiping right - highlight Know button
      triggerButtonHighlight(knowBtnRef);
    } else if (diffX < -threshold) {
      // Swiping left - highlight Review button
      triggerButtonHighlight(reviewBtnRef);
    }
  };

  // Reset card position when changing cards
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.style.opacity = '1';
    }
    setIsFlipped(false);
    hasMoved.current = false;
  }, [currentIndex]);

  // Save flashcard progress whenever known/review cards change
  useEffect(() => {
    const knownArray = Array.from(knownCards);
    const reviewArray = Array.from(reviewCards);
    storageService.saveFlashcardProgress(lessonId, knownArray, reviewArray);
  }, [knownCards, reviewCards, lessonId]);

  const handleCardClick = () => {
    // Only flip if not dragging
    if (!hasMoved.current) {
      setIsFlipped(!isFlipped);
    }
  };

  // Touch events
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = startX.current;
    currentY.current = startY.current;
    isDragging.current = true;
    hasMoved.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;

    currentX.current = e.touches[0].clientX;
    currentY.current = e.touches[0].clientY;

    const diffX = currentX.current - startX.current;
    const diffY = currentY.current - startY.current;

    // Check if moved more than 5px (threshold for drag vs tap)
    if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
      hasMoved.current = true;
    }

    // Only apply horizontal swipe transform
    if (Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault(); // Prevent scroll when swiping horizontally

      if (cardRef.current) {
        // Only apply translateX and tilt rotation, NOT rotateY (flip is handled by CSS class)
        cardRef.current.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.05}deg)`;
        cardRef.current.style.opacity = 1 - Math.abs(diffX) / 400;
      }

      // Highlight button based on swipe direction
      updateButtonHighlight(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;

    const diffX = currentX.current - startX.current;
    const threshold = 100;

    // Check if it's a swipe (moved more than threshold)
    if (Math.abs(diffX) > threshold && hasMoved.current) {
      if (diffX > 0) {
        // Swipe right - Know it
        animateSwipe('right', () => handleKnow());
      } else {
        // Swipe left - Need review
        animateSwipe('left', () => handleReview());
      }
    } else {
      // Reset position if swipe was not completed
      if (cardRef.current) {
        // Clear inline transform (flip is handled by CSS class on .flashcard__inner)
        cardRef.current.style.transform = '';
        cardRef.current.style.opacity = '1';
      }

      // If it's a tap (no movement), it will trigger click event for flip
    }

    isDragging.current = false;
  };

  // Mouse events
  const handleMouseDown = (e) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentX.current = startX.current;
    currentY.current = startY.current;
    isDragging.current = true;
    hasMoved.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;

    currentX.current = e.clientX;
    currentY.current = e.clientY;

    const diffX = currentX.current - startX.current;
    const diffY = currentY.current - startY.current;

    // Check if moved more than 5px
    if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
      hasMoved.current = true;
    }

    // Only horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (cardRef.current) {
        // Only apply translateX and tilt rotation, NOT rotateY (flip is handled by CSS class)
        cardRef.current.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.05}deg)`;
        cardRef.current.style.opacity = 1 - Math.abs(diffX) / 400;
      }

      // Highlight button based on swipe direction
      updateButtonHighlight(diffX);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;

    const diffX = currentX.current - startX.current;
    const threshold = 100;

    // Check if it's a swipe
    if (Math.abs(diffX) > threshold && hasMoved.current) {
      if (diffX > 0) {
        animateSwipe('right', () => handleKnow());
      } else {
        animateSwipe('left', () => handleReview());
      }
    } else {
      // Reset position
      if (cardRef.current) {
        // Clear inline transform (flip is handled by CSS class on .flashcard__inner)
        cardRef.current.style.transform = '';
        cardRef.current.style.opacity = '1';
      }

      // If it's a click (no movement), it will trigger click event for flip
    }

    isDragging.current = false;
  };

  const animateSwipe = (direction, callback) => {
    setSwipeDirection(direction);
    if (cardRef.current) {
      const distance = direction === 'right' ? 1000 : -1000;
      // Only apply translateX and tilt rotation for swipe animation
      cardRef.current.style.transform = `translateX(${distance}px) rotate(${distance * 0.03}deg)`;
      cardRef.current.style.opacity = '0';
    }
    setTimeout(() => {
      callback();
      setSwipeDirection(null);
    }, 300);
  };

  const moveToNext = () => {
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleKnow = () => {
    // Trigger button highlight animation
    triggerButtonHighlight(knowBtnRef);

    const cardId = currentCard.word;
    setKnownCards(prev => {
      const newSet = new Set(prev);
      newSet.add(cardId);
      return newSet;
    });
    setReviewCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
    moveToNext();
  };

  const handleReview = () => {
    // Trigger button highlight animation
    triggerButtonHighlight(reviewBtnRef);

    const cardId = currentCard.word;
    setReviewCards(prev => {
      const newSet = new Set(prev);
      newSet.add(cardId);
      return newSet;
    });
    setKnownCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
    moveToNext();
  };

  const handleResetToReview = () => {
    const reviewList = allCards.filter(card => reviewCards.has(card.word));

    if (reviewList.length > 0) {
      setCurrentCards(shuffleArray(reviewList));
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsComplete(false);
    } else {
      alert('No cards to review! All cards are marked as known.');
    }
  };

  const handleResetAll = () => {
    // Reset to show only unlearned cards
    const learned = new Set([...Array.from(knownCards), ...Array.from(reviewCards)]);
    const unlearned = allCards.filter(card => !learned.has(card.word));

    if (unlearned.length === 0) {
      // If no unlearned cards, show complete screen
      setIsComplete(true);
    } else {
      setCurrentCards(shuffleArray(unlearned));
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsComplete(false);
    }
    setShowWordListsModal(false);
  };

  const handleResetAllProgress = () => {
    if (!confirm('Are you sure you want to reset all progress? This will clear all Known and Review cards.')) {
      return;
    }

    // Clear all progress and start fresh
    setKnownCards(new Set());
    setReviewCards(new Set());
    setCurrentCards(shuffleArray(allCards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
    setShowWordListsModal(false);
  };

  const handleBackToGames = () => {
    navigate(buildRoute.games(lessonId));
  };

  const handleShowWordLists = () => {
    setShowWordListsModal(true);
  };

  const handleCloseWordLists = () => {
    setShowWordListsModal(false);
  };

  // Get word lists for modal
  const getWordLists = () => {
    const known = allCards.filter(card => knownCards.has(card.word));
    const review = allCards.filter(card => reviewCards.has(card.word));
    const notMarked = allCards.filter(
      card => !knownCards.has(card.word) && !reviewCards.has(card.word)
    );

    return { known, review, notMarked };
  };

  // Check if no cards available to show
  if (isComplete || currentCards.length === 0) {
    const totalWords = allCards.length;
    const notMarkedCount = allCards.filter(card =>
      !knownCards.has(card.word) && !reviewCards.has(card.word)
    ).length;
    const totalLearned = knownCards.size + reviewCards.size;
    const completionPercentage = Math.round((totalLearned / totalWords) * 100);

    return (
      <GameLayout
        lessonId={lessonId}
        gameTitle={gameConfig.name}
        gameIcon={gameConfig.icon}
        showBackButton={false}
      >
        <div className="flashcard-game">
          <div className="flashcard-game__complete">
            <div className="flashcard-game__complete-icon">🎉</div>
            <h2>All Unlearned Cards Reviewed!</h2>
            <p className="flashcard-game__completion-text">
              Progress: {totalLearned}/{totalWords} words ({completionPercentage}%)
            </p>
            <div className="flashcard-game__stats">
              <div className="stat stat--success">
                <span className="stat__value">{knownCards.size}</span>
                <span className="stat__label">Known</span>
              </div>
              <div className="stat stat--warning">
                <span className="stat__value">{reviewCards.size}</span>
                <span className="stat__label">Need Review</span>
              </div>
              <div className="stat stat--neutral">
                <span className="stat__value">{notMarkedCount}</span>
                <span className="stat__label">Not Marked</span>
              </div>
            </div>

            <div className="flashcard-game__reset-actions">
              <Button
                variant="primary"
                onClick={handleResetToReview}
                disabled={reviewCards.size === 0}
              >
                Practice Review Cards ({reviewCards.size})
              </Button>
              <Button
                variant="secondary"
                onClick={handleResetAllProgress}
              >
                🔄 Reset All Progress
              </Button>
              <Button
                variant="secondary"
                onClick={handleBackToGames}
              >
                Back to Games
              </Button>
            </div>
          </div>
        </div>
      </GameLayout>
    );
  }

  const { known, review, notMarked } = getWordLists();

  return (
    <>
      <GameLayout
        lessonId={lessonId}
        gameTitle={gameConfig.name}
        gameIcon={gameConfig.icon}
        progress={progress}
        currentQuestion={currentIndex + 1}
        totalQuestions={currentCards.length}
      >
        <div className="flashcard-game flashcard-game--compact">
        {/* Hint Section - Compact */}
        <div className="flashcard-game__hint-section">
          <span className="flashcard-game__hint">
            👆 Tap to flip &nbsp;•&nbsp; 👈👉 Swipe to rate
          </span>
        </div>

        {/* Card Section - Main Focus */}
        <div className="flashcard-game__card-section">
          <div
            ref={cardRef}
            className={`flashcard flashcard--compact ${isFlipped ? 'flashcard--flipped' : ''} ${swipeDirection ? `flashcard--swipe-${swipeDirection}` : ''}`}
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="flashcard__inner">
              <div className="flashcard__front">
                <div className="flashcard__label">Word</div>
                <div className="flashcard__content">{currentCard.word}</div>
                {currentCard.pronunciation && (
                  <div className="flashcard__pronunciation">
                    /{currentCard.pronunciation}/
                  </div>
                )}
              </div>
              <div className="flashcard__back">
                <div className="flashcard__label">Definition</div>
                <div className="flashcard__content">{currentCard.meaning}</div>
                {currentCard.example && (
                  <div className="flashcard__example">
                    <strong>Example:</strong>
                    <p>{currentCard.example}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section - Primary Buttons */}
        <div className="flashcard-game__actions-section">
          <Button
            ref={reviewBtnRef}
            variant="secondary"
            onClick={handleReview}
            className="flashcard-action-btn flashcard-action-btn--review"
          >
            <span className="flashcard-action-btn__icon">👈</span>
            <span className="flashcard-action-btn__text">Review</span>
          </Button>
          <Button
            ref={knowBtnRef}
            variant="primary"
            onClick={handleKnow}
            className="flashcard-action-btn flashcard-action-btn--know"
          >
            <span className="flashcard-action-btn__text">Know It</span>
            <span className="flashcard-action-btn__icon">👉</span>
          </Button>
        </div>

        {/* Stats & Controls Section - Combined */}
        <div className="flashcard-game__bottom-bar">
          <button
            className="flashcard-control-btn flashcard-control-btn--cta"
            onClick={handleResetAll}
            title="Reset to unlearned cards"
          >
            🔄
          </button>

          <div className="flashcard-stat">
            <span className="flashcard-stat__icon">✓</span>
            <span className="flashcard-stat__value">{knownCards.size}</span>
          </div>
          <div className="flashcard-stat flashcard-stat--review">
            <span className="flashcard-stat__icon">↻</span>
            <span className="flashcard-stat__value">{reviewCards.size}</span>
          </div>
          <div className="flashcard-stat flashcard-stat--remaining">
            <span className="flashcard-stat__icon">◯</span>
            <span className="flashcard-stat__value">
              {allCards.filter(card => !knownCards.has(card.word) && !reviewCards.has(card.word)).length}
            </span>
          </div>

          <button
            className="flashcard-control-btn flashcard-control-btn--cta"
            onClick={handleShowWordLists}
            title="View word lists"
          >
            📋
          </button>
        </div>
      </div>
    </GameLayout>

    <WordListsModal
      isOpen={showWordListsModal}
      onClose={handleCloseWordLists}
      knownWords={known}
      reviewWords={review}
      notMarkedWords={notMarked}
    />
  </>
  );
}
