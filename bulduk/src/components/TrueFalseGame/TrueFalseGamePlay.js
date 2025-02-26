import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TrueFalseGamePlay.css';
import { authService } from '../../services/authService';
import { apiService } from '../../services/apiService';

function TrueFalseGamePlay({ theme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5000);
  const [isLoading, setIsLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showStartPopup, setShowStartPopup] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [answerResult, setAnswerResult] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [skipCount, setSkipCount] = useState(2);
  const MAX_WRONG_ANSWERS = 5;
  const [sessionId, setSessionId] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const initRef = useRef(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const sessionStatsRef = useRef(null);

  // Zorluk seviyesi için yardımcı fonksiyon
  const getDifficultyClass = (level) => {
    switch (level) {
      case 0:
        return 'difficulty-easy';
      case 1:
        return 'difficulty-normal';
      case 2:
        return 'difficulty-hard';
      case 3:
        return 'difficulty-very-hard';
      default:
        return '';
    }
  };

  // Önce fetchNewQuestion'ı tanımlayalım
  const fetchNewQuestion = useCallback(async (sid) => {
    try {
      setIsLoading(true);
      const response = await apiService.makeRequest(
        `/games/true-false/question/?session_id=${sid}`,
        {
          method: 'GET'
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      const newStats = data.session_stats;
      setSessionStats(newStats);

      setCurrentQuestion({
        id: data.unique_id,
        question: data.question_text,
        metadata: data.metadata,
        difficultyClass: getDifficultyClass(data.metadata.difficulty)
      });
      setQuestionVisible(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Soru çekilirken hata oluştu:', error);
      setGameOver(true);
    }
  }, []);

  // Sonra startSession'ı tanımlayalım
  const startSession = useCallback(async () => {
    try {
      const difficulty = location.state?.difficulty;
      const category = location.state?.category;
      const requestBody = {};
      if (difficulty !== undefined && difficulty !== null) {
        requestBody.difficulty = Number(difficulty);
      }
      if (category !== undefined && category !== null) {
        requestBody.category = category;
      }

      const response = await apiService.makeRequest('/games/true-false/session/start/', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        await fetchNewQuestion(data.session_id);
      }
    } catch (error) {
      console.error('Session başlatma hatası:', error);
      setGameOver(true);
    }
  }, [location.state?.difficulty, fetchNewQuestion]);

  // Cevap kontrolü fonksiyonu
  const checkAnswer = useCallback(async (answer) => {
    try {
      const response = await apiService.makeRequest('/games/true-false/check/', {
        method: 'POST',
        body: JSON.stringify({
          unique_id: currentQuestion?.id,
          answer: answer,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check answer');
      }

      const data = await response.json();
      const newStats = data.session_stats;
      setSessionStats(newStats);
      
      return data.correct;
    } catch (error) {
      console.error('Cevap kontrolünde hata:', error);
      return false;
    }
  }, [currentQuestion, sessionId]);

  // handleAnswer fonksiyonu
  const handleAnswer = useCallback(async (answer) => {
    if (answered) return;
    
    setAnswered(true);
    setUserAnswer(answer);
    
    const answerValue = answer === null ? 'not_answered' : answer === true ? 'true' : 'false';

    const isCorrect = await checkAnswer(answerValue);

    if (answer === null || !isCorrect) {
      const heartsElement = document.querySelector('.hearts');
      heartsElement?.classList.add('wrong');
      
      setAnswerResult(answer === null ? 'timeout' : 'wrong');
      
      setTimeout(() => {
        setWrongAnswers(prev => prev + 1);
        heartsElement?.classList.remove('wrong');
      }, 500);
    } else {
      setAnswerResult('correct');
      // Doğru cevap durumunda skoru hemen artır
      setScore(prevScore => prevScore + 1);
    }
    
    setShowExplanation(true);

    setTimeout(() => {
      if (!isCorrect && wrongAnswers + 1 >= MAX_WRONG_ANSWERS) {
        setGameOver(true);
      } else {
        setAnswered(false);
        setShowExplanation(false);
        setAnswerResult(null);
        setUserAnswer(null);
        setTimeLeft(5000);
        fetchNewQuestion(sessionId);
      }
    }, 3000);
  }, [answered, checkAnswer, fetchNewQuestion, wrongAnswers, sessionId]);

  // Pas geçme fonksiyonu
  const handleSkip = useCallback(async () => {
    if (answered || skipCount <= 0) return;
    
    setSkipCount(prev => prev - 1);
    setAnswered(true);
    setAnswerResult('skipped');
    
    // Pas geçme durumunu API'ye bildir
    await checkAnswer('skipped');
    
    setTimeout(() => {
      setAnswered(false);
      setShowExplanation(false);
      setAnswerResult(null);
      setUserAnswer(null);
      setTimeLeft(5000);
      fetchNewQuestion(sessionId);
    }, 1500);
  }, [answered, skipCount, fetchNewQuestion, checkAnswer, sessionId]);

  // İlk soru için useEffect
  useEffect(() => {
    // Sadece session varsa ve showStartPopup false ise soru çek
    if (!showStartPopup && sessionId && !currentQuestion) {
      fetchNewQuestion(sessionId);
    }
  }, [showStartPopup, sessionId, currentQuestion, fetchNewQuestion]);

  // Başlangıç geri sayımı için useEffect
  useEffect(() => {
    // Sadece ilk kez geri sayım başladığında session başlat
    if (showStartPopup && countdown === 3 && !sessionId && !initRef.current) {
      initRef.current = true;
      const initGame = async () => {
        try {
          if (!authService.isAuthenticated()) {
            await authService.login();
          }
          await startSession();
        } catch (error) {
          console.error('Oyun başlatma hatası:', error);
          setGameOver(true);
        }
      };
      initGame();
    }

    if (showStartPopup && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showStartPopup && countdown === 0) {
      setTimeout(() => {
        setShowStartPopup(false);
        setTimeLeft(5000);
      }, 500);
    }
  }, [countdown, showStartPopup, sessionId, startSession]);

  // Oyun zamanlayıcısı
  useEffect(() => {
    if (!showStartPopup && timeLeft > 0 && !answered) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 10), 10);
      return () => clearTimeout(timer);
    } else if (timeLeft <= 0 && !answered) {
      handleAnswer(null);
    }
  }, [timeLeft, answered, showStartPopup, handleAnswer]);

  // Session sonlandırma fonksiyonu
  const endSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await apiService.makeRequest('/games/true-false/session/end/', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId
        })
      });
    } catch (error) {
      console.error('Session sonlandırma hatası:', error);
    }
  }, [sessionId]);

  // Oyundan çık butonu için handleQuit fonksiyonu
  const handleQuit = async () => {
    await endSession();
    navigate('/true-false');
  };

  // Oyun bittiğinde session'ı sonlandır ve sonuç sayfasına git
  useEffect(() => {
    if (gameOver && sessionStats) {
      endSession().then(() => {
        navigate('/true-false/play/result', { state: { sessionStats } });
      });
    }
  }, [gameOver, sessionStats, navigate, endSession]);


  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 100);
    return `${seconds}.${milliseconds}`;
  };

  const getTimerClass = (time) => {
    if (time < 1000) return 'timer danger';
    if (time < 3000) return 'timer warning';
    return 'timer';
  };

  const handlePlayAgain = async () => {
    setScore(0);
    setWrongAnswers(0);
    setGameOver(false);
    setAnswered(false);
    setShowExplanation(false);
    setAnswerResult(null);
    setUserAnswer(null);
    setTimeLeft(5000);
    setSkipCount(2);
    initRef.current = false;
    try {
      await startSession();
    } catch (error) {
      console.error('Yeni oyun başlatılamadı:', error);
      setGameOver(true);
    }
  };

  if (showStartPopup) {
    return (
      <div className={`game-play-container ${theme}`}>
        <div className="start-popup">
          <h2>Oyun Başlıyor!</h2>
          <p>Hazır mısınız?</p>
          <div className="countdown">{countdown}</div>
        </div>
      </div>
    );
  }

  if (isLoading && !currentQuestion) {
    return (
      <div className={`game-play-container ${theme}`}>
        <div className="loading">Sorular Yükleniyor...</div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className={`game-play-container ${theme}`}>
        <div className="game-over">
          <h2>Oyun Bitti!</h2>
          {sessionStats && (
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
          )}
          <div className="game-over-buttons">
            <button 
              className="play-again" 
              onClick={handlePlayAgain}
            >
              Tekrar Oyna
            </button>
            <button 
              className="go-home"
              onClick={() => navigate('/true-false')}
            >
              Ana Menüye Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`game-play-container ${theme}`}>
      <div className="game-header">
        <div className="stats-row">
          <div className="score">Skor: {score}</div>
          <div className={getTimerClass(timeLeft)}>{formatTime(timeLeft)}</div>
        </div>
        <div className="game-stats">
          <div className="hearts">
            {[...Array(MAX_WRONG_ANSWERS)].map((_, i) => (
              <span key={i} className={`heart ${i >= (MAX_WRONG_ANSWERS - wrongAnswers) ? 'lost' : ''}`}>
                ❤️
              </span>
            ))}
          </div>
          <div className="skips">
            {[...Array(2)].map((_, i) => (
              <span key={i} className={`skip ${i >= skipCount ? 'lost' : ''}`}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path 
                    d="M 4 6 L 10 12 L 4 18 M 12 6 L 18 12 L 12 18" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ))}
          </div>
        </div>
      </div>

      {!showStartPopup && !isLoading && currentQuestion && (
        <div className={`question-container ${questionVisible ? 'visible' : ''} ${currentQuestion.difficultyClass}`}>
          <div className="category-info">
            <span className="category-icon">🌟</span>
            <span className="category">{currentQuestion.metadata.category}</span>
            {currentQuestion.metadata.subcategory && (
              <>
                <span className="separator">•</span>
                <span className="subcategory">{currentQuestion.metadata.subcategory}</span>
              </>
            )}
            <span className="separator">•</span>
            <span className="difficulty-badge">
              {currentQuestion.metadata.difficulty === 0 && 'Kolay'}
              {currentQuestion.metadata.difficulty === 1 && 'Normal'}
              {currentQuestion.metadata.difficulty === 2 && 'Zor'}
              {currentQuestion.metadata.difficulty === 3 && 'Çok Zor'}
            </span>
          </div>

          <div className="question-text">
            {currentQuestion.question}
          </div>
          
          <div className="buttons-container">
            <button 
              className="answer-button true-button"
              onClick={() => handleAnswer(true)}
              disabled={answered}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path 
                  d="M20 6L9 17L4 12" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button 
              className="answer-button false-button"
              onClick={() => handleAnswer(false)}
              disabled={answered}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path 
                  d="M18 6L6 18M6 6L18 18" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button 
              className={`skip-button ${skipCount <= 0 ? 'disabled' : ''}`}
              onClick={handleSkip}
              disabled={answered || skipCount <= 0}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path 
                  d="M 4 6 L 10 12 L 4 18 M 12 6 L 18 12 L 12 18" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {answerResult && (
            <div className={`answer-popup ${answerResult}`}>
              {answerResult === 'correct' ? 'Doğru Cevap! 🎉' : 
               answerResult === 'timeout' ? 'Süreniz Doldu! ⏰' : 
               answerResult === 'skipped' ? 'Sonraki Soruya Geçiliyor... ⏭️' :
               'Yanlış Cevap! 😔'}
            </div>
          )}

          {showExplanation && currentQuestion?.explanation && (
            <div className="explanation">
              {currentQuestion.explanation}
            </div>
          )}
        </div>
      )}

      <button 
        className="quit-button" 
        onClick={handleQuit}
      >
        Oyundan Çık
      </button>
    </div>
  );
}

export default TrueFalseGamePlay;