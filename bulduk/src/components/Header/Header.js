import React, { useState, useEffect } from 'react';
import './Header.css';
import { useLocation } from 'react-router-dom';

function Header({ theme, toggleTheme }) {
  const [time, setTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('tr-TR', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      
      const hour = now.getHours();
      if (hour >= 5 && hour < 12) setGreeting('Günaydın');
      else if (hour >= 12 && hour < 18) setGreeting('İyi Günler');
      else setGreeting('İyi Akşamlar');
    };

    // İlk yükleme için
    updateTime();

    // Her saniye güncelle
    const interval = setInterval(updateTime, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  // Logo değişimi için useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsQuestion(prev => !prev);
    }, 4000); // Her 4 saniyede bir değiş
    
    return () => clearInterval(interval);
  }, []);

  const getHeaderText = () => {
    switch (location.pathname) {
      case '/true-false':
        return 'Doğru mu Yanlış mı? Hadi Test Edelim!';
      case '/find-correct':
        return 'Doğru Cevabı Bulma Zamanı!';
      default:
        return 'Bilgi Yarışmasına Hoş Geldiniz!';
    }
  };

  return (
    <header className={`app-header ${theme}`}>
      <div className="header-content">
        <div className="header-left">
          <a href="/" className="logo-container">
            <span className={`logo-text ${isQuestion ? 'question' : ''}`}>
              <span className="letter b">B</span>
              <span className="letter u">U</span>
              <span className="letter l">L</span>
              <span className="letter d">D</span>
              <span className="letter u2">U</span>
              <span className="letter k">K</span>
              <span className={`logo-end ${isQuestion ? 'question' : ''}`}>
                {isQuestion ? ' MU?' : '!'}
              </span>
            </span>
          </a>
        </div>
        <div className="header-right">
          <div className="time-container">
            <span className="greeting">{greeting}</span>
            <span className="time">{time}</span>
          </div>
          <label className="theme-switch">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <span className="slider round">
              <span className="sun">☀️</span>
              <span className="moon">🌙</span>
            </span>
          </label>
        </div>
      </div>
    </header>
  );
}

export default Header; 