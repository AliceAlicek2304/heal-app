package com.healapp.service;

import com.healapp.dto.*;
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

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryQuestionRepository categoryQuestionRepository;

    public ApiResponse<QuestionResponse> createQuestion(QuestionRequest request, Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }
            UserDtls user = userOpt.get();

            // Check if category exists
            Optional<CategoryQuestion> categoryOpt = categoryQuestionRepository
                    .findById(request.getCategoryQuestionId());
            if (categoryOpt.isEmpty()) {
                return ApiResponse.error("Category not found");
            }
            CategoryQuestion category = categoryOpt.get();

            // Create new question
            Question question = new Question();
            question.setContent(request.getContent());
            question.setCustomer(user);
            question.setCategoryQuestion(category);
            question.setStatus(QuestionStatus.PROCESSING);
            question.setCreatedAt(LocalDateTime.now());

            Question savedQuestion = questionRepository.save(question);
            QuestionResponse response = mapToQuestionResponse(savedQuestion);

            return ApiResponse.success("Question created successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to create question: " + e.getMessage());
        }
    }

    public ApiResponse<QuestionResponse> updateQuestionStatus(Long questionId, QuestionStatusRequest request,
            Long staffId) {
        try {
            Optional<Question> questionOpt = questionRepository.findById(questionId);
            if (questionOpt.isEmpty()) {
                return ApiResponse.error("Question not found");
            }
            Question question = questionOpt.get();

            Optional<UserDtls> staffOpt = userRepository.findById(staffId);
            if (staffOpt.isEmpty()) {
                return ApiResponse.error("Staff user not found");
            }
            UserDtls staff = staffOpt.get();

            // Cập nhật: Sử dụng getRoleName() thay vì getRole()
            if (!"STAFF".equals(staff.getRoleName())) {
                return ApiResponse.error("Only STAFF can update question status");
            }

            // Check if status transition is valid
            if (!isValidStatusTransition(question.getStatus(), request.getStatus())) {
                return ApiResponse
                        .error("Invalid status transition from " + question.getStatus() + " to " + request.getStatus());
            }

            // Check if rejection reason is provided when cancel
            if (request.getStatus() == QuestionStatus.CANCELED &&
                    (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty())) {
                return ApiResponse.error("Rejection reason is required when canceling a question");
            }

            // Update question status
            question.setStatus(request.getStatus());
            question.setUpdater(staff);
            question.setUpdatedAt(LocalDateTime.now());

            if (request.getStatus() == QuestionStatus.CANCELED) {
                question.setRejectionReason(request.getRejectionReason());
            }

            Question updatedQuestion = questionRepository.save(question);
            QuestionResponse response = mapToQuestionResponse(updatedQuestion);

            return ApiResponse.success("Question status updated successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to update question status: " + e.getMessage());
        }
    }

    public ApiResponse<QuestionResponse> answerQuestion(Long questionId, QuestionAnswerRequest request, Long userId) {
        try {
            Optional<Question> questionOpt = questionRepository.findById(questionId);
            if (questionOpt.isEmpty()) {
                return ApiResponse.error("Question not found");
            }
            Question question = questionOpt.get();

            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }
            UserDtls user = userOpt.get();

            // Cập nhật: Sử dụng getRoleName() thay vì getRole()
            String userRole = user.getRoleName();
            if (!"STAFF".equals(userRole) && !"CONSULTANT".equals(userRole)) {
                return ApiResponse.error("Only STAFF or CONSULTANT can answer questions");
            }

            // Check if question is in CONFIRMED status
            if (question.getStatus() != QuestionStatus.CONFIRMED) {
                return ApiResponse.error("Only questions in CONFIRMED status can be answered");
            }

            // Update question with answer
            question.setAnswer(request.getAnswer());
            question.setReplier(user);
            question.setStatus(QuestionStatus.ANSWERED);
            question.setUpdatedAt(LocalDateTime.now());

            Question answeredQuestion = questionRepository.save(question);
            QuestionResponse response = mapToQuestionResponse(answeredQuestion);

            return ApiResponse.success("Question answered successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to answer question: " + e.getMessage());
        }
    }

    public ApiResponse<Page<QuestionResponse>> getQuestionsByStatus(QuestionStatus status, Pageable pageable) {
        try {
            Page<Question> questions = questionRepository.findByStatus(status, pageable);
            Page<QuestionResponse> response = questions.map(this::mapToQuestionResponse);
            return ApiResponse.success("Questions retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve questions: " + e.getMessage());
        }
    }

    public ApiResponse<Page<QuestionResponse>> getQuestionsByCategory(Long categoryId, Pageable pageable) {
        try {
            if (!categoryQuestionRepository.existsById(categoryId)) {
                return ApiResponse.error("Category not found");
            }

            Page<Question> questions = questionRepository.findByCategoryQuestion_CategoryQuestionId(categoryId,
                    pageable);
            Page<QuestionResponse> response = questions.map(this::mapToQuestionResponse);
            return ApiResponse.success("Questions retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve questions: " + e.getMessage());
        }
    }

    public ApiResponse<Page<QuestionResponse>> getQuestionsByUser(Long userId, Pageable pageable) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }
            UserDtls user = userOpt.get();

            Page<Question> questions = questionRepository.findByCustomer(user, pageable);
            Page<QuestionResponse> response = questions.map(this::mapToQuestionResponse);
            return ApiResponse.success("Questions retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve questions: " + e.getMessage());
        }
    }

    public ApiResponse<QuestionResponse> getQuestionById(Long questionId, Long userId) {
        Optional<Question> optionalQuestion = questionRepository.findById(questionId);
        if (optionalQuestion.isEmpty()) {
            return ApiResponse.error("Không tìm thấy câu hỏi với ID: " + questionId);
        }

        Question question = optionalQuestion.get();

        // Get user details
        Optional<UserDtls> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ApiResponse.error("Người dùng không hợp lệ");
        }

        UserDtls user = optionalUser.get();
        // Cập nhật: Sử dụng getRoleName() thay vì getRole()
        String role = user.getRoleName();

        // Check permissions - only owner, STAFF or CONSULTANT can view
        if (!userId.equals(question.getCustomer().getId()) &&
                !"STAFF".equals(role) &&
                !"CONSULTANT".equals(role)) {
            return ApiResponse.error("Bạn không có quyền xem câu hỏi này");
        }

        // Convert to response
        QuestionResponse response = mapToQuestionResponse(question);

        return ApiResponse.success("Lấy thông tin câu hỏi thành công", response);
    }

    public ApiResponse<Void> deleteQuestion(Long questionId, Long staffId) {
        try {
            // Check if question exists
            Optional<Question> questionOpt = questionRepository.findById(questionId);
            if (questionOpt.isEmpty()) {
                return ApiResponse.error("Question not found");
            }

            // Check if staff exists and has STAFF role
            Optional<UserDtls> staffOpt = userRepository.findById(staffId);
            // Cập nhật: Sử dụng getRoleName() thay vì getRole()
            if (staffOpt.isEmpty() || !"STAFF".equals(staffOpt.get().getRoleName())) {
                return ApiResponse.error("Only STAFF can delete questions");
            }

            questionRepository.deleteById(questionId);
            return ApiResponse.success("Question deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete question: " + e.getMessage());
        }
    }    public ApiResponse<Page<QuestionResponse>> searchQuestions(String query, Pageable pageable) {
        try {
            if (query == null || query.trim().isEmpty()) {
                return ApiResponse.error("Search query cannot be empty");
            }
            
            // Search only in answered questions that are public
            Page<Question> questions = questionRepository.searchAnsweredQuestions(query.trim(), pageable);
            Page<QuestionResponse> questionResponses = questions.map(this::convertToResponse);
            
            return ApiResponse.success("Questions searched successfully", questionResponses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to search questions: " + e.getMessage());
        }
    }

    private boolean isValidStatusTransition(QuestionStatus currentStatus, QuestionStatus newStatus) {
        switch (currentStatus) {
            case PROCESSING:
                return newStatus == QuestionStatus.CONFIRMED || newStatus == QuestionStatus.CANCELED;
            case CONFIRMED:
                return newStatus == QuestionStatus.ANSWERED;
            case ANSWERED:
            case CANCELED:
                // Answered and Canceled are final states
                return false;
            default:
                return false;
        }
    }

    private QuestionResponse mapToQuestionResponse(Question question) {
        QuestionResponse response = new QuestionResponse();
        response.setId(question.getQuestionId());
        response.setCategoryId(question.getCategoryQuestion().getCategoryQuestionId());
        response.setCategoryName(question.getCategoryQuestion().getName());
        response.setContent(question.getContent());
        response.setAnswer(question.getAnswer());
        response.setStatus(question.getStatus());
        response.setCreatedAt(question.getCreatedAt());
        response.setUpdatedAt(question.getUpdatedAt());

        // Set customer info
        response.setCustomerId(question.getCustomer().getId());
        response.setCustomerName(question.getCustomer().getFullName());
        response.setCustomerEmail(question.getCustomer().getEmail());

        // Set updater info if available
        if (question.getUpdater() != null) {
            response.setUpdaterId(question.getUpdater().getId());
            response.setUpdaterName(question.getUpdater().getFullName());
        }

        // Set replier info if available
        if (question.getReplier() != null) {
            response.setReplierId(question.getReplier().getId());
            response.setReplierName(question.getReplier().getFullName());
        }

        return response;
    }

    private QuestionResponse convertToResponse(Question question) {
        QuestionResponse response = new QuestionResponse();
        response.setId(question.getQuestionId());
        response.setCategoryId(question.getCategoryQuestion().getCategoryQuestionId());
        response.setCategoryName(question.getCategoryQuestion().getName());
        response.setContent(question.getContent());
        response.setAnswer(question.getAnswer());
        response.setStatus(question.getStatus());
        response.setCreatedAt(question.getCreatedAt());
        response.setUpdatedAt(question.getUpdatedAt());

        // Set customer info
        response.setCustomerId(question.getCustomer().getId());
        response.setCustomerName(question.getCustomer().getFullName());
        response.setCustomerEmail(question.getCustomer().getEmail());

        // Set updater info if available
        if (question.getUpdater() != null) {
            response.setUpdaterId(question.getUpdater().getId());
            response.setUpdaterName(question.getUpdater().getFullName());
        }

        // Set replier info if available
        if (question.getReplier() != null) {
            response.setReplierId(question.getReplier().getId());
            response.setReplierName(question.getReplier().getFullName());
        }

        return response;
    }
}