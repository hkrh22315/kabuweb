import { useState } from 'react'

const TradeList = ({ trades, onDelete }) => {
    // current data
    const [currentPrices, setCurrentPrices] = useState({})

    // API
    const checkPrice = async (ticker) => {
        try {
            // show in loading
            setCurrentPrices(prev => ({ ...prev, [ticker]: "getting..." }))

            const res = await fetch(`http://localhost:8080/trades/price?ticker=${ticker}`)
            const text = await res.text()

            // save result
            setCurrentPrices(prev => ({ ...prev, [ticker]: text }))
        } catch (err) {
            setCurrentPrices(prev => ({ ...prev, [ticker]: "error" }))
        }
    }

    return (
        <div>
            <h3> list </h3>
            {trades.length === 0 ? <p>no data </p> : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {trades.map((trade) => (
                        <li key={trade.id} style={{
                            borderBottom: "1px solid #eee",
                            padding: "15px",
                            marginBottom: "10px",
                            backgroundColor: "white",
                            borderRadius: "5px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <span style={{ fontSize: "1.2em", fontWeight: "bold" }}>{trade.name}</span>
                                    <span style={{ color: "#666", marginLeft: "8px" }}>({trade.ticker})</span>
                                    <span style={{
                                        marginLeft: "10px",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        color: "white",
                                        fontSize: "0.8em",
                                        backgroundColor: trade.action === "BUY" ? "#ff4444" : "#2196F3"
                                    }}>
                                        {trade.action}
                                    </span>

                                    <div style={{ marginTop: "5px" }}>
                                        get: {trade.price} * {trade.amount}
                                    </div>

                                    {/* ★修正ポイント1: 全体を { } で囲む！ */}
                                    {currentPrices[trade.ticker] && (
                                        <div style={{ marginTop: "5px", color: "#009688", fontWeight: "bold" }}>
                                            {currentPrices[trade.ticker]}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                    <button
                                        onClick={() => checkPrice(trade.ticker)}
                                        style={{ backgroundColor: "#008CBA", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: "0.9em" }}
                                    >
                                        kakunin
                                    </button>

                                    {/* ★修正ポイント2 & 3: Color -> color, #f4436 -> #f44336 */}
                                    <button
                                        onClick={() => onDelete(trade.id)}
                                        style={{ backgroundColor: "#f44336", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: "0.9em" }}
                                    >
                                        delete
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default TradeList