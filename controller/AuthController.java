package com.kabu.kabuweb.controller;

import com.kabu.kabuweb.dto.AuthRequest;
import com.kabu.kabuweb.entity.User;
import com.kabu.kabuweb.repository.UserRepository;
import com.kabu.kabuweb.service.UserDetailsServiceImpl;
import com.kabu.kabuweb.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, UserDetailsServiceImpl userDetailsService, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    // 1. ユーザー登録
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username is already taken!");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    // 2. ログイン
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        
        if (!passwordEncoder.matches(request.getPassword(), userDetails.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        final String jwt = jwtUtil.generateToken(userDetails);
        
        return ResponseEntity.ok(Collections.singletonMap("token", jwt));
    }
}