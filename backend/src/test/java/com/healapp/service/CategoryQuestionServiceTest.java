package com.healapp.service;

import java.util.Arrays;
import java.util.List;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.CategoryQuestionRequest;
import com.healapp.dto.CategoryQuestionResponse;
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
public class CategoryQuestionServiceTest {

    @Mock
    private CategoryQuestionRepository categoryQuestionRepository;
    @Mock
    private UserRepository userRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private QuestionService questionService;

    @InjectMocks
    private CategoryQuestionService categoryQuestionService;

    private UserDtls adminUser;
    private UserDtls regularUser;
    private CategoryQuestion category;
    private CategoryQuestionRequest categoryRequest;
    
    // Cập nhật: Thêm Role entities
    private Role adminRole;
    private Role userRole;

    @BeforeEach
    void setUp() {
        // Cập nhật: Khởi tạo Role entities
        adminRole = new Role();
        adminRole.setRoleId(1L);
        adminRole.setRoleName("ADMIN");
        adminRole.setDescription("Administrator role");

        userRole = new Role();
        userRole.setRoleId(2L);
        userRole.setRoleName("USER");
        userRole.setDescription("Regular user role");

        // Cập nhật: Initialize admin user với Role entity
        adminUser = new UserDtls();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setFullName("Admin User");
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(adminRole); // Sử dụng Role entity thay vì String

        // Cập nhật: Initialize regular user với Role entity
        regularUser = new UserDtls();
        regularUser.setId(2L);
        regularUser.setUsername("user");
        regularUser.setFullName("Regular User");
        regularUser.setEmail("user@example.com");
        regularUser.setRole(userRole); // Sử dụng Role entity thay vì String

        // Initialize category
        category = new CategoryQuestion();
        category.setCategoryQuestionId(1L);
        category.setName("Mental Health");
        category.setDescription("Questions about mental health");

        // Initialize category request
        categoryRequest = new CategoryQuestionRequest();
        categoryRequest.setName("Mental Health");
        categoryRequest.setDescription("Questions about mental health");
    }

