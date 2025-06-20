package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.CategoryQuestionRequest;
import com.healapp.dto.CategoryQuestionResponse;
import com.healapp.dto.QuestionStatusRequest;
import com.healapp.model.CategoryQuestion;
import com.healapp.model.Question;
import com.healapp.model.Question.QuestionStatus;
import com.healapp.model.UserDtls;
import com.healapp.repository.CategoryQuestionRepository;
import com.healapp.repository.QuestionRepository;
import com.healapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
            // Check if user exists and has ADMIN or STAFF role
            Optional<UserDtls> userOpt = userRepository.findById(staffId);
            if (userOpt.isEmpty() ||
                    (!("ADMIN".equals(userOpt.get().getRoleName()) || "STAFF".equals(userOpt.get().getRoleName())))) {
                return ApiResponse.error("Only ADMIN or STAFF can delete categories");
            }

            // Check if category exists
            if (!categoryQuestionRepository.existsById(categoryId)) {
                return ApiResponse.error("Category not found");
            }

            // Update all questions in this category to CANCELED status
            QuestionStatusRequest statusRequest = new QuestionStatusRequest();
            statusRequest.setStatus(QuestionStatus.CANCELED);
            statusRequest.setRejectionReason("Category has been deleted by administrator");

            Page<Question> questions = questionRepository.findByCategoryQuestion_CategoryQuestionId(categoryId,
                    Pageable.unpaged());
            for (Question question : questions.getContent()) {
                if (question.getStatus() != QuestionStatus.CANCELED
                        && question.getStatus() != QuestionStatus.ANSWERED) {
                    ApiResponse<?> updateResponse = questionService.updateQuestionStatus(question.getQuestionId(),
                            statusRequest, staffId);
                    if (!updateResponse.isSuccess()) {
                        return ApiResponse.error("Failed to delete category: Unable to update question #" +
                                question.getQuestionId() + " - " + updateResponse.getMessage());
                    }
                }
            }

            categoryQuestionRepository.deleteById(categoryId);
            return ApiResponse.success("Category deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete category: " + e.getMessage());
        }
    }

    public ApiResponse<List<CategoryQuestionResponse>> getAllCategories() {
        try {
            List<CategoryQuestion> categories = categoryQuestionRepository.findAll();
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