import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [trades, setTrades] = useState([])
  const [formData, setFormData] = useState({ticker: '', name: '', price: '', amount: '', action: 'BUY'})
  const [alertForm, setAlertForm] = useState({ticker: '', targetPrice: ''})

  // データ取得 (ログイン不要！アプリを開いたらすぐ実行)
  const fetchTrades = () => {
    fetch('/trades')
      .then(res => res.json())
      .then(data => setTrades(data))
      .catch(err => console.error("エラー:", err))
  }

  // 画面が開いた瞬間に1回だけ実行
  useEffect(() => {
    fetchTrades()
  }, [])

  // フォーム入力の処理
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value})
  }

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

      targetPrice: Number(alertForm.targetPrice)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <h1>📈 Kabuweb Dashboard</h1>

        </div>
      {/* 入力フォーム */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px"}}>
      {/* buy sell form */}
      <div style={{ flex: 1, minWidth: "300px", border: "2px solid #4CAF50", padding: "15px", borderRadius: "8px", backgroundColor: "#f9fff9" }}>
        <h3 style={{color: "2E7D32", marginTop: 0}}>新規登録</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px"}}>
          <div>
            <label style={{display: "block", fontSize: "0.8em"}}>code</label>
            <input name="ticker" placeholder="銘柄コード (例: 7203.T)" onChange={handleChange} required />
          </div>
          <div>
            <label style={{display: "block", fontSize: "0.8em"}}>name</label>
            <input name="name" placeholder="銘柄名 (例: トヨタ)" onChange={handleChange} required />
          </div>
          <div>
            <label style={{display: "block", fontSize: "0.8em"}}>price</label>
            <input name="price" type="number" placeholder="取得単価" onChange={handleChange} required />
          </div>
          <div>
            <label style={{display: "block", fontSize: "0.8em"}}>amount</label>
            <input name="amount" type="number" placeholder="株数" onChange={handleChange} required />
          </div>
          <select name="action" onChange={handleChange}>
            <option value="BUY">買い</option>
            <option value="SELL">売り</option>
          </select>
          <button type="submit" style={{ backgroundColor: "#4CAF50", color: "white", border: "none", padding: "5px 15px"}}>
            登録
          </button>
        </form>
      </div>

      {/* alert form */}
      <div style={{flex: 1, minWidth: "300px", border: "2px solid #E91E63", padding: "15px", borderRadius: "8px", backgroundColor: "#fff0f5"}}>
        <h3 style={{color: "#C2185B", marginTop: 0}}>set alert</h3>
        <p style={{ fontSize: "0.8em", color: "#666"}}>target kakaku wo nyuryoku</p>
        <form onSubmit={handleAlertSubmit} style={{ display: "flex", flexDirection: " column", gap: "10px"}}>
          <input name="ticker" value={alertForm.ticker} placeholder="code (i,e, 9984.T)" onChange={handleAlertChange} required />
          <input name="targetPrice" type="number" value={alertForm.targetPrice} placeholder="targetprice" onChange={handleAlertChange} required />
          <button type="submit" style={{backgroundColor: "#E91E63", color: "white", border: "none", padding: "10px", fontWeight: "bold", cursor: "pointer", marginTop: "auto"}}>
            set alert
          </button>
        </form>
      </div>
      </div>
      
      {/* リスト表示 */}
      <h3>保有銘柄一覧 & alert list </h3>
      <ul style={{ padding: 0 }}>
        {trades.map((trade) =>(
          <li key={trade.id} style={{ listStyle: "none", borderBottom: "1px solid #eee", padding: "15px", marginBottom: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: trade.action === "WATCH" ? "#fff0f5" : "white"}}>
            <div>
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