import { authService } from './authService';

// Production'da /api prefix'ini kullan
const API_BASE = process.env.NODE_ENV === 'development' 
  ? (process.env.REACT_APP_API_URL || 'http://localhost:8000')
  : '/api';

const startSession = async () => {
  try {
    const response = await makeRequest(`${API_BASE}/games/true-false/session/start/`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to start session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Session başlatma hatası:', error);
    throw error;
  }
};

const makeRequest = async (endpoint, options = {}) => {
  try {
    const token = authService.getToken();
    const fullUrl = `${API_BASE}${endpoint}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Token yenileme gerekiyorsa
    if (response.status === 401) {
      try {
        await authService.login();
        const newToken = authService.getToken();
        const retryResponse = await fetch(fullUrl, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });

        return retryResponse;
      } catch (error) {
        console.error('Token yenileme hatası:', error);
        throw error;
      }
    }

    return response;
  } catch (error) {
    console.error('API isteği hatası:', error);
    throw error;
  }
};

export const apiService = {
  makeRequest,
  startSession
}; 