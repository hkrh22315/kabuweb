from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)

@app.route('/price')
def get_price():
    ticker_symbol = request.args.get('ticker')
    
    try:
        stock = yf.Ticker(ticker_symbol)
        data = stock.history(period="1d")
        
        if data.empty:
            return jsonify({"error": "No data"}), 404
            
        current_price = data['Close'].iloc[-1]
        
        return jsonify({
            "ticker": ticker_symbol,
            "price": round(current_price, 2)
        })

    except Exception as e:
        print(e)
        return jsonify({"error": "Error"}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)