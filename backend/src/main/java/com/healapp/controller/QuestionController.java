package com.healapp.controller;

import com.healapp.dto.*;
import com.healapp.model.Question.QuestionStatus;
import com.healapp.service.QuestionService;
import com.healapp.service.UserService;
import com.healapp.model.UserDtls;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @Autowired
    private UserService userService;

    // create question
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @Valid @RequestBody QuestionRequest request,
            Authentication authentication) {

        String username = authentication.getName();
        Long userId = userService.getUserIdFromUsername(username);

        ApiResponse<QuestionResponse> response = questionService.createQuestion(request, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{questionId}/status")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestionStatus(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionStatusRequest request,
            Authentication authentication) {

        String username = authentication.getName();
        Long staffId = userService.getUserIdFromUsername(username);

        ApiResponse<QuestionResponse> response = questionService.updateQuestionStatus(questionId, request, staffId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{questionId}/answer")
    @PreAuthorize("hasAnyRole('STAFF', 'CONSULTANT')")
    public ResponseEntity<ApiResponse<QuestionResponse>> answerQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionAnswerRequest request,
            Authentication authentication) {

        String username = authentication.getName();
        Long userId = userService.getUserIdFromUsername(username);

        ApiResponse<QuestionResponse> response = questionService.answerQuestion(questionId, request, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('STAFF', 'CONSULTANT')")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getQuestionsByStatus(
            @PathVariable QuestionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction.toUpperCase());
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByStatus(status, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/category/{categoryId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getQuestionsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction.toUpperCase());
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByCategory(categoryId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-questions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getMyQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction,
            Authentication authentication) {

        String username = authentication.getName();
        Long userId = userService.getUserIdFromUsername(username);

        Sort.Direction sortDirection = Sort.Direction.fromString(direction.toUpperCase());
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByUser(userId, pageable);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable Long questionId,
            Authentication authentication) {

        String username = authentication.getName();
        Long staffId = userService.getUserIdFromUsername(username);

        ApiResponse<Void> response = questionService.deleteQuestion(questionId, staffId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/answered")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getAnsweredQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction.toUpperCase());
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByStatus(QuestionStatus.ANSWERED,
                pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{questionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestionById(
            @PathVariable Long questionId,
            Authentication authentication) {

        String username = authentication.getName();
        Long userId = userService.getUserIdFromUsername(username);

        ApiResponse<QuestionResponse> response = questionService.getQuestionById(questionId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> searchQuestions(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction.toUpperCase());
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        ApiResponse<Page<QuestionResponse>> response = questionService.searchQuestions(query, pageable);
        return ResponseEntity.ok(response);
    }
}