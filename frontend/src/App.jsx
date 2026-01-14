import { useState, useEffect } from 'react'
import './App.css'
import { ALL_STOCKS } from './stockData';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import SettingsForm from './components/SettingsForm';
import { apiGet, apiPost, apiDelete, apiRequest } from './utils/api';

function MainApp() {
  const { isAuthenticated, logout, username } = useAuth();
  const [trades, setTrades] = useState([])
  const USERS = [ { name: 'HR', id: '896281261788778546'}, { name: "SSD", id: '890490199522545694'}]
  const [formData, setFormData] = useState({ticker: '', name: '', price: '', amount: '', action: 'BUY', discordId: ''})
  const [alertForm, setAlertForm] = useState({ticker: '', targetPrice: '', discordId: ''})
  const [suggestedStocks, setSuggestedStocks] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // データ取得
  const fetchTrades = () => {
    apiGet('/trades')
      .then(data => {
        setTrades(data);
      })
      .catch(err => {
        console.error("エラー:", err);
        setTrades([]); // エラー時は空配列を設定
      })
  }

  // 認証状態が変わったとき、または画面が開いたときにデータを取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchTrades();
    } else {
      setTrades([]); // ログアウト時は空配列を設定
    }
  }, [isAuthenticated])

  // フォーム入力の処理
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
  }

  //候補関数
  const updateSuggestions  = (e) => {
    const value = e.target.value;

    if(value.length > 0) {
      const filtered = ALL_STOCKS.filter(stock =>
        stock.code.includes(value) || 
        stock.name.includes(value) ||
        (stock.kana && stock.kana.includes(value)) ||
      (stock.romaji && stock.romaji.toLowerCase().includes(value))
      );

      setSuggestedStocks(filtered.slice(0,20));
    } else {
      setSuggestedStocks([]);
    }
  };

  // 追加ボタン
  const handleSubmit = (e) => {
    e.preventDefault()
    apiPost('/trades/add', formData)
      .then(() => {
        fetchTrades()
        alert("登録しました")
      })
      .catch(err => alert(err))
  }

  const handleAlertChange = (e) => {
    setAlertForm({ ...alertForm, [e.target.name]: e.target.value})
  }

  const handleAlertSubmit = (e) => {
    e.preventDefault()

    const dataToSend = {
      ticker: alertForm.ticker,
      targetPrice: Number(alertForm.targetPrice),
      discordId: alertForm.discordId || null
    }

    apiPost('/trades/alert', dataToSend)
      .then(() => {
        fetchTrades()
        setAlertForm({ticker: '', targetPrice: '', discordId: ''})
        alert("add alert list")
      })
      .catch(err => alert(err))
  }

  // 削除ボタン
  const handleDelete = (id) => {
    if (window.confirm("削除しますか？")) {
      apiDelete(`/trades/delete?id=${id}`)
        .then(() => fetchTrades())
        .catch(err => console.error("削除エラー:", err))
    }
  }


  // ログアウト処理
  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      logout()
    }
  }


  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div style={{ backgroundColor: "black", color: "black", minHeight: "100vh", padding: "20px"}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: "white", marginBottom: "20px"}}>
        <h1>📈 Kabuweb </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ fontSize: "0.9em", color: "white" }}>ユーザー名: {username || "User"}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              style={{
                backgroundColor: "#5865F2",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9em"
              }}
            >
              ⚙️ 設定
            </button>
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9em"
              }}
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
      <SettingsForm 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        username={username}
      />
      {/* 入力フォーム */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px", marginTop: "20px", alignItems: "flex-start"}}>

      {/* buy sell form */}
      <div style={{ flex: 1, minWidth: "300px", border: "2px solid #4CAF50", padding: "15px", borderRadius: "8px", backgroundColor: "#f9fff9" }}>
        <h3 style={{color: "2E7D32", marginTop: 0}}>新規登録</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px"}}>
          <div>
            <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>code</label>
            <input 
            name="ticker"
            list="stock-options" 
            placeholder="銘柄コード (例: 7203.T)"
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "black",
              color: "white",
              border: "1px solid #555",
              borderRadius: "4px",
              fontSize: "1em",
              boxSizing: "border-box"
            }}
             onChange={(e) => {
              handleChange(e);
              updateSuggestions(e);
             }} 
             required />
            <datalist id="stock-options">
              {suggestedStocks.map(stock => (
                <option key={stock.code} value={stock.code}>
                  {stock.name}
                </option>
              ))}
            </datalist>
          </div>
          <div>
            <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>name</label>
            <input 
            name="name" 
            placeholder="銘柄名 (例: トヨタ)" 
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "black",
              color: "white",
              border: "1px solid #555",
              borderRadius: "4px",
              fontSize: "1em",
              boxSizing: "border-box"
            }}
            onChange={handleChange} 
            required />
          </div>
          <div>
            <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>price</label>
            <input 
            name="price" 
            type="number" 
            value={formData.price} 
            placeholder="取得単価" 
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "black",
              color: "white",
              border: "1px solid #555",
              borderRadius: "4px",
              fontSize: "1em",
              boxSizing: "border-box"
            }}
            onChange={handleChange} 
            required />
          </div>
          <div>
            <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>amount</label>
            <input 
            name="amount" 
            type="number" 
            placeholder="株数" 
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "black",
              color: "white",
              border: "1px solid #555",
              borderRadius: "4px",
              fontSize: "1em",
              boxSizing: "border-box"
            }}
            onChange={handleChange} 
            required />
          </div>
          <div style={{ display: "flex", gap: "20px", margin: "10px 0"}}>
            <label style={{
              flex: 1,
              justifyContent: "center",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "5px 10px",
              border: formData.action === 'BUY' ? "2px solid #ff4444" : "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: formData.action === 'BUY' ? "#f0f0f0" : "white",
            }}>
              <input
              type="radio"
              name="action"
              value="BUY"
              checked={formData.action === 'BUY'}
              onChange={handleChange}
              style={{marginRight: "8px"}}
              />
              <span style={{fontSize: "0.9em"}}>買い</span>
            </label>
            <label style={{
              flex: 1,
              justifyContent: "center",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "5px 10px",
              border: formData.action === 'SELL' ? "2px solid #4CAF50" : "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: formData.action === 'SELL' ? "#f0f0f0" : "white",
            }}>
              <input
              type="radio"
              name="action"
              value="SELL"
              checked={formData.action === 'SELL'}
              onChange={handleChange}
              style={{marginRight: "8px"}}
              />
              <span style={{fontSize: "0.9em"}}>売り</span>
            </label>
          </div>
          <button type="submit" style={{ backgroundColor: "#4CAF50", color: "white", border: "none", padding: "10px"}}>
            登録
          </button>
        </form>
      </div>

      {/* alert form */}
      <div style={{flex: 1, minWidth: "300px", border: "2px solid #E91E63", padding: "15px", borderRadius: "8px", backgroundColor: "#fff0f5"}}>
        <h3 style={{color: "#C2185B", marginTop: 0}}>通知設定</h3>
        <form onSubmit={handleAlertSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px"}}>
          <div>
          <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>code</label>
          <input 
          name="ticker" 
          list="stock-options" 
          value={alertForm.ticker} 
          placeholder="銘柄コード (例: 9984.T)" 
          style={{
            width: "100%",
            padding: "8px",
            backgroundColor: "black",
            color: "white",
            border: "1px solid #555",
            borderRadius: "4px",
            fontSize: "1em",
            boxSizing: "border-box"
          }}
          onChange={(e) => {
            handleAlertChange(e);
            updateSuggestions(e);
          }
          } 
          required />
          </div>

          <div>
          <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>code</label>
          <input 
          name="targetPrice" 
          type="number" 
          value={alertForm.targetPrice} 
          placeholder="目標価格" 
          style={{
            width: "100%",
            padding: "8px",
            backgroundColor: "black",
            color: "white",
            border: "1px solid #555",
            borderRadius: "4px",
            fontSize: "1em",
            boxSizing: "border-box"
          }}
          onChange={handleAlertChange} 
          required />
          </div>
          <button type="submit" style={{backgroundColor: "#E91E63", color: "white", border: "none", padding: "10px", fontWeight: "bold", cursor: "pointer"}}>
            通知セット
          </button>
        </form>
      </div>
      </div>
      
      {/* リスト表示 */}
      <h3>保有銘柄 & 通知リスト</h3>
      <ul style={{ padding: 0 }}>
        {trades.map((trade) =>(
          <li key={trade.id} style={{ listStyle: "none", borderBottom: "1px solid #eee", padding: "15px", marginBottom: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: trade.action === "WATCH" ? "#fff0f5" : "white"}}>
            <div>
              <span style={{ backgroundColor: "#607D8B", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7em", marginRight: "8px", fontWeight:"bold" }}>
                {username || "User"}
              </span>
                {trade.action === "WATCH" ? (
                  <span><b>{trade.ticker}</b> suppervise</span>
                ): (
                  <span><b>{trade.name}</b> <small>({trade.ticker})</small></span>
                )}
                <span style={{ marginLeft: "10px" , padding: "2px 5px", borderRadius: "3px", fontSize: "0.8em", color: "white", backgroundColor: trade.action === "BUY" ? "#ff4444": trade.action === "WATCH" ? "#9C27B0" : "#2196F3"}}>
                    {trade.action}
                </span>
                <div style={{ marginTop: "5px" }}>
                    {trade.action !== "WATCH" && (
                      <span> get:{trade.price} * {trade.amount}</span>
                    )}

                    {trade.targetPrice > 0 && (
                      <span style={{marginLeft: trade.action === "WATCH" ? "0" : "15px", color: "#E91E63", fontWeight: "bold"}}>
                        target: {trade.targetPrice}
                      </span>
                    )}

                </div>
            </div>
            
            <div style={{ display: "flex", gap: "5px" }}>
                <button onClick={() => handleDelete(trade.id)} style={{ backgroundColor: "#f44336", color: "white", border: "none", padding: "5px 10px", cursor: "pointer"}}>
                    削除
                </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App