import { useState } from 'react';

/**
 * ReadingParagraph Component - Displays a reading paragraph with clickable words
 */
export default function ReadingParagraph({
  paragraph,
  showTranslation,
  onWordClick
}) {
  const handleTextClick = (e) => {
    // Get the clicked word
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text) {
      onWordClick(text);
      return;
    }

    // If no selection, try to get word from click position
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) return;

    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const textContent = textNode.textContent;
    const offset = range.startOffset;

    // Find word boundaries
    let start = offset;
    let end = offset;

    // Find start of word
    while (start > 0 && /\w/.test(textContent[start - 1])) {
      start--;
    }

    // Find end of word
    while (end < textContent.length && /\w/.test(textContent[end])) {
      end++;
    }

    const word = textContent.slice(start, end).trim();
    if (word) {
      onWordClick(word);
    }
  };

  return (
    <div className="reading-paragraph">
      <div className="reading-paragraph__label">
        {paragraph.label}
      </div>
      <div
        className="reading-paragraph__text"
        onClick={handleTextClick}
      >
        {paragraph.text}
      </div>
      {showTranslation && paragraph.translation && (
        <div className="reading-paragraph__translation">
          <em>{paragraph.translation}</em>
        </div>
      )}
    </div>
  );
}
