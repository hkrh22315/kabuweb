// APIリクエストヘルパー関数
const BASE_URL = 'http://localhost:8080';

export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('jwt_token');
  
  // URLが完全なURLでない場合、BASE_URLを追加
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // トークンがある場合、Authorizationヘッダーを追加
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(fullUrl, config);
    
    // 401エラーの場合、認証エラーとして扱う
    if (response.status === 401) {
      localStorage.removeItem('jwt_token');
      // リロードしてログイン画面に戻る
      window.location.reload();
      throw new Error('認証に失敗しました。再度ログインしてください。');
    }

    if (!response.ok) {
      // エラーレスポンスのメッセージを取得
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData || errorMessage;
      } catch (e) {
        // JSONでない場合はテキストとして読み取る
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          // テキストも読めない場合はデフォルトメッセージ
        }
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// JSONを取得するヘルパー
export const apiGet = async (url) => {
  const response = await apiRequest(url, { method: 'GET' });
  return response.json();
};

// JSONを送信するヘルパー
export const apiPost = async (url, data) => {
  try {
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    // エラーレスポンスの場合、メッセージを抽出して再スロー
    if (error.message && error.message.includes('HTTP error')) {
      // apiRequest内で既にエラーが処理されているが、より詳細なエラーメッセージを提供
      throw error;
    }
    throw error;
  }
};

// DELETEリクエストのヘルパー
export const apiDelete = async (url) => {
  const response = await apiRequest(url, { method: 'DELETE' });
  return response.json();
};
