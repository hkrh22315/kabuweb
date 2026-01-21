// APIリクエストヘルパー関数
// 環境変数からBASE_URLを読み込む（本番環境用）
// VITE_プレフィックスが必要（Viteの仕様）
// BASE_URLが空の場合、相対URLを使用（同じサーバーから配信される場合）
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('jwt_token');
  
  // URLが完全なURLでない場合、BASE_URLを追加
  // BASE_URLが空の場合は相対URLを使用
  const fullUrl = url.startsWith('http') 
    ? url 
    : BASE_URL 
      ? `${BASE_URL}${url}`
      : url;
  
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
    
    // 401または403エラーの場合、認証エラーとして扱う
    if (response.status === 401 || response.status === 403) {
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
  
  // レスポンスが空の場合や、JSONでない場合は成功として扱う
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      // JSONパースエラーでも、HTTPステータスが200系なら成功として扱う
      if (response.ok) {
        return { success: true };
      }
      throw e;
    }
  } else {
    // JSONでない場合は、テキストとして読み取るか、成功として扱う
    try {
      const text = await response.text();
      return { success: true, message: text };
    } catch (e) {
      // テキストも読めない場合でも、HTTPステータスが200系なら成功として扱う
      if (response.ok) {
        return { success: true };
      }
      throw e;
    }
  }
};
