package com.kabu.kabuweb.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kabu.kabuweb.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    
}