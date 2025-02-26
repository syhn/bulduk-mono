import './App.css';
import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import Header from './components/Header/Header';
import HomePage from './components/HomePage/HomePage';

// Lazy loading için bileşenleri import edelim
const TrueFalseGame = lazy(() => import('./components/TrueFalseGame/TrueFalseGame'));
const TrueFalseGamePlay = lazy(() => import('./components/TrueFalseGame/TrueFalseGamePlay'));
const TrueFalseGameResult = lazy(() => import('./components/TrueFalseGame/TrueFalseGameResult/TrueFalseGameResult'));
const FindCorrectGame = lazy(() => import('./components/FindCorrectGame/FindCorrectGame'));

function App() {
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
    return <LoadingScreen />;
  }

  return (
    <div className={`App ${theme}`}>
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Suspense fallback={<LoadingScreen />}>
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
}

export default App; 
