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
    if (!window.confirm('Discord IDを削除してもよろしいですか？')) {
      return;
    }

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '30px',
        borderRadius: '8px',
        border: '2px solid #5865F2',
        minWidth: '400px',
        maxWidth: '90%',
        color: 'white'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#5865F2' }}>⚙️ ユーザー設定</h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '15px', fontSize: '0.9em', color: '#aaa' }}>
          ユーザー名: <strong>{username}</strong>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em' }}>
              Discord ID
              {discordId && (
                <span style={{ marginLeft: '10px', color: '#4CAF50', fontSize: '0.85em' }}>
                  ✓ 登録済み
                </span>
              )}
              {!discordId && !fetching && (
                <span style={{ marginLeft: '10px', color: '#888', fontSize: '0.85em' }}>
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
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#2a2a2a',
                color: 'white',
                fontSize: '1em',
                boxSizing: 'border-box',
                opacity: fetching ? 0.6 : 1
              }}
            />
            <div style={{ fontSize: '0.8em', color: '#888', marginTop: '5px' }}>
              Discordで通知を受け取るために、ユーザーIDを登録してください。
              <br />
              （ユーザーIDはDiscordの設定から確認できます）
            </div>
          </div>

          {message && (
            <div style={{
              padding: '10px',
              borderRadius: '4px',
              backgroundColor: messageType === 'success' ? '#1a3a1a' : '#3a1a1a',
              color: messageType === 'success' ? '#4CAF50' : '#f44336',
              fontSize: '0.9em'
            }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading || fetching}
                style={{
                  flex: 1,
                  backgroundColor: '#5865F2',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '1em',
                  cursor: (loading || fetching) ? 'not-allowed' : 'pointer',
                  opacity: (loading || fetching) ? 0.6 : 1
                }}
              >
                {loading ? '登録中...' : 'Discord IDを登録・更新'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: '#555',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '4px',
                  fontSize: '1em',
                  cursor: 'pointer'
                }}
              >
                閉じる
              </button>
            </div>
            {discordId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || fetching}
                style={{
                  width: '100%',
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  cursor: (loading || fetching) ? 'not-allowed' : 'pointer',
                  opacity: (loading || fetching) ? 0.6 : 1
                }}
              >
                {loading ? '削除中...' : 'Discord IDを削除'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsForm;
