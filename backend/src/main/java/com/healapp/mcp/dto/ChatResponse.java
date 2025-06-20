package com.healapp.mcp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChatResponse {
    private String text;
    private String model;
    private long processingTimeMs;
    private int promptTokens;
    private int completionTokens;
    private int totalTokens;
    private String finishReason;
}