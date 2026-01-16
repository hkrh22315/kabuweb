import { useState, useEffect } from 'react';
import { apiPost, apiGet, apiDelete } from '../utils/api';

function SettingsForm({ isOpen, onClose, username }) {
  const [discordId, setDiscordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // 現在のDiscord IDを取得
  useEffect(() => {
    if (isOpen) {
      setFetching(true);
      setMessage('');
      apiGet('/auth/discord-id')
        .then(data => {
          setDiscordId(data.discordId || '');
        })
        .catch(err => {
          console.error('Failed to fetch Discord ID:', err);
          setDiscordId('');
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      await apiPost('/auth/discord-id', { discordId: discordId.trim() });
      setMessage('Discord IDを登録しました！');
      setMessageType('success');
      
      // 3秒後にメッセージを消す
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (err) {
      setMessage(err.message || 'Discord IDの登録に失敗しました');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      await apiDelete('/auth/discord-id');
      setMessage('Discord IDを削除しました！');
      setMessageType('success');
      setDiscordId('');
      
      // 3秒後にメッセージを消す
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (err) {
      setMessage(err.message || 'Discord IDの削除に失敗しました');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="card p-6 md:p-8 w-full max-w-md mx-4 animate-fade-in backdrop-blur-3xl" 
        style={{ 
          borderColor: 'rgba(59, 130, 246, 0.25)',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(33, 38, 45, 0.65) 50%, rgba(33, 38, 45, 0.6) 100%)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent tracking-tight text-glass-strong">
            ユーザー設定
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none transition-all duration-300 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-700/70 hover:shadow-md"
          >
            ×
          </button>
        </div>

        <div className="mb-6 text-sm text-slate-400/80 text-glass">
          ユーザー名: <strong className="text-emerald-400 font-semibold">{username}</strong>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2.5 text-sm font-semibold text-slate-300/90 tracking-wide text-glass">
              Discord ID
              {discordId && (
                <span className="ml-2 text-emerald-400 text-xs font-medium">
                  ✓ 登録済み
                </span>
              )}
              {!discordId && !fetching && (
                <span className="ml-2 text-slate-500/70 text-xs">
                  (未登録)
                </span>
              )}
            </label>
            <input
              type="text"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder={fetching ? "読み込み中..." : "DiscordユーザーIDを入力 (例: 896281261788778546)"}
              disabled={fetching}
              className={`input w-full ${fetching ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            <div className="text-xs text-slate-500/70 mt-2 leading-relaxed text-glass">
              Discordで通知を受け取るために、ユーザーIDを登録してください。
              <br />
              （ユーザーIDはDiscordの設定から確認できます）
            </div>
          </div>

          {message && (
            <div className={`
              px-4 py-3 rounded-lg text-sm animate-fade-in shadow-lg text-glass
              ${messageType === 'success' 
                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 shadow-emerald-500/10' 
                : 'bg-red-950/60 border border-red-500/50 text-red-300 shadow-red-500/10'
              }
            `}>
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || fetching}
                className={`
                  btn btn-secondary flex-1 py-3 font-semibold
                  ${(loading || fetching) ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登録中...
                  </span>
                ) : 'Discord IDを登録・更新'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost px-6 py-3"
              >
                閉じる
              </button>
            </div>
            {discordId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || fetching}
                className={`
                  btn btn-danger w-full py-3 text-sm
                  ${(loading || fetching) ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    削除中...
                  </span>
                ) : 'Discord IDを削除'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsForm;
