package com.healapp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String secret = "mySecretKey";
    private long accessTokenExpiration = 14400000; // 4 hours in milliseconds (was 1 hour)
    private long refreshTokenExpiration = 604800000; // 7 days in milliseconds (was 1 day)
    private String issuer = "HealApp";
}
