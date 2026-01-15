import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiPost } from '../utils/api';

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
      const data = await apiPost('/auth/login', { username, password });

      // トークンを取得して保存
      if (data.token) {
        login(data.token, username);
      } else {
        setError('トークンの取得に失敗しました');
        setLoading(false);
      }
    } catch (err) {
      let errorMessage = 'ネットワークエラーが発生しました';
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 新規登録APIを呼び出し
      await apiPost('/auth/register', { username, password });

      // 登録成功後、自動的にログイン
      const loginData = await apiPost('/auth/login', { username, password });

      // トークンを取得して保存
      if (loginData.token) {
        login(loginData.token, username);
      } else {
        setError('登録は成功しましたが、トークンの取得に失敗しました。再度ログインしてください。');
        setLoading(false);
        setActiveTab('login');
      }
    } catch (err) {
      let errorMessage = 'ネットワークエラーが発生しました';
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 aurora-bg" style={{ backgroundColor: '#0d1117' }}>
      <div className="card card-hover p-8 md:p-10 w-full max-w-md animate-fade-in border-emerald-500/20 shadow-[0_12px_48px_rgba(0,0,0,0.5)]" style={{ borderColor: 'rgba(16, 185, 129, 0.25)' }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent mb-3 tracking-tight text-glass-strong">
            Kabuweb
          </h2>
          <p className="text-slate-400/80 text-sm tracking-wide">株式管理システム</p>
        </div>
        
        {/* タブUI */}
        <div 
          className="flex mb-6 border-b backdrop-blur-md rounded-t-lg"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(33, 38, 45, 0.5) 0%, rgba(33, 38, 45, 0.4) 100%)',
            boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
              setUsername('');
              setPassword('');
            }}
            className={`
              flex-1 py-3.5 px-4 text-center font-semibold transition-all duration-300 relative
              ${activeTab === 'login'
                ? 'text-emerald-400 border-b-2 border-emerald-500 shadow-[0_2px_0_0_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-300 border-b-2 border-transparent'
              }
            `}
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
            className={`
              flex-1 py-3.5 px-4 text-center font-semibold transition-all duration-300 relative
              ${activeTab === 'register'
                ? 'text-emerald-400 border-b-2 border-emerald-500 shadow-[0_2px_0_0_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-300 border-b-2 border-transparent'
              }
            `}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-5">
          <div>
            <label className="block mb-2.5 text-sm font-semibold text-slate-300/90 tracking-wide text-glass">
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input w-full"
              placeholder="ユーザー名を入力"
            />
          </div>
          <div>
            <label className="block mb-2.5 text-sm font-semibold text-slate-300/90 tracking-wide">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input w-full"
              placeholder="パスワードを入力"
            />
          </div>
          {error && (
            <div className="bg-red-950/60 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm animate-fade-in shadow-lg shadow-red-500/10">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`
              btn btn-primary w-full py-3.5 text-base font-semibold
              ${loading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {loading 
              ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {activeTab === 'login' ? 'ログイン中...' : '登録中...'}
                </span>
              )
              : (activeTab === 'login' ? 'ログイン' : '新規登録')
            }
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
