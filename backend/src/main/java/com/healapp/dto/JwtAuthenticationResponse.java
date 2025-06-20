package com.healapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthenticationResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private LoginResponse user;
    
    // Constructor convenience
    public JwtAuthenticationResponse(String accessToken, String refreshToken, LoginResponse user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
        this.tokenType = "Bearer";
    }
}
