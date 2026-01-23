package com.kabu.kabuweb.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "trades")

public class Trade {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    private String ticker;
    private String name;
    private Double price;
    private Integer amount;
    private String action;

    private LocalDateTime tradeDate;

    private Double targetPrice;

    private Double notificationThreshold;

    private String discordId;

    private Long buyTradeId;

    private Integer soldAmount;

    //constracta
    public Trade() {}

    public Long getId() { return id;}
    public void setId(Long id) { this.id = id;}

    public String getTicker() { return ticker;}
    public void setTicker(String ticker) { this.ticker = ticker;}

    public String getName() { return name;}
    public void setName(String name) { this.name = name;}

    public Double getPrice() { return price;}
    public void setPrice(Double price) { this.price = price;}

    public Integer getAmount() { return amount;}
    public void setAmount(Integer amount) { this.amount = amount;}

    public String getAction() { return action;}
    public void setAction(String action) { this.action = action;}

    public LocalDateTime getTradeDate() { return tradeDate;}
    public void setTradeDate(LocalDateTime tradeDate) { this.tradeDate = tradeDate;}

    public Double getTargetPrice() { return targetPrice;}
    public void setTargetPrice(Double targetPrice) { this.targetPrice = targetPrice;}

    public Double getNotificationThreshold() { return notificationThreshold;}
    public void setNotificationThreshold(Double notificationThreshold) { this.notificationThreshold = notificationThreshold;}

    public String getDiscordId() { return discordId;}
    public void setDiscordId(String discordId) { this.discordId = discordId;}

    public User getUser() { return user;}
    public void setUser(User user) { this.user = user;}

    public Long getBuyTradeId() { return buyTradeId;}
    public void setBuyTradeId(Long buyTradeId) { this.buyTradeId = buyTradeId;}

    public Integer getSoldAmount() { return soldAmount;}
    public void setSoldAmount(Integer soldAmount) { this.soldAmount = soldAmount;}

}
