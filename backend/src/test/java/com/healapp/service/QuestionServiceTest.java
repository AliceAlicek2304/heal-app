package com.healapp.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.QuestionAnswerRequest;
import com.healapp.dto.QuestionRequest;
import com.healapp.dto.QuestionResponse;
import com.healapp.dto.QuestionStatusRequest;
import com.healapp.model.CategoryQuestion;
import com.healapp.model.Question;
import com.healapp.model.Question.QuestionStatus;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.CategoryQuestionRepository;
import com.healapp.repository.QuestionRepository;
import com.healapp.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryQuestionRepository categoryQuestionRepository;

    @InjectMocks
    private QuestionService questionService;

    private UserDtls regularUser;
    private UserDtls staffUser;
    private UserDtls consultantUser;
    private CategoryQuestion category;
    private Question question;
    private QuestionRequest questionRequest;
    private Pageable pageable;

    // Cập nhật: Thêm Role entities
    private Role userRole;
    private Role staffRole;
    private Role consultantRole;

    @BeforeEach
    void setUp() {
        // Cập nhật: Khởi tạo Role entities
        userRole = new Role();
        userRole.setRoleId(1L);
        userRole.setRoleName("CUSTOMER");
        userRole.setDescription("Regular customer role");

        staffRole = new Role();
        staffRole.setRoleId(2L);
        staffRole.setRoleName("STAFF");
        staffRole.setDescription("Staff role");

        consultantRole = new Role();
        consultantRole.setRoleId(3L);
        consultantRole.setRoleName("CONSULTANT");
        consultantRole.setDescription("Healthcare consultant role");

        // Cập nhật: Initialize regular user với Role entity
        regularUser = new UserDtls();
        regularUser.setId(1L);
        regularUser.setUsername("user");
        regularUser.setFullName("Regular User");
        regularUser.setEmail("user@example.com");
        regularUser.setRole(userRole); // Sử dụng Role entity thay vì String

        // Cập nhật: Initialize staff user với Role entity
        staffUser = new UserDtls();
        staffUser.setId(2L);
        staffUser.setUsername("staff");
        staffUser.setFullName("Staff User");
        staffUser.setEmail("staff@example.com");
        staffUser.setRole(staffRole); // Sử dụng Role entity thay vì String

        // Cập nhật: Initialize consultant user với Role entity
        consultantUser = new UserDtls();
        consultantUser.setId(3L);
        consultantUser.setUsername("consultant");
        consultantUser.setFullName("Consultant User");
        consultantUser.setEmail("consultant@example.com");
        consultantUser.setRole(consultantRole); // Sử dụng Role entity thay vì String

        // Initialize category
        category = new CategoryQuestion();
        category.setCategoryQuestionId(1L);
        category.setName("Mental Health");

        // Initialize question
        question = new Question();
        question.setQuestionId(1L);
        question.setContent("How can I improve my mental health?");
        question.setCustomer(regularUser);
        question.setCategoryQuestion(category);
        question.setStatus(QuestionStatus.PROCESSING);
        question.setCreatedAt(LocalDateTime.now());

        // Initialize question request
        questionRequest = new QuestionRequest();
        questionRequest.setContent("How can I improve my mental health?");
        questionRequest.setCategoryQuestionId(1L);

        // Initialize pageable
        pageable = PageRequest.of(0, 10);
    }

    @Test
    @DisplayName("Tạo Câu Hỏi - Thành Công")
    void createQuestion_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));
        when(categoryQuestionRepository.findById(1L)).thenReturn(Optional.of(category));
        when(questionRepository.save(any(Question.class))).thenReturn(question);

        // Act
        ApiResponse<QuestionResponse> response = questionService.createQuestion(questionRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Question created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getId());
        assertEquals("How can I improve my mental health?", response.getData().getContent());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).findById(1L);
        verify(questionRepository).save(any(Question.class));
    }

    @Test
    @DisplayName("Tạo Câu Hỏi - Không Tìm Thấy Người Dùng")
    void createQuestion_UserNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<QuestionResponse> response = questionService.createQuestion(questionRequest, 999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
        verify(categoryQuestionRepository, never()).findById(anyLong());
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Tạo Câu Hỏi - Không Tìm Thấy Danh Mục")
    void createQuestion_CategoryNotFound() {
        // Arrange
        questionRequest.setCategoryQuestionId(999L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));
        when(categoryQuestionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<QuestionResponse> response = questionService.createQuestion(questionRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).findById(999L);
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Cập Nhật Trạng Thái Câu Hỏi - Thành Công (ĐANG XỬ LÝ sang XÁC NHẬN)")
    void updateQuestionStatus_ProcessingToConfirmed_Success() {
        // Arrange
        QuestionStatusRequest request = new QuestionStatusRequest();
        request.setStatus(QuestionStatus.CONFIRMED);

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setStatus(QuestionStatus.CONFIRMED);
            q.setUpdater(staffUser);
            q.setUpdatedAt(LocalDateTime.now());
            return q;
        });

        // Act
        ApiResponse<QuestionResponse> response = questionService.updateQuestionStatus(1L, request, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Question status updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(QuestionStatus.CONFIRMED, response.getData().getStatus());
        assertEquals(2L, response.getData().getUpdaterId());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(questionRepository).save(any(Question.class));
    }

    @Test
    @DisplayName("Cập Nhật Trạng Thái Câu Hỏi - Thành Công (ĐANG XỬ LÝ sang HỦY BỎ)")
    void updateQuestionStatus_ProcessingToCanceled_Success() {
        // Arrange
        QuestionStatusRequest request = new QuestionStatusRequest();
        request.setStatus(QuestionStatus.CANCELED);
        request.setRejectionReason("Content is inappropriate");

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setStatus(QuestionStatus.CANCELED);
            q.setRejectionReason("Content is inappropriate");
            q.setUpdater(staffUser);
            q.setUpdatedAt(LocalDateTime.now());
            return q;
        });

        // Act
        ApiResponse<QuestionResponse> response = questionService.updateQuestionStatus(1L, request, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Question status updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(QuestionStatus.CANCELED, response.getData().getStatus());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(questionRepository).save(any(Question.class));
    }

    @Test
    @DisplayName("Cập Nhật Trạng Thái Câu Hỏi - Không Tìm Thấy Câu Hỏi")
    void updateQuestionStatus_QuestionNotFound() {
        // Arrange
        QuestionStatusRequest request = new QuestionStatusRequest();
        request.setStatus(QuestionStatus.CONFIRMED);

        when(questionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<QuestionResponse> response = questionService.updateQuestionStatus(999L, request, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Question not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(999L);
        verify(userRepository, never()).findById(anyLong());
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Cập Nhật Trạng Thái Câu Hỏi - Không Tìm Thấy Nhân Viên")
    void updateQuestionStatus_StaffNotFound() {
        // Arrange
        QuestionStatusRequest request = new QuestionStatusRequest();
        request.setStatus(QuestionStatus.CONFIRMED);

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<QuestionResponse> response = questionService.updateQuestionStatus(1L, request, 999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Staff user not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(999L);
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Cập Nhật Trạng Thái Câu Hỏi - Không Phải Nhân Viên")
    void updateQuestionStatus_NotStaff() {
        // Arrange
        QuestionStatusRequest request = new QuestionStatusRequest();
        request.setStatus(QuestionStatus.CONFIRMED);

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.updateQuestionStatus(1L, request, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only STAFF can update question status", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(1L);
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Cập Nhật Trạng Thái Câu Hỏi - Chuyển Đổi Không Hợp Lệ (ĐÃ TRẢ LỜI sang XÁC NHẬN)")
    void updateQuestionStatus_InvalidTransition() {
        // Arrange
        QuestionStatusRequest request = new QuestionStatusRequest();
        request.setStatus(QuestionStatus.CONFIRMED);

        // Set question to ANSWERED status
        question.setStatus(QuestionStatus.ANSWERED);

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.updateQuestionStatus(1L, request, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Invalid status transition"));
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Cập Nhật Trạng Thái Câu Hỏi - Thiếu Lý Do Từ Chối")
    void updateQuestionStatus_MissingRejectionReason() {
        // Arrange
        QuestionStatusRequest request = new QuestionStatusRequest();
        request.setStatus(QuestionStatus.CANCELED);
        // No rejection reason provided

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.updateQuestionStatus(1L, request, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Rejection reason is required when canceling a question", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Trả Lời Câu Hỏi - Nhân Viên Thành Công")
    void answerQuestion_Staff_Success() {
        // Arrange
        QuestionAnswerRequest request = new QuestionAnswerRequest();
        request.setAnswer("This is a professional answer to your question.");

        // Set question to CONFIRMED status
        question.setStatus(QuestionStatus.CONFIRMED);

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setAnswer(request.getAnswer());
            q.setReplier(staffUser);
            q.setStatus(QuestionStatus.ANSWERED);
            q.setUpdatedAt(LocalDateTime.now());
            return q;
        });

        // Act
        ApiResponse<QuestionResponse> response = questionService.answerQuestion(1L, request, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Question answered successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(QuestionStatus.ANSWERED, response.getData().getStatus());
        assertEquals("This is a professional answer to your question.", response.getData().getAnswer());
        assertEquals(2L, response.getData().getReplierId());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(questionRepository).save(any(Question.class));
    }

    @Test
    @DisplayName("Trả Lời Câu Hỏi - Tư Vấn Viên Thành Công")
    void answerQuestion_Consultant_Success() {
        // Arrange
        QuestionAnswerRequest request = new QuestionAnswerRequest();
        request.setAnswer("This is a professional answer from a consultant.");

        // Set question to CONFIRMED status
        question.setStatus(QuestionStatus.CONFIRMED);

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(3L)).thenReturn(Optional.of(consultantUser));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setAnswer(request.getAnswer());
            q.setReplier(consultantUser);
            q.setStatus(QuestionStatus.ANSWERED);
            q.setUpdatedAt(LocalDateTime.now());
            return q;
        });

        // Act
        ApiResponse<QuestionResponse> response = questionService.answerQuestion(1L, request, 3L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Question answered successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(QuestionStatus.ANSWERED, response.getData().getStatus());
        assertEquals("This is a professional answer from a consultant.", response.getData().getAnswer());
        assertEquals(3L, response.getData().getReplierId());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(3L);
        verify(questionRepository).save(any(Question.class));
    }

    @Test
    @DisplayName("Trả Lời Câu Hỏi - Không Tìm Thấy Câu Hỏi")
    void answerQuestion_QuestionNotFound() {
        // Arrange
        QuestionAnswerRequest request = new QuestionAnswerRequest();
        request.setAnswer("This is a professional answer.");

        when(questionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<QuestionResponse> response = questionService.answerQuestion(999L, request, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Question not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(999L);
        verify(userRepository, never()).findById(anyLong());
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Trả Lời Câu Hỏi - Không Tìm Thấy Người Dùng")
    void answerQuestion_UserNotFound() {
        // Arrange
        QuestionAnswerRequest request = new QuestionAnswerRequest();
        request.setAnswer("This is a professional answer.");

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<QuestionResponse> response = questionService.answerQuestion(1L, request, 999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(999L);
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Trả Lời Câu Hỏi - Không Phải Nhân Viên hoặc Tư Vấn Viên")
    void answerQuestion_NotStaffOrConsultant() {
        // Arrange
        QuestionAnswerRequest request = new QuestionAnswerRequest();
        request.setAnswer("This is a regular user attempting to answer.");

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.answerQuestion(1L, request, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only STAFF or CONSULTANT can answer questions", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(1L);
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Trả Lời Câu Hỏi - Không Ở Trạng Thái XÁC NHẬN")
    void answerQuestion_NotInConfirmedStatus() {
        // Arrange
        QuestionAnswerRequest request = new QuestionAnswerRequest();
        request.setAnswer("This is a professional answer.");

        // Question is still in PROCESSING status
        question.setStatus(QuestionStatus.PROCESSING);

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.answerQuestion(1L, request, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only questions in CONFIRMED status can be answered", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(questionRepository, never()).save(any(Question.class));
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo Trạng Thái - Thành Công")
    void getQuestionsByStatus_Success() {
        // Arrange
        Question question2 = new Question();
        question2.setQuestionId(2L);
        question2.setContent("Another question");
        question2.setCustomer(regularUser);
        question2.setCategoryQuestion(category);
        question2.setStatus(QuestionStatus.PROCESSING);
        question2.setCreatedAt(LocalDateTime.now());

        Page<Question> questionPage = new PageImpl<>(
                Arrays.asList(question, question2),
                pageable,
                2);

        when(questionRepository.findByStatus(QuestionStatus.PROCESSING, pageable)).thenReturn(questionPage);

        // Act
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByStatus(QuestionStatus.PROCESSING,
                pageable);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Questions retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().getTotalElements());

        // Verify
        verify(questionRepository).findByStatus(QuestionStatus.PROCESSING, pageable);
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo Danh Mục - Thành Công")
    void getQuestionsByCategory_Success() {
        // Arrange
        Question question2 = new Question();
        question2.setQuestionId(2L);
        question2.setContent("Another question in same category");
        question2.setCustomer(regularUser);
        question2.setCategoryQuestion(category);
        question2.setStatus(QuestionStatus.PROCESSING);
        question2.setCreatedAt(LocalDateTime.now());

        Page<Question> questionPage = new PageImpl<>(
                Arrays.asList(question, question2),
                pageable,
                2);

        when(categoryQuestionRepository.existsById(1L)).thenReturn(true);
        when(questionRepository.findByCategoryQuestion_CategoryQuestionId(1L, pageable)).thenReturn(questionPage);

        // Act
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByCategory(1L, pageable);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Questions retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().getTotalElements());

        // Verify
        verify(categoryQuestionRepository).existsById(1L);
        verify(questionRepository).findByCategoryQuestion_CategoryQuestionId(1L, pageable);
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo Danh Mục - Không Tìm Thấy Danh Mục")
    void getQuestionsByCategory_CategoryNotFound() {
        // Arrange
        when(categoryQuestionRepository.existsById(999L)).thenReturn(false);

        // Act
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByCategory(999L, pageable);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(categoryQuestionRepository).existsById(999L);
        verify(questionRepository, never()).findByCategoryQuestion_CategoryQuestionId(anyLong(), any(Pageable.class));
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo Người Dùng - Thành Công")
    void getQuestionsByUser_Success() {
        // Arrange
        Question question2 = new Question();
        question2.setQuestionId(2L);
        question2.setContent("Another question by same user");
        question2.setCustomer(regularUser);
        question2.setCategoryQuestion(category);
        question2.setStatus(QuestionStatus.PROCESSING);
        question2.setCreatedAt(LocalDateTime.now());

        Page<Question> questionPage = new PageImpl<>(
                Arrays.asList(question, question2),
                pageable,
                2);

        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));
        when(questionRepository.findByCustomer(regularUser, pageable)).thenReturn(questionPage);

        // Act
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByUser(1L, pageable);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Questions retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().getTotalElements());

        // Verify
        verify(userRepository).findById(1L);
        verify(questionRepository).findByCustomer(regularUser, pageable);
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo Người Dùng - Không Tìm Thấy Người Dùng")
    void getQuestionsByUser_UserNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<Page<QuestionResponse>> response = questionService.getQuestionsByUser(999L, pageable);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
        verify(questionRepository, never()).findByCustomer(any(UserDtls.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo ID - Truy Cập Của Chủ Sở Hữu Thành Công")
    void getQuestionById_OwnerAccess_Success() {
        // Arrange
        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.getQuestionById(1L, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Lấy thông tin câu hỏi thành công", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getId());
        assertEquals("How can I improve my mental health?", response.getData().getContent());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(1L);
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo ID - Truy Cập Của Nhân Viên Thành Công")
    void getQuestionById_StaffAccess_Success() {
        // Arrange
        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.getQuestionById(1L, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Lấy thông tin câu hỏi thành công", response.getMessage());
        assertNotNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(2L);
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo ID - Truy Cập Của Tư Vấn Viên Thành Công")
    void getQuestionById_ConsultantAccess_Success() {
        // Arrange
        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(3L)).thenReturn(Optional.of(consultantUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.getQuestionById(1L, 3L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Lấy thông tin câu hỏi thành công", response.getMessage());
        assertNotNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(3L);
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo ID - Truy Cập Không Được Phép")
    void getQuestionById_UnauthorizedAccess() {
        // Arrange
        UserDtls anotherUser = new UserDtls();
        anotherUser.setId(4L);
        anotherUser.setUsername("another");
        anotherUser.setRole(userRole); // Cập nhật: Sử dụng Role entity

        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(4L)).thenReturn(Optional.of(anotherUser));

        // Act
        ApiResponse<QuestionResponse> response = questionService.getQuestionById(1L, 4L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Bạn không có quyền xem câu hỏi này", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(4L);
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo ID - Không Tìm Thấy Câu Hỏi")
    void getQuestionById_QuestionNotFound() {
        // Arrange
        when(questionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<QuestionResponse> response = questionService.getQuestionById(999L, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Không tìm thấy câu hỏi"));
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(999L);
        verify(userRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("Lấy Câu Hỏi Theo ID - Không Tìm Thấy Người Dùng")
    void getQuestionById_UserNotFound() {
        // Arrange
        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<QuestionResponse> response = questionService.getQuestionById(1L, 999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Người dùng không hợp lệ", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(999L);
    }

    @Test
    @DisplayName("Xóa Câu Hỏi - Thành Công")
    void deleteQuestion_Success() {
        // Arrange
        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));
        doNothing().when(questionRepository).deleteById(1L);

        // Act
        ApiResponse<Void> response = questionService.deleteQuestion(1L, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Question deleted successfully", response.getMessage());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(questionRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Xóa Câu Hỏi - Không Tìm Thấy Câu Hỏi")
    void deleteQuestion_QuestionNotFound() {
        // Arrange
        when(questionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<Void> response = questionService.deleteQuestion(999L, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Question not found", response.getMessage());

        // Verify
        verify(questionRepository).findById(999L);
        verify(questionRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Xóa Câu Hỏi - Không Phải Nhân Viên")
    void deleteQuestion_NotStaff() {
        // Arrange
        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<Void> response = questionService.deleteQuestion(1L, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only STAFF can delete questions", response.getMessage());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(1L);
        verify(questionRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Xóa Câu Hỏi - Không Tìm Thấy Nhân Viên")
    void deleteQuestion_StaffNotFound() {
        // Arrange
        when(questionRepository.findById(1L)).thenReturn(Optional.of(question));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<Void> response = questionService.deleteQuestion(1L, 999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only STAFF can delete questions", response.getMessage());

        // Verify
        verify(questionRepository).findById(1L);
        verify(userRepository).findById(999L);
        verify(questionRepository, never()).deleteById(anyLong());
    }
}