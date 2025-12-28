# English Learning App

Interactive English learning web application with reading comprehension and vocabulary practice.

## Features

- **📖 Reading Comprehension**: Click any word to see its meaning instantly
- **📚 Vocabulary Learning**: Browse and learn vocabulary with audio pronunciation
- **💾 Progress Tracking**: Track learned words and completed exercises
- **🔊 Audio Pronunciation**: Text-to-speech for all vocabulary words
- **🎯 Hybrid Dictionary**: Instant lookups using lesson vocabulary, cache, and external APIs

## Tech Stack

- React 18
- React Router
- Vite
- Vanilla CSS (no framework dependency)
- Web Speech API for audio
- localStorage for progress tracking

## Project Structure

```
english-learning/
├── src/
│   ├── pages/              # Page components
│   │   ├── HomePage.jsx
│   │   ├── ReadingPage.jsx
│   │   └── VocabularyPage.jsx
│   ├── components/         # Reusable components
│   │   ├── common/         # Button, Card, Modal, Loading
│   │   ├── reading/        # ReadingParagraph, WordPopup
│   │   └── vocabulary/     # VocabularyItem, VocabularyList
│   ├── services/           # Business logic layer
│   │   ├── lessonService.js      # Load lessons from JSON
│   │   ├── dictionaryService.js  # Hybrid word lookup
│   │   ├── storageService.js     # localStorage wrapper
│   │   └── audioService.js       # Text-to-speech
│   ├── constants/          # Configuration
│   │   ├── config.js       # API URLs, cache duration
│   │   └── routes.js       # Route definitions
│   └── styles/
│       └── main.css        # Global styles
├── public/
│   └── lessons/
│       └── json/           # Lesson JSON files (edit here!)
│           ├── manifest.json   # List of all lessons
│           └── *.json          # Lesson data files
├── lessons/
│   ├── reading/            # Original .docx files
│   └── plan/               # Documentation
└── index.html
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:3000

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

1. Create a new JSON file in `public/lessons/json/` following the schema:
```json
{
  "metadata": {
    "unit": "Unit X",
    "title": "Lesson Title",
    "level": "B1/B2/C1",
    "topic": "Topic Name"
  },
  "vocabulary": [...],
  "reading": {...},
  "fillInTheBlanks": {...}
}
```

2. Add the lesson to `public/lessons/json/manifest.json`:
```json
{
  "lessons": [
    {
      "id": "unique-lesson-id",
      "fileName": "your-lesson.json"
    }
  ]
}
```

The app will automatically load the lesson from its metadata.

**Note**: JSON files must be in `public/lessons/json/` for Vite to serve them correctly.

## Architecture

### 3-Layer Architecture

1. **UI Layer** (Pages + Components)
   - Only handles rendering and user interactions
   - Receives data via props
   - Calls services for business logic

2. **Logic Layer** (Services)
   - All business logic lives here
   - No UI code
   - Reusable across components

3. **Data Layer** (JSON + localStorage)
   - Pure data storage
   - No user state in JSON files
   - localStorage for progress tracking

### Hybrid Dictionary Lookup

The app uses a hybrid approach for word lookups:

1. Check lesson vocabulary JSON (instant)
2. Check localStorage cache (instant)
3. Call Free Dictionary API (~500ms)
4. Fallback to Google Translate (~300ms)

Results are cached for 24 hours to minimize API calls.

