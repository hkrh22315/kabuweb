import { useState, useEffect } from 'react'
import './App.css'
import { ALL_STOCKS } from './stockData';


function App() {
  const [trades, setTrades] = useState([])
  const USERS = [ { name: 'HR', id: '896281261788778546'}, { name: "SSD", id: '890490199522545694'}]
  const [formData, setFormData] = useState({ticker: '', name: '', price: '', amount: '', action: 'BUY', discordId: USERS[0].id})
  const [alertForm, setAlertForm] = useState({ticker: '', targetPrice: '', discordId: USERS[0].id})
  const [suggestedStocks, setSuggestedStocks] = useState([]);

  // データ取得 (ログイン不要！アプリを開いたらすぐ実行)
  const fetchTrades = () => {
    fetch('/trades')
      .then(res => res.json())
      .then(data => setTrades(data))
      .catch(err => console.error("エラー:", err))
  }

  // 画面が開いた瞬間に1回だけ実行
  useEffect(() => {
    console.log(ALL_STOCKS[0])
    fetchTrades()
  }, [])

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
    fetch('/trades/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'}, // 認証ヘッダーは不要！
      body: JSON.stringify(formData)
    })
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

      discordId: alertForm.discordId
    }

    fetch('/trades/alert', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dataToSend)
    })
    .then(() => {
      fetchTrades()
      setAlertForm({ticker: '',targetPrice: ''})
      alert("add alert list")
    })
    .catch(err => alert(err))
  }

  // 削除ボタン
  const handleDelete = (id) => {
    if (window.confirm("削除しますか？")) {
      fetch(`/trades/delete?id=${id}`, {
        method: 'DELETE' // 認証ヘッダーは不要！
      })
        .then(() => fetchTrades())
    }
  }

  // discord tuuti
  const handleNotifyCheck = () => {
    fetch('/trades/check')
    .then(res => res.text())
    .then(msg => alert("done:" + msg ))
    .catch(err => alert("error:" + err))
  }


  return (
    <div style={{ backgroundColor: "white", color: "black", minHeight: "100vh", padding: "20px"}}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <h1>📈 Kabuweb </h1>

        </div>
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
            <input name="name" placeholder="銘柄名 (例: トヨタ)" onChange={handleChange} required />
          </div>
          <div>
            <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>price</label>
            <input name="price" type="number" value={formData.price} placeholder="取得単価" onChange={handleChange} required />
          </div>
          <div>
            <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>amount</label>
            <input name="amount" type="number" placeholder="株数" onChange={handleChange} required />
          </div>
          <div style={{ display: "flex", gap: "20px", margin: "10px 0"}}>
            <label style={{
              flex: 1,
              justifyContent: "center",
              cursor: "pointer",
              display: "flex",
              alignItms: "center",
              padding: "5px 10px",
              border: formData.action === 'BUY' ? "2px solid #ff4444" : "1px solid #ccc",
              borderRadius: "5px",
              backgroudColor: formData.action === 'BUY' ? "#f0f0f0" : "white",
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
              alignItms: "center",
              padding: "5px 10px",
              border: formData.action === 'SELL' ? "2px solid #4CAF50" : "1px solid #ccc",
              borderRadius: "5px",
              backgroudColor: formData.action === 'SELL' ? "#f0f0f0" : "white",
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
          <div stlye={{ display: "flex", gap: "20px", marginBottom: "15px"}}>
            {USERS.map(user => (
              <label key={user.id} style={{
                flex: 1,
                justifyContent: "center",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "5px 10px",
                border: formData.discordId === user.id ? "2px solid #607D8B" : "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: formData.discordId === user.id ? "#eceff1" : "white",
              }}>
                <input
                  type="radio"
                  name="discordId"
                  value={user.id}
                  checked={formData.discordId === user.id}
                  onChange={handleChange}
                  style={{ marginRight: "8px" }}
                />
                <span style={{ fontWeight: "bold", color: "#455a64" }}>{user.name}</span>
              </label>
            ))}
          </div>
          <button type="submit" style={{ backgroundColor: "#4CAF50", color: "white", border: "none", padding: "10px"}}>
            登録
          </button>
        </form>
      </div>

      {/* alert form */}
      <div style={{flex: 1, minWidth: "300px", border: "2px solid #E91E63", padding: "15px", borderRadius: "8px", backgroundColor: "#fff0f5"}}>
        <h3 style={{color: "#C2185B", marginTop: 0}}>通知設定</h3>
        <form onSubmit={handleAlertSubmit} style={{ display: "flex", flexDirection: " column", gap: "10px"}}>
          <div>
          <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>code</label>
          <input 
          name="ticker" 
          list="stock-options" 
          value={alertForm.ticker} 
          placeholder="銘柄コード (例: 9984.T)" 
          onChange={(e) => {
            handleAlertChange(e);
            updateSuggestions(e);
          }
          } 
          required />
          </div>

          <div>
          <label style={{display: "block", fontSize: "0.8em", visibility: "hidden"}}>code</label>
          <input name="targetPrice" type="number" value={alertForm.targetPrice} placeholder="目標価格" onChange={handleAlertChange} required />
          </div>

          <div style={{ marginTop: "10px"}}></div>
          <div style={{ display: "flex",flexDirection: "column",  marginBottom: "15px" }}>
            {USERS.map(user => (
              <label key={user.id} style={{
                flex: 1,
                justifyContent: "center",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "5px 10px",
                border: alertForm.discordId === user.id ? "2px solid #607D8B" : "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: alertForm.discordId === user.id ? "#eceff1" : "white",
              }}>
                <input
                  type="radio"
                  name="discordId"
                  value={user.id}
                  checked={alertForm.discordId === user.id}
                  onChange={handleAlertChange}
                  style={{ marginRight: "8px" }}
                />
                <span style={{ fontWeight: "bold", color: "#455a64" }}>{user.name}</span>
              </label>
            ))}
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
              <spna style={{ backgroundColor: "#607D8B", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7em", marginRight: "8px", fontWight:"bold" }}>
                {USERS.find(u => u.id === trade.discordId)?.name || "Unknown"}
              </spna>
                {trade.action === "WATCH" ? (
                  <span><b>{trade.ticker}</b> suppervise</span>
                ): (
                  <span><b>{trade.name}</b> <small>({trade.ticker})</small></span>
                )}
                <span style={{ marginLeft: "10px" , padding: "2px 5px", borderRadius: "3px", fontSize: "0.8em", color: "white", backgroundColor: trade.action === "BUY" ? "#ff4444": trade.action === "WATCH" ? "#9C27B0" : "2196F3"}}>
                    {trade.action}
                </span>
                <div style={{ marginTop: "5px" }}>
                    {trade.action !== "WATCH" && (
                      <span> get:{trade.price} * {trade.amount}</span>
                    )}

                    {trade.targetPrice > 0 && (
                      <span style={{marginLeft: trade.action === "WATCH" ? "0" : "15px", color: "E91E63", fontWeight: "bold"}}>
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

export default App