package com.healapp.mcp.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healapp.dto.ApiResponse;
import com.healapp.mcp.config.MCPConfig;
import com.healapp.mcp.dto.ChatRequest;
import com.healapp.mcp.dto.ChatResponse;

@Service
public class MCPService {

    private static final Logger logger = LoggerFactory.getLogger(MCPService.class);

    @Autowired
    private WebClient mcpWebClient;

    @Autowired
    private MCPConfig mcpConfig;

    /**
     * Gửi tin nhắn đến model AI và nhận phản hồi
     */
    public ApiResponse<ChatResponse> generateResponse(String userMessage) {
        return generateResponse(userMessage, null);
    }

    /**
     * Gửi tin nhắn đến model AI với system prompt và nhận phản hồi
     */
    public ApiResponse<ChatResponse> generateResponse(String userMessage, String systemPrompt) {
        try {
            if (userMessage == null || userMessage.trim().isEmpty()) {
                return ApiResponse.error("User message cannot be empty");
            }

            long startTime = System.currentTimeMillis();

            // Tạo request từ ChatRequest class
            ChatRequest chatRequest;
            if (systemPrompt != null && !systemPrompt.isEmpty()) {
                chatRequest = ChatRequest.fromSystemAndUserPrompt(systemPrompt, userMessage);
            } else {
                chatRequest = ChatRequest.fromUserQuestion(userMessage);
            }

            // Convert to JSON để gửi API
            ObjectMapper objectMapper = new ObjectMapper();
            String requestJson = objectMapper.writeValueAsString(chatRequest);
            logger.debug("Request JSON: {}", requestJson);

            // Xây dựng URI
            String uri = UriComponentsBuilder
                    .fromPath("/models/" + mcpConfig.getModel() + ":generateContent")
                    .queryParam("key", mcpConfig.getApiKey())
                    .build()
                    .toUriString();

            logger.info("Sending request to Gemini API at endpoint: {}", uri);

            // Gọi API với timeout dài hơn
            Map<String, Object> response = mcpWebClient
                    .post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(chatRequest)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .block(Duration.ofSeconds(30));

            // Xử lý kết quả
            ChatResponse chatResponse = processGeminiResponse(response, startTime);

            return ApiResponse.success("AI response generated successfully", chatResponse);
        } catch (Exception e) {
            logger.error("Error generating AI response: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to generate AI response: " + e.getMessage());
        }
    }

    /**
     * Xử lý response từ Gemini API
     */
    @SuppressWarnings("unchecked")
    private ChatResponse processGeminiResponse(Map<String, Object> response, long startTime) {
        ChatResponse chatResponse = new ChatResponse();
        chatResponse.setModel(mcpConfig.getModel());
        chatResponse.setProcessingTimeMs(System.currentTimeMillis() - startTime);

        try {
            if (response == null) {
                chatResponse.setText("No response received from AI service.");
                return chatResponse;
            }

            // Xử lý phản hồi từ Gemini API dựa trên cấu trúc API mới nhất
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                chatResponse.setText("No content generated.");
                return chatResponse;
            }

            Map<String, Object> firstCandidate = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            if (content == null) {
                chatResponse.setText("Empty content in response.");
                return chatResponse;
            }

            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                chatResponse.setText("No text parts in response.");
                return chatResponse;
            }

            String text = (String) parts.get(0).get("text");
            chatResponse.setText(text != null ? text : "Empty text response.");

            // Lấy thêm thông tin từ phản hồi nếu có
            if (firstCandidate.containsKey("finishReason")) {
                chatResponse.setFinishReason((String) firstCandidate.get("finishReason"));
            }

            // Thêm metadata từ response
            Map<String, Object> usageMetadata = (Map<String, Object>) response.get("usageMetadata");
            if (usageMetadata != null) {
                if (usageMetadata.containsKey("promptTokenCount")) {
                    chatResponse.setPromptTokens(((Number) usageMetadata.get("promptTokenCount")).intValue());
                }
                if (usageMetadata.containsKey("candidatesTokenCount")) {
                    chatResponse.setCompletionTokens(((Number) usageMetadata.get("candidatesTokenCount")).intValue());
                }
                // Tổng số token
                chatResponse.setTotalTokens(chatResponse.getPromptTokens() + chatResponse.getCompletionTokens());
            }

            // Lấy model version nếu có
            if (response.containsKey("modelVersion")) {
                chatResponse.setModel((String) response.get("modelVersion"));
            }

        } catch (Exception e) {
            logger.error("Error processing Gemini response: {}", e.getMessage(), e);
            chatResponse.setText("Error processing AI response: " + e.getMessage());
        }

        return chatResponse;
    }
}