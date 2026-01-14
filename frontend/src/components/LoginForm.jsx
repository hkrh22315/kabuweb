import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LoginForm() {
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errorMessage = 'ログインに失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData || errorMessage;
        } catch (e) {
          // JSONでない場合はテキストとして読み取る
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();

      // トークンを取得して保存
      if (data.token) {
        login(data.token, username);
      } else {
        setError('トークンの取得に失敗しました');
        setLoading(false);
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 新規登録APIを呼び出し
      const registerResponse = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!registerResponse.ok) {
        let errorMessage = '登録に失敗しました';
        try {
          const errorData = await registerResponse.json();
          errorMessage = errorData.message || errorData || errorMessage;
        } catch (e) {
          const errorText = await registerResponse.text();
          errorMessage = errorText || errorMessage;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // 登録成功後、自動的にログイン
      const loginResponse = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!loginResponse.ok) {
        setError('登録は成功しましたが、ログインに失敗しました。再度ログインしてください。');
        setLoading(false);
        setActiveTab('login');
        return;
      }

      const loginData = await loginResponse.json();

      // トークンを取得して保存
      if (loginData.token) {
        login(loginData.token, username);
      } else {
        setError('登録は成功しましたが、トークンの取得に失敗しました。再度ログインしてください。');
        setLoading(false);
        setActiveTab('login');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'black',
      color: 'white'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '40px',
        borderRadius: '8px',
        border: '2px solid #4CAF50',
        minWidth: '300px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#4CAF50' }}>
          📈 Kabuweb
        </h2>
        
        {/* タブUI */}
        <div style={{
          display: 'flex',
          marginBottom: '20px',
          borderBottom: '1px solid #555'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
              setUsername('');
              setPassword('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid #4CAF50' : '2px solid transparent',
              color: activeTab === 'login' ? '#4CAF50' : '#888',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: activeTab === 'login' ? 'bold' : 'normal'
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError('');
              setUsername('');
              setPassword('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid #4CAF50' : '2px solid transparent',
              color: activeTab === 'register' ? '#4CAF50' : '#888',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: activeTab === 'register' ? 'bold' : 'normal'
            }}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em' }}>
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#2a2a2a',
                color: 'white',
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em' }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#2a2a2a',
                color: 'white',
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
            />
          </div>
          {error && (
            <div style={{
              color: '#f44336',
              fontSize: '0.9em',
              padding: '10px',
              backgroundColor: '#3a1a1a',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading 
              ? (activeTab === 'login' ? 'ログイン中...' : '登録中...')
              : (activeTab === 'login' ? 'ログイン' : '新規登録')
            }
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
