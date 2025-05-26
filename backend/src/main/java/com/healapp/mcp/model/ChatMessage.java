package com.healapp.mcp.model;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
public class ChatMessage {
    private String role;
    private Object content;

    public ChatMessage() {
    }

    public ChatMessage(String role, String textContent) {
        this.role = role;
        this.content = textContent;
    }

    public Map<String, Object> toGeminiFormat() {
        Map<String, Object> message = new HashMap<>();
        message.put("role", role.equals("system") ? "user" : role);

        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", content.toString());
        parts.add(part);

        message.put("parts", parts);
        return message;
    }
}