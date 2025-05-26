package com.healapp.mcp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class MCPConfig {

    private static final Logger logger = LoggerFactory.getLogger(MCPConfig.class);

    @Value("${mcp.api.base-url}")
    private String baseUrl;

    @Value("${mcp.api.key}")
    private String apiKey;

    @Value("${mcp.api.provider:google}")
    private String provider;

    @Value("${mcp.api.model:gemini-2.0-flash}")
    private String model;

    @Bean
    public WebClient mcpWebClient() {
        String finalBaseUrl = baseUrl;
        if (baseUrl.endsWith("/")) {
            finalBaseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        logger.info("Initialize WebClient with base URL: {}", finalBaseUrl);

        return WebClient.builder()
                .baseUrl(finalBaseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .filter((request, next) -> {
                    logger.info("Send request to URL: {}", request.url());
                    return next.exchange(request);
                })
                .build();
    }

    public String getApiKey() {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.error("API key is not configured or empty!");
        }
        return apiKey;
    }

    public String getProvider() {
        return provider;
    }

    public String getModel() {
        return model;
    }

    public String getBaseUrl() {
        return baseUrl;
    }
}