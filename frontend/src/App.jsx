import { useState, useEffect } from 'react'
import './App.css'
import { ALL_STOCKS } from './stockData';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import SettingsForm from './components/SettingsForm';
import SellModal from './components/SellModal';
import { apiGet, apiPost, apiDelete, apiRequest } from './utils/api';

function MainApp() {
  const { isAuthenticated, logout, username } = useAuth();
  const [trades, setTrades] = useState([])
  const USERS = [ { name: 'HR', id: '896281261788778546'}, { name: "SSD", id: '890490199522545694'}]
  const [formData, setFormData] = useState({ticker: '', price: '', amount: '', action: 'BUY', discordId: ''})
  const [alertForm, setAlertForm] = useState({ticker: '', targetPrice: '', discordId: ''})
  const [suggestedStocks, setSuggestedStocks] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedBuyTrade, setSelectedBuyTrade] = useState(null);
  const [currentPage, setCurrentPage] = useState('holdings'); // 'holdings', 'trades', 'alerts'

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

  // 検索文字列を正規化（改善版）
  const normalizeSearchText = (text) => {
    if (!text) return '';
    // まずNFKC正規化で全角半角を統一（先に正規化することで、後続の処理が確実に動作する）
    let normalized = String(text).normalize('NFKC');
    // 小文字に変換（ローマ字検索用）
    normalized = normalized.toLowerCase();
    // スペース類を全て除去
    normalized = normalized.replace(/\s+/g, '');           // 半角スペース除去
    normalized = normalized.replace(/[　]+/g, '');          // 全角スペース除去
    // 長音記号を除去
    normalized = normalized.replace(/[ー－−―─━]/g, '');   // 各種長音記号除去
    return normalized;
  };

  // 銘柄コードの数字部分を取得（"8729.T" -> "8729"）
  const getCodeNumber = (code) => {
    return code.replace(/\.T$/, '');
  };

  // 銘柄コードから銘柄名を取得
  const getStockNameFromTicker = (ticker) => {
    if (!ticker) return ticker || '';
    const stock = ALL_STOCKS.find(s => s.code === ticker);
    return stock ? stock.name : ticker; // 見つからない場合は銘柄コードを返す
  };

  // フォーム入力の処理
  const handleChange = (e) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);
  }

  //候補関数（改善版）
  const updateSuggestions  = (e) => {
    const value = e.target.value;

    if(value.length > 0) {
      const normalizedValue = normalizeSearchText(value);
      const valueLower = value.toLowerCase();

      // 数字のみが入力された場合の特別処理
      const isNumericOnly = /^\d+$/.test(value);

      // 検索結果をスコアリングしてソート
      const scoredStocks = ALL_STOCKS.map(stock => {
        let score = 0;
        const codeNumber = getCodeNumber(stock.code);
        const normalizedName = normalizeSearchText(stock.name);
        const normalizedKana = stock.kana ? normalizeSearchText(stock.kana) : '';
        const normalizedRomaji = stock.romaji ? normalizeSearchText(stock.romaji) : '';

        if (isNumericOnly) {
          // 数字のみの場合：銘柄コードの数字部分で検索
          if (codeNumber.startsWith(value)) {
            score = 1000 - codeNumber.length; // 短いコードを優先
          }
        } else {
          // 1. 銘柄コード完全一致（最高優先度）
          if (stock.code.toLowerCase() === valueLower) {
            score = 10000;
          }
          // 2. 銘柄名完全一致
          else if (normalizedName === normalizedValue) {
            score = 9000;
          }
          // 3. 平仮名完全一致
          else if (normalizedKana && normalizedKana === normalizedValue) {
            score = 8500;
          }
          // 4. ローマ字完全一致
          else if (normalizedRomaji && normalizedRomaji === normalizedValue) {
            score = 8000;
          }
          // 5. 銘柄コード前方一致
          else if (stock.code.toLowerCase().startsWith(valueLower)) {
            score = 8000 - stock.code.length;
          }
          // 6. 銘柄名前方一致
          else if (normalizedName.startsWith(normalizedValue)) {
            score = 7000 - normalizedName.length;
          }
          // 7. 平仮名前方一致
          else if (normalizedKana && normalizedKana.startsWith(normalizedValue)) {
            score = 7500 - normalizedKana.length;
          }
          // 8. ローマ字前方一致
          else if (normalizedRomaji && normalizedRomaji.startsWith(normalizedValue)) {
            score = 7000 - normalizedRomaji.length;
          }
          // 9. 銘柄コードの数字部分で検索
          else if (codeNumber.includes(value)) {
            score = 6000 - codeNumber.length;
          }
          // 10. 銘柄名部分一致
          else if (normalizedName.includes(normalizedValue)) {
            score = 5000 - normalizedName.length;
          }
          // 11. ひらがな部分一致
          else if (normalizedKana && normalizedKana.includes(normalizedValue)) {
            score = 4000 - normalizedKana.length;
          }
          // 12. ローマ字部分一致
          else if (normalizedRomaji && normalizedRomaji.includes(normalizedValue)) {
            score = 3000 - normalizedRomaji.length;
          }
          // 13. 銘柄コード部分一致
          else if (stock.code.toLowerCase().includes(valueLower)) {
            score = 2000;
          }
        }

        return { stock, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.stock);

      setSuggestedStocks(scoredStocks.slice(0, 20));
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
        // フォームをクリア
        setFormData({ticker: '', price: '', amount: '', action: 'BUY', discordId: ''})
      })
      .catch(err => {
        console.error('登録エラー:', err)
      })
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
      })
      .catch(err => {
        console.error('通知設定エラー:', err)
      })
  }

  // 削除ボタン
  const handleDelete = (id) => {
    apiDelete(`/trades/delete?id=${id}`)
      .then(() => {
        fetchTrades();
      })
      .catch(err => {
        console.error("削除エラー:", err);
      })
  }

  // 売却処理
  const handleSell = async (buyTradeId, sellPrice, sellAmount) => {
    const response = await apiPost('/trades/sell', {
      buyTradeId,
      sellPrice,
      sellAmount
    });
    
    fetchTrades();
    
    return response;
  }

  // 売却モーダルを開く
  const openSellModal = (trade) => {
    setSelectedBuyTrade(trade);
    setIsSellModalOpen(true);
  }


  // ログアウト処理
  const handleLogout = () => {
    logout()
  }


  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen text-white aurora-bg" style={{ backgroundColor: '#0d1117' }}>
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl">
        {/* ヘッダー */}
        <header className="card backdrop-blur-2xl rounded-xl sm:rounded-2xl p-5 sm:p-7 mb-6 sm:mb-8 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent tracking-tight text-glass-strong">
              Kabuweb
            </h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-end sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-slate-300/80 text-glass">
                ユーザー名: <span className="font-semibold text-emerald-400">{username || "User"}</span>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="btn btn-secondary text-xs sm:text-sm px-4 sm:px-5 py-2.5 flex-1 sm:flex-none"
                >
                  設定
                </button>
                <button 
                  onClick={handleLogout}
                  className="btn btn-danger text-xs sm:text-sm px-4 sm:px-5 py-2.5 flex-1 sm:flex-none"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ナビゲーションタブ */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 sm:gap-3 border-b border-slate-700/50">
            <button
              onClick={() => setCurrentPage('holdings')}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-300 border-b-2 ${
                currentPage === 'holdings'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              保有銘柄
            </button>
            <button
              onClick={() => setCurrentPage('trades')}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-300 border-b-2 ${
                currentPage === 'trades'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              売買記録
            </button>
            <button
              onClick={() => setCurrentPage('alerts')}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-300 border-b-2 ${
                currentPage === 'alerts'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              アラート設定
            </button>
          </div>
        </div>

        <SettingsForm 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          username={username}
        />

        <SellModal
          isOpen={isSellModalOpen}
          onClose={() => {
            setIsSellModalOpen(false);
            setSelectedBuyTrade(null);
          }}
          buyTrade={selectedBuyTrade}
          onSell={handleSell}
        />

        {/* 入力フォーム */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-6 sm:mb-8">
          {/* 新規登録フォーム */}
          <div 
            className="card p-5 sm:p-7 backdrop-blur-3xl" 
            style={{ 
              borderColor: 'rgba(16, 185, 129, 0.25)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(33, 38, 45, 0.65) 50%, rgba(33, 38, 45, 0.6) 100%)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold text-emerald-400 mb-5 sm:mb-6 tracking-tight text-glass-strong">
              新規登録
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input 
                  name="ticker"
                  list="stock-options" 
                  placeholder="銘柄コードまたは銘柄名で検索 (例: 7203.T または トヨタ)"
                  className="input w-full"
                  value={formData.ticker}
                  onChange={(e) => {
                    const value = e.target.value;
                    // datalistから選択された場合、「コード - 名前」形式からコードを抽出
                    if (value.includes(' - ')) {
                      const code = value.split(' - ')[0];
                      setFormData({ ...formData, ticker: code });
                    } else {
                      handleChange(e);
                    }
                    updateSuggestions(e);
                  }} 
                  required 
                />
                <datalist id="stock-options">
                  {suggestedStocks.map(stock => (
                    <option key={stock.code} value={`${stock.code} - ${stock.name} / ${stock.kana || ''} / ${stock.romaji || ''}`}>
                      {stock.name}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <input 
                  name="price" 
                  type="number" 
                  value={formData.price} 
                  placeholder="取得単価" 
                  className="input w-full no-spinner"
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <input 
                  name="amount" 
                  type="number" 
                  value={formData.amount}
                  placeholder="株数" 
                  className="input w-full no-spinner"
                  onChange={handleChange} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary w-full py-3 sm:py-3.5 text-base sm:text-lg font-semibold">
                登録
              </button>
            </form>
          </div>

          {/* 通知設定フォーム */}
          <div 
            className="card p-5 sm:p-7 backdrop-blur-3xl" 
            style={{ 
              borderColor: 'rgba(236, 72, 153, 0.25)',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(45, 27, 45, 0.65) 50%, rgba(33, 38, 45, 0.6) 100%)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold text-pink-400 mb-5 sm:mb-6 tracking-tight text-glass-strong">
              通知設定
            </h3>
            <form onSubmit={handleAlertSubmit} className="space-y-4">
              <div>
                <input 
                  name="ticker" 
                  list="stock-options-alert" 
                  value={alertForm.ticker} 
                  placeholder="銘柄コードまたは銘柄名で検索 (例: 9984.T または ソフトバンクグループ)" 
                  className="input w-full"
                  onChange={(e) => {
                    const value = e.target.value;
                    // datalistから選択された場合、「コード - 名前」形式からコードを抽出
                    if (value.includes(' - ')) {
                      const code = value.split(' - ')[0];
                      setAlertForm({ ...alertForm, ticker: code });
                    } else {
                      handleAlertChange(e);
                    }
                    updateSuggestions(e);
                  }} 
                  required 
                />
                <datalist id="stock-options-alert">
                  {suggestedStocks.map(stock => (
                    <option key={stock.code} value={`${stock.code} - ${stock.name} / ${stock.kana || ''} / ${stock.romaji || ''}`}>
                      {stock.name}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <input 
                  name="targetPrice" 
                  type="number" 
                  value={alertForm.targetPrice} 
                  placeholder="目標価格" 
                  className="input w-full no-spinner"
                  onChange={handleAlertChange} 
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="btn w-full py-3 sm:py-3.5 text-base sm:text-lg font-semibold backdrop-blur-md text-white focus:ring-pink-400/50"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.4) 0%, rgba(236, 72, 153, 0.35) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.4)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                }}
              >
                通知セット
              </button>
            </form>
          </div>
        </div>
        
        {/* データの分類 */}
        {(() => {
          // 保有銘柄：BUYで購入し、まだ全部売っていないもの
          const holdings = trades.filter(trade => 
            trade.action === "BUY" && (trade.soldAmount || 0) < trade.amount
          );
          
          // 売買記録：BUY/SELL取引
          const tradeHistory = trades.filter(trade => 
            trade.action === "BUY" || trade.action === "SELL"
          );
          
          // アラート設定：WATCH取引
          const alerts = trades.filter(trade => trade.action === "WATCH");
          
          return (
            <>
              {/* 保有銘柄セクション */}
              {currentPage === 'holdings' && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-slate-200 tracking-tight text-glass-strong">
                  保有銘柄
                </h3>
                {holdings.length === 0 ? (
                  <div 
                    className="card p-10 sm:p-14 text-center backdrop-blur-3xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(33, 38, 45, 0.65) 0%, rgba(33, 38, 45, 0.55) 100%)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <p className="text-slate-400/80 text-base sm:text-lg">保有銘柄がありません</p>
                  </div>
                ) : (
                  <div className="card backdrop-blur-3xl overflow-x-auto" style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(33, 38, 45, 0.65) 50%, rgba(33, 38, 45, 0.6) 100%)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">銘柄</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">保有数量</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">取得価額</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((trade) => {
                          const remainingAmount = trade.amount - (trade.soldAmount || 0);
                          return (
                            <tr 
                              key={trade.id} 
                              className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-white text-base">{getStockNameFromTicker(trade.ticker)}</span>
                                  <span className="text-slate-400 text-sm">({trade.ticker})</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-mono font-semibold text-emerald-400">{remainingAmount}</span>
                                <span className="text-slate-500 text-sm ml-1">株</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-mono font-semibold text-emerald-400">¥{Number(trade.price).toLocaleString()}</span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex gap-2 justify-end">
                                  {remainingAmount > 0 && (
                                    <button 
                                      onClick={() => openSellModal(trade)} 
                                      className="btn text-xs sm:text-sm px-3 sm:px-4 py-2 backdrop-blur-md text-white"
                                      style={{
                                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%)',
                                        border: '1px solid rgba(236, 72, 153, 0.4)',
                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                      }}
                                    >
                                      売る
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDelete(trade.id)} 
                                    className="btn btn-danger text-xs sm:text-sm px-3 sm:px-4 py-2"
                                  >
                                    削除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              )}

              {/* 売買記録セクション */}
              {currentPage === 'trades' && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-slate-200 tracking-tight text-glass-strong">
                  売買記録
                </h3>
                {tradeHistory.length === 0 ? (
                  <div 
                    className="card p-10 sm:p-14 text-center backdrop-blur-3xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(33, 38, 45, 0.65) 0%, rgba(33, 38, 45, 0.55) 100%)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <p className="text-slate-400/80 text-base sm:text-lg">売買記録がありません</p>
                  </div>
                ) : (
                  <div className="card backdrop-blur-3xl overflow-x-auto" style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(33, 38, 45, 0.65) 50%, rgba(33, 38, 45, 0.6) 100%)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">銘柄</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">種別</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">数量</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">価格</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">損益</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeHistory.map((trade) => {
                          const buyTrade = trade.buyTradeId ? trades.find(t => t.id === trade.buyTradeId) : null;
                          const profitLoss = trade.action === "SELL" && buyTrade ? (trade.price - buyTrade.price) * trade.amount : null;
                          return (
                            <tr 
                              key={trade.id} 
                              className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-white text-base">{getStockNameFromTicker(trade.ticker)}</span>
                                  <span className="text-slate-400 text-sm">({trade.ticker})</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`
                                  badge text-xs
                                  ${trade.action === "BUY" 
                                    ? 'badge-danger' 
                                    : 'badge-secondary'
                                  }
                                `}>
                                  {trade.action}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex flex-col items-end">
                                  <div>
                                    <span className={`font-mono font-semibold ${trade.action === "BUY" ? 'text-emerald-400' : 'text-pink-400'}`}>
                                      {trade.amount}
                                    </span>
                                    <span className="text-slate-500 text-sm ml-1">株</span>
                                  </div>
                                  {trade.action === "BUY" && (trade.soldAmount || 0) > 0 && (
                                    <span className="text-xs text-slate-400 mt-1">
                                      売却済み: {trade.soldAmount}株 / 残り: {trade.amount - trade.soldAmount}株
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className={`font-mono font-semibold ${trade.action === "BUY" ? 'text-emerald-400' : 'text-pink-400'}`}>
                                  ¥{Number(trade.price).toLocaleString()}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                {profitLoss !== null && (
                                  <span className={`font-semibold ${profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {profitLoss >= 0 ? '+' : ''}¥{profitLoss.toLocaleString()}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex gap-2 justify-end">
                                  <button 
                                    onClick={() => handleDelete(trade.id)} 
                                    className="btn btn-danger text-xs sm:text-sm px-3 sm:px-4 py-2"
                                  >
                                    削除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              )}

              {/* アラート設定セクション */}
              {currentPage === 'alerts' && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-slate-200 tracking-tight text-glass-strong">
                  アラート設定
                </h3>
                {alerts.length === 0 ? (
                  <div 
                    className="card p-10 sm:p-14 text-center backdrop-blur-3xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(33, 38, 45, 0.65) 0%, rgba(33, 38, 45, 0.55) 100%)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <p className="text-slate-400/80 text-base sm:text-lg">アラート設定がありません</p>
                  </div>
                ) : (
                  <div className="card backdrop-blur-3xl overflow-x-auto" style={{
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(45, 27, 45, 0.65) 50%, rgba(45, 27, 45, 0.6) 100%)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">銘柄</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">目標価格</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.map((trade) => (
                          <tr 
                            key={trade.id} 
                            className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-white text-base">{getStockNameFromTicker(trade.ticker)}</span>
                                <span className="text-slate-400 text-sm">({trade.ticker})</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {trade.targetPrice > 0 && (
                                <span className="font-mono font-semibold text-pink-400">
                                  ¥{Number(trade.targetPrice).toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => handleDelete(trade.id)} 
                                  className="btn btn-danger text-xs sm:text-sm px-3 sm:px-4 py-2"
                                >
                                  削除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              )}
            </>
          );
        })()}
      </div>
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
