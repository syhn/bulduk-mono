import React, { useState, useRef, useEffect } from 'react';
import './TrueFalseGame.css';
import { useNavigate } from 'react-router-dom';
import RulesPopup from './RulesPopup/RulesPopup';

const DIFFICULTIES = [
  { value: 'all', label: 'Karışık', color: '#22c55e', level: null },
  { value: 'easy', label: 'Kolay', color: '#22c55e', level: 0 },
  { value: 'normal', label: 'Normal', color: '#3b82f6', level: 1 },
  { value: 'hard', label: 'Zor', color: '#f59e0b', level: 2 },
  { value: 'very_hard', label: 'Çok Zor', color: '#ef4444', level: 3 }
];

const CATEGORIES = [
  { value: 'all', label: 'Tümü' },
  { value: 'bilim', label: 'Bilim' },
  { value: 'cografya', label: 'Coğrafya' },
  { value: 'doga', label: 'Doğa' },
  { value: 'edebiyat', label: 'Edebiyat' },
  { value: 'guncel_olaylar', label: 'Güncel Olaylar' },
  { value: 'muzik', label: 'Müzik' },
  { value: 'sanat', label: 'Sanat' },
  { value: 'sinema', label: 'Sinema' },
  { value: 'spor', label: 'Spor' },
  { value: 'tarih', label: 'Tarih' },
  { value: 'televizyon', label: 'Televizyon' }
];

function TrueFalseGame({ theme }) {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const menuRef = useRef(null);

  // Component mount olduğunda state'leri sıfırla
  useEffect(() => {
    setShowRules(false);
    setSelectedDifficulty('all');
    setShowDifficultyMenu(false);
    setSelectedCategory('all');
    setShowCategoryMenu(false);
  }, []);

  // Popup dışına tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowDifficultyMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartGame = () => {
    const difficulty = DIFFICULTIES.find(d => d.value === selectedDifficulty)?.level;
    const category = selectedCategory === 'all' ? null : CATEGORIES.find(c => c.value === selectedCategory)?.label;
    
    navigate('/true-false/play', { 
      state: { 
        difficulty,
        category 
      } 
    });
  };

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty.value);
    setShowDifficultyMenu(false);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.value);
    setShowCategoryMenu(false);
  };

  return (
    <div className={`game-page ${theme}`}>
      <div className="game-content">
        <div className="game-title">
          <div className="game-logo">
            <svg className="game-icon" viewBox="0 0 200 200" width="60" height="60">
              <circle cx="100" cy="100" r="85" fill="currentColor" />
              <g className="icon-content">
                <text x="100" y="80" textAnchor="middle" fill="white" fontSize="50" fontWeight="bold">✓</text>
                <text x="100" y="140" textAnchor="middle" fill="white" fontSize="50" fontWeight="bold">✗</text>
              </g>
            </svg>
          </div>
          <h1>Doğru/Yanlış</h1>
        </div>

        <div className="welcome-message">
          <h2>Hadi Başlayalım! 🎮</h2>
          <p>Bilgi dolu bir maceraya hazır mısın? Her doğru cevap seni zafere bir adım daha yaklaştıracak. Hemen başla ve ödülleri topla! 🏆</p>
        </div>

        <div className="game-options">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button className="rules-button" onClick={() => setShowRules(true)}>
              Nasıl Oynanır?
            </button>
          </div>
          <div className="options-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="option-item" ref={menuRef}>
              <button
                className="option-select"
                onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
                style={{ '--button-color': DIFFICULTIES.find(d => d.value === selectedDifficulty)?.color }}
              >
                <span className="option-label">Zorluk</span>
                <span className="option-value">{DIFFICULTIES.find(d => d.value === selectedDifficulty)?.label}</span>
              </button>

              {showDifficultyMenu && (
                <div className="difficulty-popup-overlay" onClick={() => setShowDifficultyMenu(false)}>
                  <div className="difficulty-popup" onClick={e => e.stopPropagation()}>
                    <div className="popup-header">
                      <h3>Zorluk Seviyesi</h3>
                      <button className="close-button" onClick={() => setShowDifficultyMenu(false)}>×</button>
                    </div>
                    <div className="popup-content">
                      {DIFFICULTIES.map(difficulty => (
                        <button
                          key={difficulty.value}
                          className={`popup-item ${selectedDifficulty === difficulty.value ? 'selected' : ''}`}
                          onClick={() => handleDifficultySelect(difficulty)}
                          style={{ '--button-color': difficulty.color }}
                        >
                          {difficulty.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="option-item">
              <button
                className="option-select"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              >
                <span className="option-label">Kategori</span>
                <span className="option-value">{CATEGORIES.find(c => c.value === selectedCategory)?.label}</span>
              </button>

              {showCategoryMenu && (
                <div className="difficulty-popup-overlay" onClick={() => setShowCategoryMenu(false)}>
                  <div className="difficulty-popup" onClick={e => e.stopPropagation()}>
                    <div className="popup-header">
                      <h3>Kategori Seçimi</h3>
                      <button className="close-button" onClick={() => setShowCategoryMenu(false)}>×</button>
                    </div>
                    <div className="popup-content">
                      {CATEGORIES.map(category => (
                        <button
                          key={category.value}
                          className={`popup-item ${selectedCategory === category.value ? 'selected' : ''}`}
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>

              <button className="start-button" onClick={handleStartGame}>
                Başlat
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRules && <RulesPopup onClose={() => setShowRules(false)} />}
    </div>
  );
}

export default TrueFalseGame; 