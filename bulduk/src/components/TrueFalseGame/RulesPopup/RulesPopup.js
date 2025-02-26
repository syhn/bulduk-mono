import React from 'react';
import './RulesPopup.css';

function RulesPopup({ onClose }) {
  return (
    <div className="rules-popup-overlay" onClick={onClose}>
      <div className="rules-popup" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Oyun Kuralları</h2>
        <div className="rules-content">
          <div className="how-to-play">
            <h3>Nasıl Oynanır?</h3>
            <ul>
              <li>Her soruda karşınıza bir ifade gelecek</li>
              <li>İfadenin doğru veya yanlış olduğuna karar verin</li>
              <li>Emin değilseniz "Pas Geç" butonunu kullanabilirsiniz</li>
            </ul>
          </div>
          <div className="game-rules">
            <h3>Detaylı Kurallar</h3>
            <ul>
              <li>Her soru için 5 saniye süreniz var</li>
              <li>Doğru cevap: +10 puan kazanırsınız</li>
              <li>Yanlış cevap: 1 can kaybedersiniz</li>
              <li>Süre bittiğinde: 1 can kaybedersiniz</li>
              <li>Toplam 5 canınız var</li>
              <li>2 kez pas geçme hakkınız var</li>
              <li>Pas geçtiğinizde puan kaybetmezsiniz</li>
              <li>5 canınızı kaybettiğinizde oyun biter</li>
              <li>Oyun sonunda başarı oranınızı görebilirsiniz</li>
              <li>İstediğiniz zaman "Oyundan Çık" butonuyla çıkabilirsiniz</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RulesPopup; 