package com.kabu.kabuweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kabu.kabuweb.entity.Trade;
import com.kabu.kabuweb.entity.User;
import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long>{
    List<Trade> findByUser(User user);
}