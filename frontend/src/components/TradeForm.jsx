import { useState } from 'react'

const TradeForm = ({ onadd }) => {
    const [formData, setFormData] = useState({
        ticker: '', name: '', price: '', amount: '', action: 'BUY'
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.EventTarget.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        onadd(formData)

        setFormData({ ticker: '', name: '', price: '', amount: '', action: 'BUY' })
    }

    return (
        <div style={{ border: "2px solid #ddd", padding: "15px", marginBottom: "20px", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
            <h3> new </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input name="ticker" value={formData.ticker} placeholder="ticker code (i.e. 7203.T)" onChange={handleChange} requwired />
                <input name="name" value={formData.name} placeholder="name (i.e. TOYOTA)" onChange={handleChange} requwired />
                <input name="price" type="number" value={formData.price} placeholder="price" onChange={handleChange} requwired />
                <input name="amount" type="number" value={formData.amount} placeholder="amount" onChange={handleChange} requwired />

                <select name="action" value={formData.action} onChange={handleChange}>
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                </select>

                <button type="submit" style={{ backgroundColor: "#4CAF50", color: "white", border: "none", padding: "8px 16px", cursor: "pointer" }}>
                    add
                </button>
            </form>
        </div>
    )
}

export default TradeForm