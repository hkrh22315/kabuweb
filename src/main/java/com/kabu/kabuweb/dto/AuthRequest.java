package com.kabu.kabuweb.dto;

public class AuthRequest {
    private String username;
    private String password;

    // ▼▼▼ ここも手動で追加 ▼▼▼
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}