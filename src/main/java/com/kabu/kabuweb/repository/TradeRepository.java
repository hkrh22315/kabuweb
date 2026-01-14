package com.kabu.kabuweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.kabu.kabuweb.entity.Trade;
import com.kabu.kabuweb.entity.User;
import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long>{
    List<Trade> findByUser(User user);

    /**
     * user_id が有効で users テーブルに存在し、かつ target_price が設定されているTradeのみ取得する。
     * user_id=0 や users に存在しない参照を避けて Scheduled Task の例外を防ぐ。
     */
    @Query(
        value = "SELECT t.* FROM trades t JOIN users u ON u.id = t.user_id WHERE t.target_price IS NOT NULL AND t.target_price <> 0",
        nativeQuery = true
    )
    List<Trade> findAlertsToCheck();
}