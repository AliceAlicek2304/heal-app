package com.healapp.controller;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.CategoryQuestionRequest;
import com.healapp.dto.CategoryQuestionResponse;
import com.healapp.model.UserDtls;
import com.healapp.service.CategoryQuestionService;
import com.healapp.service.UserService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/question-categories")
public class CategoryQuestionController {

    @Autowired
    private CategoryQuestionService categoryQuestionService;

    @Autowired
    private UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<CategoryQuestionResponse>> createCategory(
            @Valid @RequestBody CategoryQuestionRequest request,
            Authentication authentication) {

        String username = authentication.getName();
        Long staffId = userService.getUserIdFromUsername(username);

        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.createCategory(request, staffId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<CategoryQuestionResponse>> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryQuestionRequest request,
            Authentication authentication) {

        String username = authentication.getName();
        Long staffId = userService.getUserIdFromUsername(username);

        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.updateCategory(categoryId, request,
                staffId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Long categoryId,
            Authentication authentication) {

        String username = authentication.getName();
        Long staffId = userService.getUserIdFromUsername(username);

        ApiResponse<Void> response = categoryQuestionService.deleteCategory(categoryId, staffId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryQuestionResponse>>> getAllCategories() {
        ApiResponse<List<CategoryQuestionResponse>> response = categoryQuestionService.getAllCategories();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryQuestionResponse>> getCategoryById(@PathVariable Long categoryId) {
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.getCategoryById(categoryId);
        return ResponseEntity.ok(response);
    }
}