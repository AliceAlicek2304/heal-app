package com.healapp.dto;

import lombok.Data;

@Data
public class AIAssistantResponse {
    private String question;
    private String answer;
    private String model;
    private long responseTimeMs;
}