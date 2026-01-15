import { useState } from 'react';

function SellModal({ isOpen, onClose, buyTrade, onSell }) {
  const [sellPrice, setSellPrice] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !buyTrade) return null;

  // 残り数量の計算
  const currentSoldAmount = buyTrade.soldAmount || 0;
  const remainingAmount = buyTrade.amount - currentSoldAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const price = parseFloat(sellPrice);
    const amount = parseInt(sellAmount);

    // バリデーション
    if (!price || price <= 0) {
      setError('売却価格を正しく入力してください');
      return;
    }
    if (!amount || amount <= 0) {
      setError('売却数量を正しく入力してください');
      return;
    }
    if (amount > remainingAmount) {
      setError(`売却数量が残り数量（${remainingAmount}）を超えています`);
      return;
    }

    setLoading(true);
    try {
      await onSell(buyTrade.id, price, amount);
      // 成功したらフォームをリセットして閉じる
      setSellPrice('');
      setSellAmount('');
      onClose();
    } catch (err) {
      setError(err.message || '売却処理に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSellPrice('');
      setSellAmount('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleClose}>
      <div 
        className="card p-6 md:p-8 w-full max-w-md mx-4 animate-fade-in backdrop-blur-3xl" 
        style={{ 
          borderColor: 'rgba(236, 72, 153, 0.25)',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(45, 27, 45, 0.65) 50%, rgba(33, 38, 45, 0.6) 100%)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent tracking-tight text-glass-strong">
            売却
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-slate-400 hover:text-white text-2xl leading-none transition-all duration-300 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-700/70 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        {/* 買い取引情報の表示 */}
        <div className="mb-6 p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 text-glass">
          <div className="text-sm text-slate-400 mb-2">銘柄情報</div>
          <div className="text-lg font-semibold text-white mb-3">
            {buyTrade.name} <span className="text-slate-400 text-sm">({buyTrade.ticker})</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">取得価格:</span>
              <span className="font-mono font-semibold text-emerald-400">{buyTrade.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">取得数量:</span>
              <span className="font-mono font-semibold text-emerald-400">{buyTrade.amount}</span>
            </div>
            {currentSoldAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">売却済み:</span>
                <span className="font-mono font-semibold text-pink-400">{currentSoldAmount}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-slate-700/50">
              <span className="text-slate-300 font-semibold">残り数量:</span>
              <span className="font-mono font-bold text-emerald-300">{remainingAmount}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2.5 text-sm font-semibold text-slate-300/90 tracking-wide text-glass">
              売却価格
            </label>
            <input
              type="number"
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="売却価格を入力"
              required
              disabled={loading}
              className={`input w-full no-spinner ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="block mb-2.5 text-sm font-semibold text-slate-300/90 tracking-wide text-glass">
              売却数量 <span className="text-slate-500/70 text-xs font-normal">(最大: {remainingAmount})</span>
            </label>
            <input
              type="number"
              min="1"
              max={remainingAmount}
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="売却数量を入力"
              required
              disabled={loading}
              className={`input w-full no-spinner ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg text-sm animate-fade-in shadow-lg text-glass bg-red-950/60 border border-red-500/50 text-red-300 shadow-red-500/10">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`
                btn flex-1 py-3 font-semibold backdrop-blur-md text-white focus:ring-pink-400/50
                ${loading ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              style={{
                background: loading 
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </span>
              ) : '売却する'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn btn-ghost px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellModal;
