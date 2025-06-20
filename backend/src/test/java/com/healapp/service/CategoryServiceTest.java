package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.CategoryRequest;
import com.healapp.model.BlogPost;
import com.healapp.model.BlogPostStatus;
import com.healapp.model.Category;
import com.healapp.model.UserDtls;
import com.healapp.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category category;
    private CategoryRequest categoryRequest;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setCategoryId(1L);
        category.setName("Health Tips");
        category.setDescription("Tips for maintaining good health");

        categoryRequest = new CategoryRequest();
        categoryRequest.setName("Health Tips");
        categoryRequest.setDescription("Tips for maintaining good health");
    }

    @Test
    @DisplayName("Tạo category thành công")
    void createCategory_WithValidData_ShouldSucceed() {
        // Arrange
        when(categoryRepository.existsByName("Health Tips")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(category);

        // Act
        ApiResponse<Category> response = categoryService.createCategory(categoryRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Category created successfully", response.getMessage());
        assertEquals(category, response.getData());

        // Verify
        verify(categoryRepository).existsByName("Health Tips");

        ArgumentCaptor<Category> categoryCaptor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(categoryCaptor.capture());

        Category savedCategory = categoryCaptor.getValue();
        assertEquals("Health Tips", savedCategory.getName());
        assertEquals("Tips for maintaining good health", savedCategory.getDescription());
    }

    @Test
    @DisplayName("Tạo category thất bại khi tên đã tồn tại")
    void createCategory_WithExistingName_ShouldFail() {
        // Arrange
        when(categoryRepository.existsByName("Health Tips")).thenReturn(true);

        // Act
        ApiResponse<Category> response = categoryService.createCategory(categoryRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category with this name already exists", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(categoryRepository).existsByName("Health Tips");
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    @DisplayName("Cập nhật category thành công")
    void updateCategory_WithValidData_ShouldSucceed() {
        // Arrange
        CategoryRequest updatedRequest = new CategoryRequest();
        updatedRequest.setName("Updated Health Tips");
        updatedRequest.setDescription("Updated description");

        Category updatedCategory = new Category();
        updatedCategory.setCategoryId(1L);
        updatedCategory.setName("Updated Health Tips");
        updatedCategory.setDescription("Updated description");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.existsByName("Updated Health Tips")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(updatedCategory);

        // Act
        ApiResponse<Category> response = categoryService.updateCategory(1L, updatedRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Category updated successfully", response.getMessage());
        assertEquals(updatedCategory, response.getData());

        // Verify
        verify(categoryRepository).findById(1L);
        verify(categoryRepository).existsByName("Updated Health Tips");

        ArgumentCaptor<Category> categoryCaptor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(categoryCaptor.capture());

        Category savedCategory = categoryCaptor.getValue();
        assertEquals("Updated Health Tips", savedCategory.getName());
        assertEquals("Updated description", savedCategory.getDescription());
    }

    @Test
    @DisplayName("Cập nhật category thất bại khi không tìm thấy")
    void updateCategory_WithNonExistentId_ShouldFail() {
        // Arrange
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<Category> response = categoryService.updateCategory(1L, categoryRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(categoryRepository).findById(1L);
        verify(categoryRepository, never()).existsByName(anyString());
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    @DisplayName("Xóa category thành công và hủy các bài viết liên quan")
    void deleteCategory_WithExistingId_ShouldSucceedAndCancelRelatedPosts() {
        // Arrange
        Category mockCategory = new Category();
        mockCategory.setCategoryId(1L);
        mockCategory.setName("Health Tips");
        mockCategory.setDescription("Tips for maintaining good health");

        // Tạo danh sách giả các bài viết thuộc category
        List<BlogPost> blogPosts = Arrays.asList(
                createBlogPost(1L, "Post 1", mockCategory),
                createBlogPost(2L, "Post 2", mockCategory));
        mockCategory.setPosts(blogPosts);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(mockCategory);
        doNothing().when(categoryRepository).deleteById(1L);

        // Act
        ApiResponse<String> response = categoryService.deleteCategory(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage()
                .contains("Category deleted successfully and 2 related blog posts have been canceled"));
        assertNull(response.getData());

        // Verify
        verify(categoryRepository).findById(1L);
        verify(categoryRepository).save(any(Category.class));
        verify(categoryRepository).deleteById(1L);

        // Verify all posts are updated to CANCELED status
        for (BlogPost post : mockCategory.getPosts()) {
            assertEquals(BlogPostStatus.CANCELED, post.getStatus());
            assertNotNull(post.getRejectionReason());
            assertTrue(post.getRejectionReason().contains("Category 'Health Tips' has been deleted"));
        }
    }

    @Test
    @DisplayName("Xóa category thành công khi không có bài viết liên quan")
    void deleteCategory_WithExistingIdAndNoPosts_ShouldSucceed() {
        // Arrange
        Category mockCategory = new Category();
        mockCategory.setCategoryId(1L);
        mockCategory.setName("Health Tips");
        mockCategory.setDescription("Tips for maintaining good health");
        mockCategory.setPosts(new ArrayList<>()); // Empty list of posts

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(mockCategory);
        doNothing().when(categoryRepository).deleteById(1L);

        // Act
        ApiResponse<String> response = categoryService.deleteCategory(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage()
                .contains("Category deleted successfully and 0 related blog posts have been canceled"));
        assertNull(response.getData());

        // Verify
        verify(categoryRepository).findById(1L);
        verify(categoryRepository).save(any(Category.class));
        verify(categoryRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Xóa category thất bại khi không tìm thấy")
    void deleteCategory_WithNonExistentId_ShouldFail() {
        // Arrange
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = categoryService.deleteCategory(1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(categoryRepository).findById(1L);
        verify(categoryRepository, never()).save(any(Category.class));
        verify(categoryRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Lấy tất cả categories thành công")
    void getAllCategories_ShouldReturnAllCategories() {
        // Arrange
        Category category2 = new Category();
        category2.setCategoryId(2L);
        category2.setName("Nutrition");
        category2.setDescription("Nutrition information");

        List<Category> categories = Arrays.asList(category, category2);
        when(categoryRepository.findAll()).thenReturn(categories);

        // Act
        ApiResponse<List<Category>> response = categoryService.getAllCategories();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Categories retrieved successfully", response.getMessage());
        assertEquals(2, response.getData().size());
        assertEquals(categories, response.getData());

        // Verify
        verify(categoryRepository).findAll();
    }

    /**
     * Helper method to create a mock BlogPost
     */
    private BlogPost createBlogPost(Long postId, String title, Category category) {
        BlogPost blogPost = new BlogPost();
        blogPost.setPostId(postId);
        blogPost.setTitle(title);
        blogPost.setContent("Test content");
        blogPost.setStatus(BlogPostStatus.CONFIRMED);
        blogPost.setCategory(category);
        blogPost.setCreatedAt(LocalDateTime.now());

        // Set author (required field)
        UserDtls author = new UserDtls();
        author.setId(1L);
        author.setUsername("testuser");
        blogPost.setAuthor(author);

        return blogPost;
    }
}