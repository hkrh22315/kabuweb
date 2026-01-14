import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初期化時にlocalStorageからトークンとユーザー名を読み込む
  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    const savedUsername = localStorage.getItem('username');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
    if (savedUsername) {
      setUsername(savedUsername);
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUsername) => {
    localStorage.setItem('jwt_token', newToken);
    if (newUsername) {
      localStorage.setItem('username', newUsername);
      setUsername(newUsername);
    }
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setIsAuthenticated(false);
  };

  const getToken = () => {
    return token || localStorage.getItem('jwt_token');
  };

  const value = {
    isAuthenticated,
    token,
    username,
    login,
    logout,
    getToken,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
