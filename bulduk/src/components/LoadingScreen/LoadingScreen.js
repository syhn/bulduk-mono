import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

function LoadingScreen() {
  const [letters, setLetters] = useState(['B', 'U', 'L', 'D', 'U', 'K']);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % letters.length);
    }, 300); // Her 300ms'de bir harf değişsin

    return () => clearInterval(interval);
  }, [letters.length]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-letters">
          {letters.map((letter, index) => (
            <span 
              key={index} 
              className={`loading-letter ${index === activeIndex ? 'active' : ''}`}
            >
              {letter}
            </span>
          ))}
        </div>
        <p className="loading-text">Yükleniyor...</p>
      </div>
    </div>
  );
}

export default LoadingScreen; 