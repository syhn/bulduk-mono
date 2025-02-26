import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

// Bileşenleri import edelim
const LoadingScreen = lazy(() => import('./components/LoadingScreen/LoadingScreen'));
const Header = lazy(() => import('./components/Header/Header'));
const HomePage = lazy(() => import('./components/HomePage/HomePage'));

// Lazy loading için oyun bileşenlerini import edelim
const TrueFalseGame = lazy(() => import('./components/TrueFalseGame/TrueFalseGame'));
const TrueFalseGamePlay = lazy(() => import('./components/TrueFalseGame/TrueFalseGamePlay'));
const TrueFalseGameResult = lazy(() => import('./components/TrueFalseGame/TrueFalseGameResult/TrueFalseGameResult'));
const FindCorrectGame = lazy(() => import('./components/FindCorrectGame/FindCorrectGame'));

const App: React.FC = () => {
  const [theme, setTheme] = useState('dark');
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde loading ekranını göster
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (isLoading) {
    return <div className="loading-screen">Yükleniyor...</div>;
  }

  return (
    <div className={`App ${theme}`}>
      <Suspense fallback={<div className="loading-screen">Yükleniyor...</div>}>
        <Header theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/true-false" element={<TrueFalseGame theme={theme} />} />
          <Route path="/true-false/play" element={<TrueFalseGamePlay theme={theme} />} />
          <Route path="/true-false/play/result" element={<TrueFalseGameResult theme={theme} />} />
          <Route path="/find-correct/*" element={<FindCorrectGame theme={theme} />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App; 