import React from 'react';
import './FindCorrectGame.css';
import { useNavigate } from 'react-router-dom';

function FindCorrectGame({ theme }) {
  const navigate = useNavigate();

  return (
    <div className={`game-page ${theme}`}>
      <div className="game-content">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Ana Sayfa
        </button>

        <div className="game-header">
          <div className="game-logo">
            <svg className="game-icon" viewBox="0 0 200 200" width="120" height="120">
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
          </div>
          <h1>Doğruyu Bul</h1>
        </div>

        <div className="game-info">
          <h2>Nasıl Oynanır?</h2>
          <ul>
            <li>Size verilen soru için doğru cevabı seçenekler arasından bulun</li>
            <li>Her doğru cevap için puan kazanın</li>
            <li>Süreniz dolmadan mümkün olduğunca çok soru yanıtlayın</li>
          </ul>
        </div>

        <div className="game-options">
          <button className="start-button" onClick={() => navigate('/find-correct/play')}>
            Oyunu Başlat
          </button>
          <button className="rules-button">
            Kuralları Göster
          </button>
        </div>
      </div>
    </div>
  );
}

export default FindCorrectGame; 