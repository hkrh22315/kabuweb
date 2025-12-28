package com.kabu.kabuweb.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.hibernate.persister.collection.ElementPropertyMapping;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.scheduling.annotation.Scheduled;

import com.kabu.kabuweb.Trade;
import com.kabu.kabuweb.repository.TradeRepository;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.lang.Math;



@RestController
@RequestMapping("/trades")
@CrossOrigin(origins = "http://localhost:5173")
public class TradeController {

    // discord url
    private static final String WEBHOOK_URL = "https://discordapp.com/api/webhooks/1453929206500163605/Htmrazu1mL0_lEmkiruTT28eExMA9anSCN2Rj_-X9J7v772v82qA8l8CQyDyIkiQVgeE";


    @Autowired
    private TradeRepository tradeRepository;

    @GetMapping
    public List<Trade> getAllTrades() {
        return tradeRepository.findAll();
    }

    @PostMapping("/add")
    public Trade addTrade(@RequestBody Trade trade) {
        trade.setTradeDate(LocalDateTime.now());

        return tradeRepository.save(trade);
    }

    @DeleteMapping("/delete")
    public String deleteTrade(@RequestParam long id) {
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

    @GetMapping("/check")
    @Scheduled(fixedRate = 60000)
    public String checkPricesAndNotify() {
        List<Trade> trades = tradeRepository.findAll();
        int notifyCount = 0;

        for (Trade trade : trades) {
            if (trade.getTargetPrice() == null || trade.getTargetPrice() == 0) {
                continue;
            }

            Double currentPrice = fetchCurrentPrice(trade.getTicker());

            if (currentPrice == -1.0) continue;

            if (Math.abs(currentPrice - trade.getTargetPrice()) <= 5) {
                sendToDiscord(trade.getName(), currentPrice, trade.getTargetPrice(), trade.getDiscordId());
                tradeRepository.deleteById(trade.getId());
                notifyCount++;
            }
        }
        return notifyCount + "done";
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
            String mention = (userId != null && !userId.isEmpty()) ?  userId : "";
            String json = """
                    {
            "content": "<@%s> %s %s %s"
                    }
                    """.formatted(mention, name, current, target);
            
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                                 .uri(URI.create(WEBHOOK_URL))
                                 .header("Content-Type", "application/json")
                                 .POST(HttpRequest.BodyPublishers.ofString(json))
                                 .build();
            
            client.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @PostMapping("/alert")
    public Trade addAlert(@RequestBody Trade trade) {
        trade.setTradeDate(LocalDateTime.now());

        trade.setAction("WATCH");
        trade.setAmount(0);
        trade.setPrice(0.0);

        if(trade.getName() == null || trade.getName().isEmpty()) {
            trade.setName(trade.getTicker());
        }
        return tradeRepository.save(trade);
    }


    
    
}
