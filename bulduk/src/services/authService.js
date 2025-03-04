const getToken = () => {
  const token = localStorage.getItem('token');
  console.log('getToken çağrıldı, mevcut token:', token);
  return token;
};

const setToken = (token) => {
  console.log('setToken çağrıldı:', token);
  if (token) {
    try {
      localStorage.setItem('token', token);
      console.log('Token localStorage\'a kaydedildi, kontrol:', localStorage.getItem('token'));
    } catch (error) {
      console.error('Token kaydedilirken hata:', error);
    }
  } else {
    localStorage.removeItem('token');
  }
};

const removeToken = () => {
  localStorage.removeItem('token');
};

const isAuthenticated = () => {
  return !!getToken();
};

const API_BASE = process.env.NODE_ENV === 'development' 
  ? (process.env.REACT_APP_API_URL || 'http://localhost:8000')
  : '/api';

const login = async () => {
  try {
    console.log('Login isteği başlatılıyor...');
    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "bulduk_game_user_syhn",
        password: "B3Y#kL9$mP2@vN5xsyhn"
      })
    });

    console.log('Login response:', response.status);

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    console.log('Login data:', data);

    if (data.token) {
      setToken(data.token);
      console.log('Token kaydedildi:', getToken());
      return data.token;
    } else {
      throw new Error('Token alınamadı');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const authService = {
  login,
  getToken,
  setToken,
  removeToken,
  isAuthenticated
}; 