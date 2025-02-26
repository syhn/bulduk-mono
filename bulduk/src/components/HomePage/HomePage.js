import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  
  return (
    <div className="main-content">
      <div className="games-container">
        <div className="game-card" onClick={() => navigate('/true-false')}>
          <svg className="game-icon" viewBox="0 0 200 200" width="200" height="200">
            <circle cx="100" cy="100" r="85" fill="currentColor" />
            <g className="icon-content">
              <text x="100" y="80" textAnchor="middle" fill="white" fontSize="50" fontWeight="bold">✓</text>
              <text x="100" y="140" textAnchor="middle" fill="white" fontSize="50" fontWeight="bold">✗</text>
            </g>
          </svg>
          <h2>Doğru/Yanlış</h2>
          <p>Soruları doğru mu yanlış mı olduğunu tahmin et!</p>
        </div>

        <div className="game-card disabled">
          <div className="coming-soon">Yakında!</div>
          <svg className="game-icon" viewBox="0 0 200 200" width="200" height="200">
            <rect x="15" y="15" width="170" height="170" rx="25" fill="currentColor" />
            <path 
              d="M60 100 L90 130 L140 70" 
              stroke="white" 
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2>Doğruyu Bul</h2>
          <p>Seçenekler arasından doğru cevabı bul!</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage; 