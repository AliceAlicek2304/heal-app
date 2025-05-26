package com.healapp.mcp.dto;

import java.util.List;
import java.util.ArrayList;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Đại diện cho request gửi đến Gemini API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    private List<Content> contents;
    private GenerationConfig generationConfig;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Content {
        private List<Part> parts;
        private String role; // Quan trọng: phải có trường này
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Part {
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerationConfig {
        private Double temperature;
        private Integer maxOutputTokens;
    }

    /**
     * Tạo request từ câu hỏi của người dùng
     */
    public static ChatRequest fromUserQuestion(String userQuestion) {
        Part part = new Part();
        part.setText(userQuestion);

        List<Part> parts = new ArrayList<>();
        parts.add(part);

        Content content = new Content();
        content.setParts(parts);
        content.setRole("user"); // Thêm role="user" quan trọng!

        List<Content> contents = new ArrayList<>();
        contents.add(content);

        GenerationConfig config = new GenerationConfig();
        config.setTemperature(0.7);
        config.setMaxOutputTokens(800);

        ChatRequest request = new ChatRequest();
        request.setContents(contents);
        request.setGenerationConfig(config);

        return request;
    }

    /**
     * Tạo request từ system prompt và câu hỏi người dùng
     */
    public static ChatRequest fromSystemAndUserPrompt(String systemPrompt, String userQuestion) {
        // Chỉnh sửa để tương thích với Gemini API:
        // Thêm system prompt vào câu hỏi người dùng thay vì tạo message riêng
        String combinedText = systemPrompt + "\n\n" + userQuestion;

        Part part = new Part();
        part.setText(combinedText);

        List<Part> parts = new ArrayList<>();
        parts.add(part);

        Content content = new Content();
        content.setParts(parts);
        content.setRole("user"); // Thêm role="user"

        List<Content> contents = new ArrayList<>();
        contents.add(content);

        GenerationConfig config = new GenerationConfig();
        config.setTemperature(0.7);
        config.setMaxOutputTokens(800);

        ChatRequest request = new ChatRequest();
        request.setContents(contents);
        request.setGenerationConfig(config);

        return request;
    }
}