package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.BlogPostRequest;
import com.healapp.dto.BlogPostResponse;
import com.healapp.dto.BlogPostStatusRequest;
import com.healapp.dto.BlogSectionRequest;
import com.healapp.dto.BlogSectionResponse;
import com.healapp.model.BlogPost;
import com.healapp.model.BlogPostStatus;
import com.healapp.model.BlogSection;
import com.healapp.model.Category;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.BlogPostRepository;
import com.healapp.repository.BlogSectionRepository;
import com.healapp.repository.CategoryRepository;
import com.healapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BlogPostServiceTest {
    @Mock
    private BlogPostRepository blogPostRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BlogSectionRepository blogSectionRepository;

    @InjectMocks
    private BlogPostService blogPostService;

    private BlogPostRequest blogPostRequest;
    private BlogPost blogPost;
    private Category category;
    private UserDtls adminUser;
    private UserDtls staffUser;
    private UserDtls regularUser;
    private UserDtls consultantUser;

    // Cập nhật: Thêm Role entities
    private Role adminRole;
    private Role staffRole;
    private Role userRole;
    private Role consultantRole;

    @BeforeEach
    void setUp() {
        // Cập nhật: Khởi tạo Role entities
        adminRole = new Role();
        adminRole.setRoleId(1L);
        adminRole.setRoleName("ADMIN");
        adminRole.setDescription("Administrator role");

        staffRole = new Role();
        staffRole.setRoleId(2L);
        staffRole.setRoleName("STAFF");
        staffRole.setDescription("Staff role");

        userRole = new Role();
        userRole.setRoleId(3L);
        userRole.setRoleName("CUSTOMER");
        userRole.setDescription("Regular user role");

        consultantRole = new Role();
        consultantRole.setRoleId(4L);
        consultantRole.setRoleName("CONSULTANT");
        consultantRole.setDescription("Consultant role");

        // Khởi tạo category
        category = new Category();
        category.setCategoryId(1L);
        category.setName("Health Tips");
        category.setDescription("Tips for maintaining good health");

        // Cập nhật: Khởi tạo users với Role entities thay vì String
        adminUser = new UserDtls();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setFullName("Admin User");
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(adminRole); // Sử dụng Role entity
        adminUser.setAvatar("/img/avatar/admin.jpg");

        staffUser = new UserDtls();
        staffUser.setId(2L);
        staffUser.setUsername("staff");
        staffUser.setFullName("Staff User");
        staffUser.setEmail("staff@example.com");
        staffUser.setRole(staffRole); // Sử dụng Role entity
        staffUser.setAvatar("/img/avatar/staff.jpg");

        regularUser = new UserDtls();
        regularUser.setId(3L);
        regularUser.setUsername("user");
        regularUser.setFullName("Regular User");
        regularUser.setEmail("user@example.com");
        regularUser.setRole(userRole); // Sử dụng Role entity
        regularUser.setAvatar("/img/avatar/user.jpg");

        consultantUser = new UserDtls();
        consultantUser.setId(4L);
        consultantUser.setUsername("consultant");
        consultantUser.setFullName("Consultant User");
        consultantUser.setEmail("consultant@example.com");
        consultantUser.setRole(consultantRole); // Sử dụng Role entity
        consultantUser.setAvatar("/img/avatar/consultant.jpg");

        // Khởi tạo blog post request
        blogPostRequest = new BlogPostRequest();
        blogPostRequest.setTitle("10 Tips for Better Sleep");
        blogPostRequest.setContent("Getting good sleep is essential for health...");
        blogPostRequest.setCategoryId(1L);
        blogPostRequest.setThumbnailImage("/img/blog/sleep-tips.jpg");

        // Khởi tạo blog post
        blogPost = new BlogPost();
        blogPost.setPostId(1L);
        blogPost.setTitle("10 Tips for Better Sleep");
        blogPost.setContent("Getting good sleep is essential for health...");
        blogPost.setThumbnailImage("/img/blog/sleep-tips.jpg");
        blogPost.setCategory(category);
        blogPost.setAuthor(adminUser);
        blogPost.setCreatedAt(LocalDateTime.now());
        blogPost.setStatus(BlogPostStatus.CONFIRMED); // Admin post tự động CONFIRMED
        blogPost.setReviewer(adminUser);
        blogPost.setReviewedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Tạo blog post thành công với quyền ADMIN - tự động CONFIRMED")
    void createPost_WithAdminRole_ShouldBeConfirmed() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(blogPostRepository.save(any(BlogPost.class))).thenReturn(blogPost);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.createPost(blogPostRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(BlogPostStatus.CONFIRMED, response.getData().getStatus());
        assertNotNull(response.getData().getReviewedAt());
        assertEquals(adminUser.getId(), response.getData().getReviewerId());

        // Verify
        ArgumentCaptor<BlogPost> blogPostCaptor = ArgumentCaptor.forClass(BlogPost.class);
        verify(blogPostRepository).save(blogPostCaptor.capture());
        BlogPost savedPost = blogPostCaptor.getValue();
        assertEquals(BlogPostStatus.CONFIRMED, savedPost.getStatus());
        assertNotNull(savedPost.getReviewer());
        assertNotNull(savedPost.getReviewedAt());
    }

    @Test
    @DisplayName("Tạo blog post thành công với quyền STAFF - tự động CONFIRMED")
    void createPost_WithStaffRole_ShouldBeConfirmed() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        BlogPost staffBlogPost = new BlogPost();
        staffBlogPost.setPostId(1L);
        staffBlogPost.setTitle("10 Tips for Better Sleep");
        staffBlogPost.setContent("Getting good sleep is essential for health...");
        staffBlogPost.setCategory(category);
        staffBlogPost.setAuthor(staffUser);
        staffBlogPost.setCreatedAt(LocalDateTime.now());
        staffBlogPost.setStatus(BlogPostStatus.CONFIRMED);
        staffBlogPost.setReviewer(staffUser);
        staffBlogPost.setReviewedAt(LocalDateTime.now());

        when(blogPostRepository.save(any(BlogPost.class))).thenReturn(staffBlogPost);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.createPost(blogPostRequest, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(BlogPostStatus.CONFIRMED, response.getData().getStatus());
        assertNotNull(response.getData().getReviewedAt());
        assertEquals(staffUser.getId(), response.getData().getReviewerId());

        // Verify
        ArgumentCaptor<BlogPost> blogPostCaptor = ArgumentCaptor.forClass(BlogPost.class);
        verify(blogPostRepository).save(blogPostCaptor.capture());
        BlogPost savedPost = blogPostCaptor.getValue();
        assertEquals(BlogPostStatus.CONFIRMED, savedPost.getStatus());
    }

    @Test
    @DisplayName("Tạo blog post thành công với quyền CUSTOMER - trạng thái PROCESSING")
    void createPost_WithUserRole_ShouldBeProcessing() {
        // Arrange
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularUser));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        BlogPost userBlogPost = new BlogPost();
        userBlogPost.setPostId(1L);
        userBlogPost.setTitle("10 Tips for Better Sleep");
        userBlogPost.setContent("Getting good sleep is essential for health...");
        userBlogPost.setCategory(category);
        userBlogPost.setAuthor(regularUser);
        userBlogPost.setCreatedAt(LocalDateTime.now());
        userBlogPost.setStatus(BlogPostStatus.PROCESSING); // User post đang chờ duyệt

        when(blogPostRepository.save(any(BlogPost.class))).thenReturn(userBlogPost);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.createPost(blogPostRequest, 3L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(BlogPostStatus.PROCESSING, response.getData().getStatus());
        assertNull(response.getData().getReviewerId());
        assertNull(response.getData().getReviewedAt());

        // Verify
        ArgumentCaptor<BlogPost> blogPostCaptor = ArgumentCaptor.forClass(BlogPost.class);
        verify(blogPostRepository).save(blogPostCaptor.capture());
        BlogPost savedPost = blogPostCaptor.getValue();
        assertEquals(BlogPostStatus.PROCESSING, savedPost.getStatus());
        assertNull(savedPost.getReviewer());
        assertNull(savedPost.getReviewedAt());
    }

    @Test
    @DisplayName("Tạo blog post thành công với quyền CONSULTANT - trạng thái PROCESSING")
    void createPost_WithConsultantRole_ShouldBeProcessing() {
        // Arrange
        when(userRepository.findById(4L)).thenReturn(Optional.of(consultantUser));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        BlogPost consultantBlogPost = new BlogPost();
        consultantBlogPost.setPostId(1L);
        consultantBlogPost.setTitle("10 Tips for Better Sleep");
        consultantBlogPost.setContent("Getting good sleep is essential for health...");
        consultantBlogPost.setCategory(category);
        consultantBlogPost.setAuthor(consultantUser);
        consultantBlogPost.setCreatedAt(LocalDateTime.now());
        consultantBlogPost.setStatus(BlogPostStatus.PROCESSING); // Consultant post đang chờ duyệt

        when(blogPostRepository.save(any(BlogPost.class))).thenReturn(consultantBlogPost);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.createPost(blogPostRequest, 4L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(BlogPostStatus.PROCESSING, response.getData().getStatus());
        assertNull(response.getData().getReviewerId());
        assertNull(response.getData().getReviewedAt());

        // Verify
        ArgumentCaptor<BlogPost> blogPostCaptor = ArgumentCaptor.forClass(BlogPost.class);
        verify(blogPostRepository).save(blogPostCaptor.capture());
        BlogPost savedPost = blogPostCaptor.getValue();
        assertEquals(BlogPostStatus.PROCESSING, savedPost.getStatus());
        assertNull(savedPost.getReviewer());
        assertNull(savedPost.getReviewedAt());
    }

    @Test
    @DisplayName("Tạo blog post thất bại khi tác giả không tồn tại")
    void createPost_WithNonExistentAuthor_ShouldFail() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.createPost(blogPostRequest, 999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Author not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(blogPostRepository, never()).save(any(BlogPost.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái blog post thành công với quyền STAFF - CONFIRMED")
    void updatePostStatus_AsStaff_ToConfirmed_ShouldSucceed() {
        // Arrange
        BlogPost processingPost = new BlogPost();
        processingPost.setPostId(1L);
        processingPost.setTitle("Pending Post");
        processingPost.setContent("Content needs review");
        processingPost.setCategory(category);
        processingPost.setAuthor(regularUser);
        processingPost.setCreatedAt(LocalDateTime.now().minusDays(1));
        processingPost.setStatus(BlogPostStatus.PROCESSING);

        BlogPostStatusRequest statusRequest = new BlogPostStatusRequest();
        statusRequest.setStatus(BlogPostStatus.CONFIRMED);

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(processingPost));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));

        BlogPost confirmedPost = new BlogPost();
        confirmedPost.setPostId(1L);
        confirmedPost.setTitle("Pending Post");
        confirmedPost.setContent("Content needs review");
        confirmedPost.setCategory(category);
        confirmedPost.setAuthor(regularUser);
        confirmedPost.setCreatedAt(processingPost.getCreatedAt());
        confirmedPost.setStatus(BlogPostStatus.CONFIRMED);
        confirmedPost.setReviewer(staffUser);
        confirmedPost.setReviewedAt(LocalDateTime.now());

        when(blogPostRepository.save(any(BlogPost.class))).thenReturn(confirmedPost);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.updatePostStatus(1L, statusRequest, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post status updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(BlogPostStatus.CONFIRMED, response.getData().getStatus());
        assertEquals(staffUser.getId(), response.getData().getReviewerId());
        assertEquals(staffUser.getFullName(), response.getData().getReviewerName());
        assertNotNull(response.getData().getReviewedAt());
        assertNull(response.getData().getRejectionReason());

        // Verify
        verify(blogPostRepository).findById(1L);
        verify(userRepository).findById(2L);

        ArgumentCaptor<BlogPost> blogPostCaptor = ArgumentCaptor.forClass(BlogPost.class);
        verify(blogPostRepository).save(blogPostCaptor.capture());

        BlogPost savedPost = blogPostCaptor.getValue();
        assertEquals(BlogPostStatus.CONFIRMED, savedPost.getStatus());
        assertEquals(staffUser, savedPost.getReviewer());
        assertNotNull(savedPost.getReviewedAt());
        assertNull(savedPost.getRejectionReason());
    }

    @Test
    @DisplayName("Cập nhật trạng thái blog post thành công với quyền STAFF - CANCELED")
    void updatePostStatus_AsStaff_ToCanceled_WithReason_ShouldSucceed() {
        // Arrange
        BlogPost processingPost = new BlogPost();
        processingPost.setPostId(1L);
        processingPost.setTitle("Pending Post");
        processingPost.setContent("Content needs review");
        processingPost.setCategory(category);
        processingPost.setAuthor(regularUser);
        processingPost.setCreatedAt(LocalDateTime.now().minusDays(1));
        processingPost.setStatus(BlogPostStatus.PROCESSING);

        BlogPostStatusRequest statusRequest = new BlogPostStatusRequest();
        statusRequest.setStatus(BlogPostStatus.CANCELED);
        statusRequest.setRejectionReason("This post violates our content policy");

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(processingPost));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));

        BlogPost canceledPost = new BlogPost();
        canceledPost.setPostId(1L);
        canceledPost.setTitle("Pending Post");
        canceledPost.setContent("Content needs review");
        canceledPost.setCategory(category);
        canceledPost.setAuthor(regularUser);
        canceledPost.setCreatedAt(processingPost.getCreatedAt());
        canceledPost.setStatus(BlogPostStatus.CANCELED);
        canceledPost.setReviewer(staffUser);
        canceledPost.setReviewedAt(LocalDateTime.now());
        canceledPost.setRejectionReason("This post violates our content policy");

        when(blogPostRepository.save(any(BlogPost.class))).thenReturn(canceledPost);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.updatePostStatus(1L, statusRequest, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post status updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(BlogPostStatus.CANCELED, response.getData().getStatus());
        assertEquals(staffUser.getId(), response.getData().getReviewerId());
        assertNotNull(response.getData().getReviewedAt());
        assertEquals("This post violates our content policy", response.getData().getRejectionReason());

        // Verify
        ArgumentCaptor<BlogPost> blogPostCaptor = ArgumentCaptor.forClass(BlogPost.class);
        verify(blogPostRepository).save(blogPostCaptor.capture());

        BlogPost savedPost = blogPostCaptor.getValue();
        assertEquals(BlogPostStatus.CANCELED, savedPost.getStatus());
        assertEquals("This post violates our content policy", savedPost.getRejectionReason());
    }

    @Test
    @DisplayName("Cập nhật trạng thái blog post thất bại khi không có lý do từ chối")
    void updatePostStatus_ToCanceled_WithoutReason_ShouldFail() {
        // Arrange
        BlogPost processingPost = new BlogPost();
        processingPost.setPostId(1L);
        processingPost.setTitle("Pending Post");
        processingPost.setContent("Content needs review");
        processingPost.setCategory(category);
        processingPost.setAuthor(regularUser);
        processingPost.setCreatedAt(LocalDateTime.now().minusDays(1));
        processingPost.setStatus(BlogPostStatus.PROCESSING);

        BlogPostStatusRequest statusRequest = new BlogPostStatusRequest();
        statusRequest.setStatus(BlogPostStatus.CANCELED);
        // Không có rejection reason

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(processingPost));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffUser));

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.updatePostStatus(1L, statusRequest, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Rejection reason is required when canceling a post", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(blogPostRepository, never()).save(any(BlogPost.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái blog post thất bại khi người dùng không có quyền")
    void updatePostStatus_AsRegularUser_ShouldFail() {
        // Arrange
        BlogPost processingPost = new BlogPost();
        processingPost.setPostId(1L);
        processingPost.setAuthor(regularUser);
        processingPost.setStatus(BlogPostStatus.PROCESSING);

        BlogPostStatusRequest statusRequest = new BlogPostStatusRequest();
        statusRequest.setStatus(BlogPostStatus.CONFIRMED);

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(processingPost));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.updatePostStatus(1L, statusRequest, 3L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only STAFF or ADMIN can update blog post status", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(blogPostRepository, never()).save(any(BlogPost.class));
    }

    @Test
    @DisplayName("Lấy các bài viết theo trạng thái CONFIRMED")
    void getPostsByStatus_Confirmed_ShouldReturnConfirmedPosts() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        BlogPost confirmedPost = new BlogPost();
        confirmedPost.setPostId(1L);
        confirmedPost.setTitle("Confirmed Post");
        confirmedPost.setContent("This post is confirmed");
        confirmedPost.setCategory(category);
        confirmedPost.setAuthor(regularUser);
        confirmedPost.setStatus(BlogPostStatus.CONFIRMED);
        confirmedPost.setReviewer(staffUser);
        confirmedPost.setReviewedAt(LocalDateTime.now());

        List<BlogPost> posts = Arrays.asList(confirmedPost);
        Page<BlogPost> postPage = new PageImpl<>(posts, pageable, posts.size());

        when(blogPostRepository.findByStatus(BlogPostStatus.CONFIRMED, pageable)).thenReturn(postPage);

        // Act
        ApiResponse<Page<BlogPostResponse>> response = blogPostService.getPostsByStatus(BlogPostStatus.CONFIRMED,
                pageable);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog posts retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().getContent().size());
        assertEquals("Confirmed Post", response.getData().getContent().get(0).getTitle());
        assertEquals(BlogPostStatus.CONFIRMED, response.getData().getContent().get(0).getStatus());

        // Verify
        verify(blogPostRepository).findByStatus(BlogPostStatus.CONFIRMED, pageable);
    }

    @Test
    @DisplayName("Lấy các bài viết đang chờ duyệt")
    void getPendingPosts_ShouldReturnProcessingPosts() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        BlogPost pendingPost1 = new BlogPost();
        pendingPost1.setPostId(1L);
        pendingPost1.setTitle("Pending Post 1");
        pendingPost1.setContent("This post is pending");
        pendingPost1.setCategory(category);
        pendingPost1.setAuthor(regularUser);
        pendingPost1.setStatus(BlogPostStatus.PROCESSING);

        BlogPost pendingPost2 = new BlogPost();
        pendingPost2.setPostId(2L);
        pendingPost2.setTitle("Pending Post 2");
        pendingPost2.setContent("This post is also pending");
        pendingPost2.setCategory(category);
        pendingPost2.setAuthor(consultantUser);
        pendingPost2.setStatus(BlogPostStatus.PROCESSING);

        List<BlogPost> posts = Arrays.asList(pendingPost1, pendingPost2);
        Page<BlogPost> postPage = new PageImpl<>(posts, pageable, posts.size());

        when(blogPostRepository.findByStatus(BlogPostStatus.PROCESSING, pageable)).thenReturn(postPage);

        // Act
        ApiResponse<Page<BlogPostResponse>> response = blogPostService.getProcessingPosts(pageable);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog posts retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().getContent().size());
        assertEquals("Pending Post 1", response.getData().getContent().get(0).getTitle());
        assertEquals("Pending Post 2", response.getData().getContent().get(1).getTitle());
        assertEquals(BlogPostStatus.PROCESSING, response.getData().getContent().get(0).getStatus());

        // Verify
        verify(blogPostRepository).findByStatus(BlogPostStatus.PROCESSING, pageable);
    }

    @Test
    @DisplayName("Cập nhật blog post thất bại khi bài viết đã được duyệt (CONFIRMED)")
    void updatePost_ConfirmedPost_ShouldFail() {
        // Arrange
        BlogPost confirmedPost = new BlogPost();
        confirmedPost.setPostId(1L);
        confirmedPost.setTitle("Confirmed Post");
        confirmedPost.setContent("This is a confirmed post");
        confirmedPost.setCategory(category);
        confirmedPost.setAuthor(regularUser);
        confirmedPost.setStatus(BlogPostStatus.CONFIRMED);
        confirmedPost.setReviewer(staffUser);
        confirmedPost.setReviewedAt(LocalDateTime.now().minusDays(1));

        BlogPostRequest updateRequest = new BlogPostRequest();
        updateRequest.setTitle("Try to Update Confirmed Post");
        updateRequest.setContent("Trying to update confirmed post");
        updateRequest.setCategoryId(1L);

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(confirmedPost));

        // Act - tác giả cập nhật bài đã được duyệt
        ApiResponse<BlogPostResponse> response = blogPostService.updatePost(1L, updateRequest, 3L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Confirmed posts cannot be edited", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(blogPostRepository, never()).save(any(BlogPost.class));
    }

    @Test
    @DisplayName("Cập nhật blog post thất bại khi không tìm thấy bài viết")
    void updatePost_PostNotFound_ShouldFail() {
        // Arrange
        BlogPostRequest updateRequest = new BlogPostRequest();
        updateRequest.setTitle("Update Non-existent Post");
        updateRequest.setContent("Trying to update non-existent post");
        updateRequest.setCategoryId(1L);

        when(blogPostRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.updatePost(999L, updateRequest, 3L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Blog post not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(blogPostRepository, never()).save(any(BlogPost.class));
    }

    @Test
    @DisplayName("Cập nhật blog post thất bại khi không tìm thấy danh mục")
    void updatePost_CategoryNotFound_ShouldFail() {
        // Arrange
        BlogPost existingPost = new BlogPost();
        existingPost.setPostId(1L);
        existingPost.setTitle("Original Title");
        existingPost.setContent("Original Content");
        existingPost.setCategory(category);
        existingPost.setAuthor(regularUser);
        existingPost.setStatus(BlogPostStatus.PROCESSING);

        BlogPostRequest updateRequest = new BlogPostRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setContent("Updated Content");
        updateRequest.setCategoryId(999L); // Danh mục không tồn tại

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(existingPost));
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.updatePost(1L, updateRequest, 3L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Category not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(blogPostRepository, never()).save(any(BlogPost.class));
    }

    @Test
    @DisplayName("Cập nhật blog post thất bại khi người dùng không phải tác giả")
    void updatePost_NonAuthor_ShouldFail() {
        // Arrange
        BlogPost existingPost = new BlogPost();
        existingPost.setPostId(1L);
        existingPost.setTitle("Original Title");
        existingPost.setContent("Original Content");
        existingPost.setCategory(category);
        existingPost.setAuthor(regularUser); // tác giả là regularUser (ID=3)
        existingPost.setStatus(BlogPostStatus.PROCESSING);

        BlogPostRequest updateRequest = new BlogPostRequest();
        updateRequest.setTitle("Staff Trying to Update");
        updateRequest.setContent("Staff updating someone's post");
        updateRequest.setCategoryId(1L);

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(existingPost));

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.updatePost(1L, updateRequest, 2L); // Staff (ID=2) cập
                                                                                                    // nhật bài viết của
                                                                                                    // regularUser
                                                                                                    // (ID=3)

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only the author can update this post", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(blogPostRepository, never()).save(any(BlogPost.class));
    }

    @Test
    @DisplayName("Cập nhật blog post thành công với quyền tác giả - đưa về PROCESSING")
    void updatePost_AsAuthor_ShouldResetToProcessing() {
        // Arrange
        BlogPost existingPost = new BlogPost();
        existingPost.setPostId(1L);
        existingPost.setTitle("Original Title");
        existingPost.setContent("Original Content");
        existingPost.setThumbnailImage("/img/blog/original.jpg");
        existingPost.setCategory(category);
        existingPost.setAuthor(regularUser);
        existingPost.setCreatedAt(LocalDateTime.now().minusDays(1));
        existingPost.setStatus(BlogPostStatus.PROCESSING); // Bài chưa được duyệt

        BlogPostRequest updateRequest = new BlogPostRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setContent("Updated Content");
        updateRequest.setThumbnailImage("/img/blog/updated.jpg");
        updateRequest.setCategoryId(1L);

        // Add sections to update request
        List<BlogSectionRequest> sections = new ArrayList<>();
        BlogSectionRequest section = new BlogSectionRequest();
        section.setSectionTitle("New Section");
        section.setSectionContent("New section content");
        section.setDisplayOrder(1);
        sections.add(section);
        updateRequest.setSections(sections);

        // Mock existing sections to be deleted
        List<BlogSection> existingSections = new ArrayList<>();
        BlogSection oldSection = new BlogSection();
        oldSection.setSectionId(1L);
        oldSection.setBlogPost(existingPost);
        existingSections.add(oldSection);

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(existingPost));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(blogSectionRepository.findByBlogPostPostIdOrderByDisplayOrder(1L)).thenReturn(existingSections);

        BlogPost updatedPost = new BlogPost();
        updatedPost.setPostId(1L);
        updatedPost.setTitle("Updated Title");
        updatedPost.setContent("Updated Content");
        updatedPost.setThumbnailImage("/img/blog/updated.jpg");
        updatedPost.setCategory(category);
        updatedPost.setAuthor(regularUser);
        updatedPost.setCreatedAt(existingPost.getCreatedAt());
        updatedPost.setUpdatedAt(LocalDateTime.now());
        updatedPost.setStatus(BlogPostStatus.PROCESSING);

        when(blogPostRepository.save(any(BlogPost.class))).thenReturn(updatedPost);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.updatePost(1L, updateRequest, 3L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals("Updated Title", response.getData().getTitle());
        assertEquals("/img/blog/updated.jpg", response.getData().getThumbnailImage());
        assertEquals(BlogPostStatus.PROCESSING, response.getData().getStatus());
        assertNull(response.getData().getReviewerId());

        // Verify
        ArgumentCaptor<BlogPost> blogPostCaptor = ArgumentCaptor.forClass(BlogPost.class);
        verify(blogPostRepository).save(blogPostCaptor.capture());
        verify(blogSectionRepository).deleteAll(existingSections);
        verify(blogSectionRepository).save(any(BlogSection.class));

        BlogPost savedPost = blogPostCaptor.getValue();
        assertEquals(BlogPostStatus.PROCESSING, savedPost.getStatus());
        assertEquals("/img/blog/updated.jpg", savedPost.getThumbnailImage());
        assertNull(savedPost.getReviewer());
        assertNull(savedPost.getReviewedAt());
    }

    @Test
    @DisplayName("Tạo blog post với thumbnail và sections thành công")
    void createPost_WithThumbnailAndSections_ShouldSucceed() {
        // Arrange
        BlogPostRequest requestWithSections = new BlogPostRequest();
        requestWithSections.setTitle("Healthy Diet Guide");
        requestWithSections.setContent("Eating healthy is important...");
        requestWithSections.setCategoryId(1L);
        requestWithSections.setThumbnailImage("/img/blog/healthy-diet.jpg");

        // Tạo các sections
        List<BlogSectionRequest> sections = new ArrayList<>();

        BlogSectionRequest section1 = new BlogSectionRequest();
        section1.setSectionTitle("Fruits and Vegetables");
        section1.setSectionContent("Include a variety of fruits and vegetables...");
        section1.setSectionImage("/img/blog/fruits-veggies.jpg");
        section1.setDisplayOrder(1);
        sections.add(section1);

        BlogSectionRequest section2 = new BlogSectionRequest();
        section2.setSectionTitle("Proteins");
        section2.setSectionContent("Choose lean protein sources...");
        section2.setSectionImage("/img/blog/proteins.jpg");
        section2.setDisplayOrder(2);
        sections.add(section2);

        requestWithSections.setSections(sections);

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        BlogPost savedPost = new BlogPost();
        savedPost.setPostId(2L);
        savedPost.setTitle("Healthy Diet Guide");
        savedPost.setContent("Eating healthy is important...");
        savedPost.setThumbnailImage("/img/blog/healthy-diet.jpg");
        savedPost.setCategory(category);
        savedPost.setAuthor(adminUser);
        savedPost.setCreatedAt(LocalDateTime.now());
        savedPost.setStatus(BlogPostStatus.CONFIRMED);
        savedPost.setReviewer(adminUser);
        savedPost.setReviewedAt(LocalDateTime.now());

        when(blogPostRepository.save(any(BlogPost.class))).thenReturn(savedPost);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.createPost(requestWithSections, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals("Healthy Diet Guide", response.getData().getTitle());
        assertEquals("/img/blog/healthy-diet.jpg", response.getData().getThumbnailImage());

        // Verify
        verify(blogPostRepository).save(any(BlogPost.class));
        verify(blogSectionRepository, times(2)).save(any(BlogSection.class));
    }

    @Test
    @DisplayName("getPostById bao gồm thumbnail và sections")
    void getPostById_ShouldIncludeThumbnailAndSections() {
        // Arrange
        BlogPost post = new BlogPost();
        post.setPostId(1L);
        post.setTitle("Test Post");
        post.setContent("Test Content");
        post.setThumbnailImage("/img/blog/test.jpg");
        post.setCategory(category);
        post.setAuthor(adminUser);
        post.setCreatedAt(LocalDateTime.now());
        post.setStatus(BlogPostStatus.CONFIRMED);

        // Create test sections
        List<BlogSection> sections = new ArrayList<>();
        BlogSection section1 = new BlogSection();
        section1.setSectionId(1L);
        section1.setBlogPost(post);
        section1.setSectionTitle("Section 1");
        section1.setSectionContent("Content 1");
        section1.setSectionImage("/img/blog/section1.jpg");
        section1.setDisplayOrder(1);
        sections.add(section1);

        BlogSection section2 = new BlogSection();
        section2.setSectionId(2L);
        section2.setBlogPost(post);
        section2.setSectionTitle("Section 2");
        section2.setSectionContent("Content 2");
        section2.setSectionImage("/img/blog/section2.jpg");
        section2.setDisplayOrder(2);
        sections.add(section2);

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(blogSectionRepository.findByBlogPostPostIdOrderByDisplayOrder(1L)).thenReturn(sections);

        // Act
        ApiResponse<BlogPostResponse> response = blogPostService.getPostById(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Blog post retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals("Test Post", response.getData().getTitle());
        assertEquals("/img/blog/test.jpg", response.getData().getThumbnailImage());
        assertNotNull(response.getData().getSections());
        assertEquals(2, response.getData().getSections().size());
        assertEquals("Section 1", response.getData().getSections().get(0).getSectionTitle());
        assertEquals("Section 2", response.getData().getSections().get(1).getSectionTitle());
        assertEquals(1, response.getData().getSections().get(0).getDisplayOrder());
        assertEquals(2, response.getData().getSections().get(1).getDisplayOrder());

        // Verify
        verify(blogPostRepository).findById(1L);
        verify(blogSectionRepository).findByBlogPostPostIdOrderByDisplayOrder(1L);
    }
}