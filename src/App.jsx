import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ReadingPage from './pages/ReadingPage.jsx';
import VocabularyPage from './pages/VocabularyPage.jsx';
import GamesPage from './pages/GamesPage.jsx';
import GamePlayPage from './pages/GamePlayPage.jsx';
import ExercisePage from './pages/ExercisePage.jsx';
import { ROUTES } from './constants/routes.js';
import './styles/main.css';

/**
 * Main App Component
 */
export default function App() {
  return (
    <Router basename="/english-learning">
      <div className="app">
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.READING} element={<ReadingPage />} />
          <Route path={ROUTES.VOCABULARY} element={<VocabularyPage />} />
          <Route path={ROUTES.GAMES} element={<GamesPage />} />
          <Route path={ROUTES.GAME_PLAY} element={<GamePlayPage />} />
          <Route path={ROUTES.EXERCISE} element={<ExercisePage />} />
        </Routes>
      </div>
    </Router>
  );
}
