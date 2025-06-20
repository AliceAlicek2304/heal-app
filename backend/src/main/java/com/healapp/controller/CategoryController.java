package com.healapp.controller;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.CategoryRequest;
import com.healapp.model.Category;
import com.healapp.dto.CategoryResponse;
import com.healapp.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@Valid @RequestBody CategoryRequest categoryRequest) {
        ApiResponse<Category> response = categoryService.createCategory(categoryRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryRequest categoryRequest) {

        ApiResponse<Category> response = categoryService.updateCategory(categoryId, categoryRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@PathVariable Long categoryId) {
        ApiResponse<String> response = categoryService.deleteCategory(categoryId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Category>> getCategoryById(@PathVariable Long categoryId) {
        ApiResponse<Category> response = categoryService.getCategoryById(categoryId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        try {
            ApiResponse<List<Category>> serviceResponse = categoryService.getAllCategories();

            if (serviceResponse.isSuccess() && serviceResponse.getData() != null) {
                List<CategoryResponse> categoryResponses = serviceResponse.getData().stream()
                        .map(CategoryResponse::new)
                        .collect(Collectors.toList());

                return ResponseEntity.ok(
                        ApiResponse.success("Categories retrieved successfully", categoryResponses));
            } else {
                return ResponseEntity.status(500)
                        .body(ApiResponse.error(serviceResponse.getMessage() != null ? serviceResponse.getMessage()
                                : "Error retrieving categories"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Error retrieving categories: " + e.getMessage()));
        }
    }
}