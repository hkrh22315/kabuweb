package com.kabu.kabuweb.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import com.kabu.kabuweb.entity.Trade;
import com.kabu.kabuweb.entity.User;
import com.kabu.kabuweb.repository.TradeRepository;
import com.kabu.kabuweb.repository.UserRepository;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.lang.Math;
import jakarta.annotation.PostConstruct;



@RestController
@RequestMapping("/trades")
@CrossOrigin(origins = "http://localhost:5173")
public class TradeController {

    // discord url
    private static final String WEBHOOK_URL = "https://discordapp.com/api/webhooks/1453929206500163605/Htmrazu1mL0_lEmkiruTT28eExMA9anSCN2Rj_-X9J7v772v82qA8l8CQyDyIkiQVgeE";


    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void init() {
    }

    // 現在のユーザーを取得するヘルパーメソッド
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            return userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));
        }
        throw new RuntimeException("User not authenticated");
    }

    @GetMapping
    public List<Trade> getAllTrades() {
        User currentUser = getCurrentUser();
        List<Trade> trades = tradeRepository.findByUser(currentUser);
        return trades;
    }

    // アラート専用エンドポイント（action === "WATCH" のトレードのみを返す）
    @GetMapping("/alerts")
    public List<Trade> getAlerts() {
        User currentUser = getCurrentUser();
        List<Trade> allTrades = tradeRepository.findByUser(currentUser);
        List<Trade> alerts = allTrades.stream()
            .filter(t -> "WATCH".equals(t.getAction()))
            .collect(Collectors.toList());
        return alerts;
    }

    @PostMapping("/add")
    public Trade addTrade(@RequestBody Trade trade) {
        User currentUser = getCurrentUser();
        trade.setUser(currentUser);
        trade.setTradeDate(LocalDateTime.now());

        return tradeRepository.save(trade);
    }

    @DeleteMapping("/delete")
    public String deleteTrade(@RequestParam long id) {
        User currentUser = getCurrentUser();
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found: " + id));
        
        // 現在のユーザーのトレードのみ削除可能
        if (!trade.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized: Cannot delete other user's trade");
        }
        
        tradeRepository.deleteById(id);
        return "ID: " + id + "delete";
    }

    @GetMapping("/price")
    public String getPrice(@RequestParam String ticker) {
        try{
            String googleTicker = ticker.replace(".T", ":TYO");

            String url = "https://www.google.com/finance/quote/" + googleTicker;
            Document doc = Jsoup.connect(url).get();

            Element priceElement = doc.select(".YMLKec.fxKbKc").first();

            if (priceElement != null) {
                return ticker + ":" + priceElement.text();
            } else {
                return "not found";
            }
         } catch(Exception e) {
                e.printStackTrace();
            return e.getMessage();
        }
    }


    @Scheduled(fixedRate = 60000)
    public void checkPricesAndNotify() {
        // user_id=0 や users に存在しない参照を除外した、チェック対象アラートのみ取得
        List<Trade> trades;
        try {
            trades = tradeRepository.findAlertsToCheck();
        } catch (Exception e) {
            System.err.println("[Scheduled Task] アラート取得エラー: " + e.getMessage());
            e.printStackTrace();
            return;
        }

        for (Trade trade : trades) {
            if (trade.getUser() == null) {
                continue;
            }

            Double currentPrice = fetchCurrentPrice(trade.getTicker());

            if (currentPrice == -1.0) {
                continue;
            }

            double priceDiff = Math.abs(currentPrice - trade.getTargetPrice());
            
            // 通知閾値を取得（nullの場合はデフォルト値5.0を使用）
            Double threshold = trade.getNotificationThreshold();
            if (threshold == null) {
                threshold = 5.0;
            }

            if (priceDiff <= threshold) {
                try {
                    // UserのDiscord IDを使用
                    String discordId = trade.getUser().getDiscordId();
                    sendToDiscord(trade.getName(), currentPrice, trade.getTargetPrice(), discordId);
                    tradeRepository.deleteById(trade.getId());
                } catch (Exception e) {
                    System.err.println("[Scheduled Task] 通知処理エラー (Trade ID: " + trade.getId() + "): " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
    }

    private Double fetchCurrentPrice(String ticker) {
        try {
            String googleTicker = ticker.replace(".T", ":TYO");
            String url = "https://google.com/finance/quote/" + googleTicker;
            Document doc = Jsoup.connect(url).get();
            Element priceElement = doc.select(".YMLKec.fxKbKc").first();

            if (priceElement != null) {
                String priceText = priceElement.text().replace("¥", "").replace(",","");
                return Double.parseDouble(priceText);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1.0;
    }

    private void sendToDiscord(String name, Double current, Double target, String userId) {
        try{
            String mention = (userId != null && !userId.isEmpty()) ? "<@" + userId + ">" : "";
            String message = mention + " " + name + " が " + target + " に近付きました (現在: " + current + ")";
            String json = """
                    {
            "content": "%s"
                    }
                    """.formatted(message.replace("\"", "\\\""));
            
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                                 .uri(URI.create(WEBHOOK_URL))
                                 .header("Content-Type", "application/json")
                                 .POST(HttpRequest.BodyPublishers.ofString(json))
                                 .build();
            
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() != 200 && response.statusCode() != 204) {
                System.err.println("[Discord通知] 送信失敗: HTTPステータス " + response.statusCode() + ", レスポンス: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("[Discord通知] エラー発生: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @PostMapping("/alert")
    public Trade addAlert(@RequestBody Trade trade) {
        User currentUser = getCurrentUser();
        trade.setUser(currentUser);
        trade.setTradeDate(LocalDateTime.now());

        trade.setAction("WATCH");
        trade.setAmount(0);
        trade.setPrice(0.0);
        
        // 通知閾値が設定されていない場合はデフォルト値5.0を設定
        if (trade.getNotificationThreshold() == null) {
            trade.setNotificationThreshold(5.0);
        }

        if(trade.getName() == null || trade.getName().isEmpty()) {
            trade.setName(trade.getTicker());
        }
        return tradeRepository.save(trade);
    }

    @PostMapping("/sell")
    public Map<String, Object> sellTrade(@RequestBody Map<String, Object> request) {
        User currentUser = getCurrentUser();
        
        // リクエストパラメータの取得
        Long buyTradeId = Long.valueOf(request.get("buyTradeId").toString());
        Double sellPrice = Double.valueOf(request.get("sellPrice").toString());
        Integer sellAmount = Integer.valueOf(request.get("sellAmount").toString());
        
        // 買い取引を取得
        Trade buyTrade = tradeRepository.findById(buyTradeId)
                .orElseThrow(() -> new RuntimeException("Buy trade not found: " + buyTradeId));
        
        // ユーザー所有確認
        if (!buyTrade.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized: Cannot sell other user's trade");
        }
        
        // 買い取引であることを確認
        if (!"BUY".equals(buyTrade.getAction())) {
            throw new RuntimeException("Trade is not a BUY trade");
        }
        
        // 残り数量の計算
        Integer currentSoldAmount = (buyTrade.getSoldAmount() != null) ? buyTrade.getSoldAmount() : 0;
        Integer remainingAmount = buyTrade.getAmount() - currentSoldAmount;
        
        // バリデーション
        if (sellAmount <= 0) {
            throw new RuntimeException("Sell amount must be greater than 0");
        }
        if (sellPrice <= 0) {
            throw new RuntimeException("Sell price must be greater than 0");
        }
        if (sellAmount > remainingAmount) {
            throw new RuntimeException("Sell amount (" + sellAmount + ") exceeds remaining amount (" + remainingAmount + ")");
        }
        
        // 売却取引を作成
        Trade sellTrade = new Trade();
        sellTrade.setUser(currentUser);
        sellTrade.setTicker(buyTrade.getTicker());
        sellTrade.setName(buyTrade.getName());
        sellTrade.setPrice(sellPrice);
        sellTrade.setAmount(sellAmount);
        sellTrade.setAction("SELL");
        sellTrade.setTradeDate(LocalDateTime.now());
        sellTrade.setBuyTradeId(buyTradeId);
        
        // 買い取引のsoldAmountを更新
        buyTrade.setSoldAmount(currentSoldAmount + sellAmount);
        
        // 保存
        Trade savedSellTrade = tradeRepository.save(sellTrade);
        tradeRepository.save(buyTrade);
        
        // 損益を計算
        Double profitLoss = (sellPrice - buyTrade.getPrice()) * sellAmount;
        
        // レスポンスを作成
        Map<String, Object> response = new HashMap<>();
        response.put("sellTrade", savedSellTrade);
        response.put("profitLoss", profitLoss);
        response.put("remainingAmount", remainingAmount - sellAmount);
        
        return response;
    }




    
    
}
