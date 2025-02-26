import { authService } from './authService';

const startSession = async () => {
  try {
    const response = await makeRequest('https://api.buld.uk/games/true-false/session/start/', {
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

const makeRequest = async (url, options = {}) => {
  try {
    const token = authService.getToken();
    const response = await fetch(url, {
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
        const retryResponse = await fetch(url, {
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