import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ReadingPage from './pages/ReadingPage.jsx';
import VocabularyPage from './pages/VocabularyPage.jsx';
import { ROUTES } from './constants/routes.js';
import './styles/main.css';

/**
 * Main App Component
 */
export default function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.READING} element={<ReadingPage />} />
          <Route path={ROUTES.VOCABULARY} element={<VocabularyPage />} />
        </Routes>
      </div>
    </Router>
  );
}
