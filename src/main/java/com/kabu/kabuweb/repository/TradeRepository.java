package com.kabu.kabuweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kabu.kabuweb.Trade;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long>{

}