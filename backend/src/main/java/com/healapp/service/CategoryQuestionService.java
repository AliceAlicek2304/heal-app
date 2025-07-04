package com.healapp.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.CategoryQuestionRequest;
import com.healapp.dto.CategoryQuestionResponse;
import com.healapp.model.CategoryQuestion;
import com.healapp.model.UserDtls;
import com.healapp.repository.CategoryQuestionRepository;
import com.healapp.repository.QuestionRepository;
import com.healapp.repository.UserRepository;

@Service
public class CategoryQuestionService {

    @Autowired
    private CategoryQuestionRepository categoryQuestionRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionService questionService;

    public ApiResponse<CategoryQuestionResponse> createCategory(CategoryQuestionRequest request, Long staffId) {
        try {
            // Check if user exists and has ADMIN or STAFF role
            Optional<UserDtls> userOpt = userRepository.findById(staffId);
            if (userOpt.isEmpty() ||
                    (!("ADMIN".equals(userOpt.get().getRoleName()) || "STAFF".equals(userOpt.get().getRoleName())))) {
                return ApiResponse.error("Only ADMIN or STAFF can create categories");
            }

            // Check if category name already exists
            if (categoryQuestionRepository.existsByName(request.getName())) {
                return ApiResponse.error("Category name already exists");
            }

            // Create new category
            CategoryQuestion category = new CategoryQuestion();
            category.setName(request.getName());
            category.setDescription(request.getDescription());

            CategoryQuestion savedCategory = categoryQuestionRepository.save(category);
            CategoryQuestionResponse response = mapToCategoryResponse(savedCategory);

            return ApiResponse.success("Category created successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to create category: " + e.getMessage());
        }
    }

    public ApiResponse<CategoryQuestionResponse> updateCategory(Long categoryId, CategoryQuestionRequest request,
            Long staffId) {
        try {
            // Check if user exists and has ADMIN or STAFF role
            Optional<UserDtls> userOpt = userRepository.findById(staffId);
            if (userOpt.isEmpty() ||
                    (!("ADMIN".equals(userOpt.get().getRoleName()) || "STAFF".equals(userOpt.get().getRoleName())))) {
                return ApiResponse.error("Only ADMIN or STAFF can update categories");
            }

            // Check if category exists
            Optional<CategoryQuestion> categoryOpt = categoryQuestionRepository.findById(categoryId);
            if (categoryOpt.isEmpty()) {
                return ApiResponse.error("Category not found");
            }
            CategoryQuestion category = categoryOpt.get();

            // Check if new name already exists (if name is being changed)
            if (!category.getName().equals(request.getName()) &&
                    categoryQuestionRepository.existsByName(request.getName())) {
                return ApiResponse.error("Category name already exists");
            }

            // Update category
            category.setName(request.getName());
            category.setDescription(request.getDescription());

            CategoryQuestion updatedCategory = categoryQuestionRepository.save(category);
            CategoryQuestionResponse response = mapToCategoryResponse(updatedCategory);

            return ApiResponse.success("Category updated successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to update category: " + e.getMessage());
        }
    }

    public ApiResponse<Void> deleteCategory(Long categoryId, Long staffId) {
        try {
            CategoryQuestion category = categoryQuestionRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            category.setIsActive(false);
            categoryQuestionRepository.save(category);
            // ... giữ nguyên logic cập nhật/cancel các question liên quan nếu có ...
            return ApiResponse.success("Category deleted (soft delete) successfully");
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete category: " + e.getMessage());
        }
    }

    public ApiResponse<List<CategoryQuestionResponse>> getAllCategories() {
        try {
            List<CategoryQuestion> categories = categoryQuestionRepository.findAllByIsActiveTrue();
            List<CategoryQuestionResponse> response = categories.stream()
                    .map(this::mapToCategoryResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Categories retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve categories: " + e.getMessage());
        }
    }

    public ApiResponse<CategoryQuestionResponse> getCategoryById(Long categoryId) {
        try {
            Optional<CategoryQuestion> categoryOpt = categoryQuestionRepository.findById(categoryId);
            if (categoryOpt.isEmpty()) {
                return ApiResponse.error("Category not found");
            }

            CategoryQuestionResponse response = mapToCategoryResponse(categoryOpt.get());
            return ApiResponse.success("Category retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve category: " + e.getMessage());
        }
    }

    private CategoryQuestionResponse mapToCategoryResponse(CategoryQuestion category) {
        CategoryQuestionResponse response = new CategoryQuestionResponse();
        response.setCategoryQuestionId(category.getCategoryQuestionId());
        response.setName(category.getName());
        response.setDescription(category.getDescription());
        return response;
    }
}