package com.healapp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String secret = "mySecretKey";
    private long accessTokenExpiration = 3600000; // 1 hour in milliseconds
    private long refreshTokenExpiration = 86400000; // 24 hours in milliseconds
    private String issuer = "HealApp";
}