    @Test
    @DisplayName("Tạo Danh Mục - Thành Công")
    void createCategory_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.existsByName("Mental Health")).thenReturn(false);
        when(categoryQuestionRepository.save(any(CategoryQuestion.class))).thenReturn(category);

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.createCategory(categoryRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Category created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getCategoryQuestionId());
        assertEquals("Mental Health", response.getData().getName());
        assertEquals("Questions about mental health", response.getData().getDescription());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).existsByName("Mental Health");
        verify(categoryQuestionRepository).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Tạo Danh Mục - Không Phải Quản Trị Viên")
    void createCategory_NotAdmin() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.createCategory(categoryRequest, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN or STAFF can create categories", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(2L);
        verify(categoryQuestionRepository, never()).existsByName(anyString());
        verify(categoryQuestionRepository, never()).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Tạo Danh Mục - Không Tìm Thấy Quản Trị Viên")
    void createCategory_AdminNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.createCategory(categoryRequest, 999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN or STAFF can create categories", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
        verify(categoryQuestionRepository, never()).existsByName(anyString());
        verify(categoryQuestionRepository, never()).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Tạo Danh Mục - Tên Đã Tồn Tại")
    void createCategory_NameAlreadyExists() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.existsByName("Mental Health")).thenReturn(true);

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.createCategory(categoryRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category name already exists", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).existsByName("Mental Health");
        verify(categoryQuestionRepository, never()).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Tạo Danh Mục - Ngoại Lệ")
    void createCategory_Exception() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.existsByName("Mental Health")).thenReturn(false);
        when(categoryQuestionRepository.save(any(CategoryQuestion.class)))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.createCategory(categoryRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to create category"));
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).existsByName("Mental Health");
        verify(categoryQuestionRepository).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Cập Nhật Danh Mục - Thành Công")
    void updateCategory_Success() {
        // Arrange
        CategoryQuestionRequest updateRequest = new CategoryQuestionRequest();
        updateRequest.setName("Updated Mental Health");
        updateRequest.setDescription("Updated description");

        CategoryQuestion updatedCategory = new CategoryQuestion();
        updatedCategory.setCategoryQuestionId(1L);
        updatedCategory.setName("Updated Mental Health");
        updatedCategory.setDescription("Updated description");

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryQuestionRepository.existsByName("Updated Mental Health")).thenReturn(false);
        when(categoryQuestionRepository.save(any(CategoryQuestion.class))).thenReturn(updatedCategory);

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.updateCategory(1L, updateRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Category updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getCategoryQuestionId());
        assertEquals("Updated Mental Health", response.getData().getName());
        assertEquals("Updated description", response.getData().getDescription());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).findById(1L);
        verify(categoryQuestionRepository).existsByName("Updated Mental Health");
        verify(categoryQuestionRepository).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Cập Nhật Danh Mục - Không Phải Quản Trị Viên")
    void updateCategory_NotAdmin() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.updateCategory(1L, categoryRequest,
                2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN or STAFF can update categories", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(2L);
        verify(categoryQuestionRepository, never()).findById(anyLong());
        verify(categoryQuestionRepository, never()).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Cập Nhật Danh Mục - Không Tìm Thấy Quản Trị Viên")
    void updateCategory_AdminNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.updateCategory(1L, categoryRequest,
                999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN or STAFF can update categories", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
        verify(categoryQuestionRepository, never()).findById(anyLong());
        verify(categoryQuestionRepository, never()).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Cập Nhật Danh Mục - Không Tìm Thấy Danh Mục")
    void updateCategory_CategoryNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.updateCategory(999L, categoryRequest,
                1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).findById(999L);
        verify(categoryQuestionRepository, never()).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Cập Nhật Danh Mục - Tên Đã Tồn Tại")
    void updateCategory_NameAlreadyExists() {
        // Arrange
        CategoryQuestionRequest updateRequest = new CategoryQuestionRequest();
        updateRequest.setName("Existing Category");
        updateRequest.setDescription("Updated description");

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryQuestionRepository.existsByName("Existing Category")).thenReturn(true);

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.updateCategory(1L, updateRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category name already exists", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).findById(1L);
        verify(categoryQuestionRepository).existsByName("Existing Category");
        verify(categoryQuestionRepository, never()).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Cập Nhật Danh Mục - Cùng Tên")
    void updateCategory_SameName() {
        // Arrange
        // Using the same name as the existing category
        CategoryQuestionRequest updateRequest = new CategoryQuestionRequest();
        updateRequest.setName("Mental Health");
        updateRequest.setDescription("Updated description");

        CategoryQuestion updatedCategory = new CategoryQuestion();
        updatedCategory.setCategoryQuestionId(1L);
        updatedCategory.setName("Mental Health");
        updatedCategory.setDescription("Updated description");

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryQuestionRepository.save(any(CategoryQuestion.class))).thenReturn(updatedCategory);

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.updateCategory(1L, updateRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Category updated successfully", response.getMessage());
        assertNotNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).findById(1L);
        // existsByName should NOT be called since we're using the same name
        verify(categoryQuestionRepository, never()).existsByName(anyString());
        verify(categoryQuestionRepository).save(any(CategoryQuestion.class));
    }

    @Test
    @DisplayName("Xóa Danh Mục - Thành Công")
    void deleteCategory_Success() {
        // Arrange
        Question question1 = new Question();
        question1.setQuestionId(1L);
        question1.setStatus(QuestionStatus.PROCESSING);

        Question question2 = new Question();
        question2.setQuestionId(2L);
        question2.setStatus(QuestionStatus.CONFIRMED);

        Question question3 = new Question();
        question3.setQuestionId(3L);
        question3.setStatus(QuestionStatus.ANSWERED);

        Question question4 = new Question();
        question4.setQuestionId(4L);
        question4.setStatus(QuestionStatus.CANCELED);

        Page<Question> questionPage = new PageImpl<>(Arrays.asList(question1, question2, question3, question4));

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.existsById(1L)).thenReturn(true);
        when(questionRepository.findByCategoryQuestion_CategoryQuestionId(eq(1L), any(Pageable.class)))
                .thenReturn(questionPage);
        doNothing().when(categoryQuestionRepository).deleteById(1L);
        when(questionService.updateQuestionStatus(anyLong(), any(QuestionStatusRequest.class), anyLong()))
                .thenReturn(ApiResponse.success("Question status updated successfully"));

        // Act
        ApiResponse<Void> response = categoryQuestionService.deleteCategory(1L, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Category deleted successfully", response.getMessage());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).existsById(1L);
        verify(questionRepository).findByCategoryQuestion_CategoryQuestionId(eq(1L), any(Pageable.class));
        // Only questions in PROCESSING or CONFIRMED status should be canceled
        verify(questionService, times(1)).updateQuestionStatus(eq(1L), any(QuestionStatusRequest.class), eq(1L));
        verify(questionService, times(1)).updateQuestionStatus(eq(2L), any(QuestionStatusRequest.class), eq(1L));
        // Questions in ANSWERED or CANCELED status should not be updated
        verify(questionService, never()).updateQuestionStatus(eq(3L), any(QuestionStatusRequest.class), anyLong());
        verify(questionService, never()).updateQuestionStatus(eq(4L), any(QuestionStatusRequest.class), anyLong());
        verify(categoryQuestionRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Xóa Danh Mục - Không Phải Quản Trị Viên")
    void deleteCategory_NotAdmin() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<Void> response = categoryQuestionService.deleteCategory(1L, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN or STAFF can delete categories", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(2L);
        verify(categoryQuestionRepository, never()).existsById(anyLong());
        verify(categoryQuestionRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Xóa Danh Mục - Không Tìm Thấy Quản Trị Viên")
    void deleteCategory_AdminNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<Void> response = categoryQuestionService.deleteCategory(1L, 999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN or STAFF can delete categories", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
        verify(categoryQuestionRepository, never()).existsById(anyLong());
        verify(categoryQuestionRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Xóa Danh Mục - Không Tìm Thấy Danh Mục")
    void deleteCategory_CategoryNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.existsById(999L)).thenReturn(false);

        // Act
        ApiResponse<Void> response = categoryQuestionService.deleteCategory(999L, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category not found", response.getMessage());

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).existsById(999L);
        verify(questionRepository, never()).findByCategoryQuestion_CategoryQuestionId(anyLong(), any(Pageable.class));
        verify(questionService, never()).updateQuestionStatus(anyLong(), any(QuestionStatusRequest.class), anyLong());
        verify(categoryQuestionRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Xóa Danh Mục - Xử Lý Lỗi Khi Cập Nhật Câu Hỏi")
    void deleteCategory_ErrorUpdatingQuestions() {
        // Arrange
        Question question = new Question();
        question.setQuestionId(1L);
        question.setStatus(QuestionStatus.PROCESSING);

        Page<Question> questionPage = new PageImpl<>(Arrays.asList(question));

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryQuestionRepository.existsById(1L)).thenReturn(true);
        when(questionRepository.findByCategoryQuestion_CategoryQuestionId(eq(1L), any(Pageable.class)))
                .thenReturn(questionPage);
        // Return an error response instead of throwing exception
        when(questionService.updateQuestionStatus(anyLong(), any(QuestionStatusRequest.class), anyLong()))
                .thenReturn(ApiResponse.error("Không thể cập nhật trạng thái câu hỏi"));

        // Act
        ApiResponse<Void> response = categoryQuestionService.deleteCategory(1L, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to delete category"));
        assertTrue(response.getMessage().contains("Unable to update question #1"));

        // Verify
        verify(userRepository).findById(1L);
        verify(categoryQuestionRepository).existsById(1L);
        verify(questionRepository).findByCategoryQuestion_CategoryQuestionId(eq(1L), any(Pageable.class));
        verify(questionService).updateQuestionStatus(eq(1L), any(QuestionStatusRequest.class), eq(1L));
        verify(categoryQuestionRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Lấy Tất Cả Danh Mục - Thành Công")
    void getAllCategories_Success() {
        // Arrange
        CategoryQuestion category2 = new CategoryQuestion();
        category2.setCategoryQuestionId(2L);
        category2.setName("Physical Health");
        category2.setDescription("Questions about physical health");

        List<CategoryQuestion> categories = Arrays.asList(category, category2);

        when(categoryQuestionRepository.findAll()).thenReturn(categories);

        // Act
        ApiResponse<List<CategoryQuestionResponse>> response = categoryQuestionService.getAllCategories();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Categories retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().size());
        assertEquals("Mental Health", response.getData().get(0).getName());
        assertEquals("Physical Health", response.getData().get(1).getName());

        // Verify
        verify(categoryQuestionRepository).findAll();
    }

    @Test
    @DisplayName("Lấy Tất Cả Danh Mục - Danh Sách Trống")
    void getAllCategories_EmptyList() {
        // Arrange
        List<CategoryQuestion> categories = Arrays.asList();

        when(categoryQuestionRepository.findAll()).thenReturn(categories);

        // Act
        ApiResponse<List<CategoryQuestionResponse>> response = categoryQuestionService.getAllCategories();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Categories retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertTrue(response.getData().isEmpty());

        // Verify
        verify(categoryQuestionRepository).findAll();
    }

    @Test
    @DisplayName("Lấy Tất Cả Danh Mục - Ngoại Lệ")
    void getAllCategories_Exception() {
        // Arrange
        when(categoryQuestionRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<List<CategoryQuestionResponse>> response = categoryQuestionService.getAllCategories();

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to retrieve categories"));
        assertNull(response.getData());

        // Verify
        verify(categoryQuestionRepository).findAll();
    }

    @Test
    @DisplayName("Lấy Danh Mục Theo ID - Thành Công")
    void getCategoryById_Success() {
        // Arrange
        when(categoryQuestionRepository.findById(1L)).thenReturn(Optional.of(category));

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.getCategoryById(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Category retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getCategoryQuestionId());
        assertEquals("Mental Health", response.getData().getName());
        assertEquals("Questions about mental health", response.getData().getDescription());

        // Verify
        verify(categoryQuestionRepository).findById(1L);
    }

    @Test
    @DisplayName("Lấy Danh Mục Theo ID - Không Tìm Thấy")
    void getCategoryById_NotFound() {
        // Arrange
        when(categoryQuestionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.getCategoryById(999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(categoryQuestionRepository).findById(999L);
    }

    @Test
    @DisplayName("Lấy Danh Mục Theo ID - Ngoại Lệ")
    void getCategoryById_Exception() {
        // Arrange
        when(categoryQuestionRepository.findById(1L)).thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<CategoryQuestionResponse> response = categoryQuestionService.getCategoryById(1L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to retrieve category"));
        assertNull(response.getData());

        // Verify
        verify(categoryQuestionRepository).findById(1L);
    }
}