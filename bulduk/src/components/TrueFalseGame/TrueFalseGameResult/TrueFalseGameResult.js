import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TrueFalseGameResult.css';

function TrueFalseGameResult({ theme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionStats = location.state?.sessionStats;

  const handlePlayAgain = () => {
    navigate('/true-false/play');
  };

  if (!sessionStats) {
    navigate('/true-false');
    return null;
  }

  return (
    <div className={`game-result-container ${theme}`}>
      <div className="game-over">
        <h2>Oyun Bitti!</h2>
        <div className="session-stats">
          <div className="stats-grid">
            <div className="stats-column">
              <div className="stat-item">
                <span>Toplam Soru</span>
                <span>{sessionStats.total_questions}</span>
              </div>
              <div className="stat-item">
                <span>Doğru Cevap</span>
                <span>{sessionStats.details.correct_answers}</span>
              </div>
              <div className="stat-item">
                <span>Cevaplanmayan</span>
                <span>{sessionStats.details.not_answered}</span>
              </div>
            </div>
            <div className="stats-column">
              <div className="stat-item accuracy">
                <span>Başarı Oranı</span>
                <span>%{sessionStats.accuracy.toFixed(1)}</span>
              </div>
              <div className="stat-item">
                <span>Yanlış Cevap</span>
                <span>{sessionStats.details.wrong_answers}</span>
              </div>
              <div className="stat-item">
                <span>Pas Geçilen</span>
                <span>{sessionStats.details.skipped}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="game-over-buttons">
          <button 
            className="play-again" 
            onClick={handlePlayAgain}
          >
            Tekrar Oyna
          </button>
        </div>
      </div>
      <button 
        className="quit-button" 
        onClick={() => navigate('/true-false')}
      >
        Oyundan Çık
      </button>
    </div>
  );
}

export default TrueFalseGameResult; 