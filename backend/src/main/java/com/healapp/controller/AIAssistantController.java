package com.healapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healapp.dto.AIAssistantRequest;
import com.healapp.dto.AIAssistantResponse;
import com.healapp.dto.ApiResponse;
import com.healapp.dto.ChatHistoryResponse;
import com.healapp.service.AIAssistantService;
import com.healapp.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/chatbot")
public class AIAssistantController {

    @Autowired
    private AIAssistantService aiAssistantService;

    @Autowired
    private UserService userService;

    // Chat thông minh - tự động chọn chủ đề - không yêu cầu đăng nhập
    @PostMapping
    public ResponseEntity<ApiResponse<AIAssistantResponse>> chat(
            @Valid @RequestBody AIAssistantRequest request) {

        // Validate request
        if (request == null || request.getUserQuestion() == null || request.getUserQuestion().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Question cannot be blank"));
        }

        Long userId = null;

        // Lấy ID người dùng nếu đã đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser")) {
            userId = userService.getUserIdFromUsername(authentication.getName());
        }

        ApiResponse<AIAssistantResponse> response = aiAssistantService.chatSmart(request, userId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Lấy lịch sử chat - yêu cầu đăng nhập
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ChatHistoryResponse>>> getChatHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                authentication.getName().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Long userId = userService.getUserIdFromUsername(authentication.getName());
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }

        ApiResponse<List<ChatHistoryResponse>> response = aiAssistantService.getChatHistory(userId);
        return ResponseEntity.ok(response);
    }

    // Xóa lịch sử chat - yêu cầu đăng nhập
    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<Void>> clearChatHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                authentication.getName().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Long userId = userService.getUserIdFromUsername(authentication.getName());
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }

        ApiResponse<Void> response = aiAssistantService.clearChatHistory(userId);
        return ResponseEntity.ok(response);
    }
}