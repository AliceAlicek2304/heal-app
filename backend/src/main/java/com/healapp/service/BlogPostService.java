package com.healapp.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

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
import com.healapp.model.UserDtls;
import com.healapp.repository.BlogPostRepository;
import com.healapp.repository.BlogSectionRepository;
import com.healapp.repository.CategoryRepository;
import com.healapp.repository.UserRepository;

@Service
public class BlogPostService {

    @Autowired
    private BlogPostRepository blogPostRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BlogSectionRepository blogSectionRepository;

    // Tạo bài viết mới
    public ApiResponse<BlogPostResponse> createPost(BlogPostRequest request, Long authorId) {
        try {
            Optional<UserDtls> author = userRepository.findById(authorId);
            if (author.isEmpty()) {
                return ApiResponse.error("Author not found");
            }

            // Kiểm tra vai trò tác giả
            UserDtls authorUser = author.get();
            String authorRole = authorUser.getRoleName();
            if (!"CUSTOMER".equals(authorRole)
                    && !"CONSULTANT".equals(authorRole)
                    && !"STAFF".equals(authorRole)
                    && !"ADMIN".equals(authorRole)) {
                return ApiResponse.error("You do not have permission to create blog posts");
            }

            Optional<Category> category = categoryRepository.findById(request.getCategoryId());
            if (category.isEmpty()) {
                return ApiResponse.error("Category not found");
            }

            BlogPost blogPost = new BlogPost();
            blogPost.setTitle(request.getTitle());
            blogPost.setContent(request.getContent());
            blogPost.setThumbnailImage(request.getThumbnailImage());
            blogPost.setCategory(category.get());
            blogPost.setAuthor(authorUser);
            blogPost.setCreatedAt(LocalDateTime.now());

            if ("STAFF".equals(authorRole) || "ADMIN".equals(authorRole)) {
                blogPost.setStatus(BlogPostStatus.CONFIRMED);
                blogPost.setReviewer(authorUser);
                blogPost.setReviewedAt(LocalDateTime.now());
            } else {
                // Nếu là USER hoặc CONSULTANT, trạng thái mặc định là PROCESSING
                blogPost.setStatus(BlogPostStatus.PROCESSING);
            }

            BlogPost savedPost = blogPostRepository.save(blogPost);

            // Process sections if any
            if (request.getSections() != null && !request.getSections().isEmpty()) {
                for (BlogSectionRequest sectionRequest : request.getSections()) {
                    BlogSection section = new BlogSection();
                    section.setBlogPost(savedPost);
                    section.setSectionTitle(sectionRequest.getSectionTitle());
                    section.setSectionContent(sectionRequest.getSectionContent());
                    section.setSectionImage(sectionRequest.getSectionImage());
                    section.setDisplayOrder(sectionRequest.getDisplayOrder());
                    blogSectionRepository.save(section);
                }
            }

            // Chuyển đổi sang response
            BlogPostResponse response = convertToResponse(savedPost);

            return ApiResponse.success("Blog post created successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to create blog post: " + e.getMessage());
        }
    }

    // Cập nhật bài viết
    public ApiResponse<BlogPostResponse> updatePost(Long postId, BlogPostRequest request, Long userId) {
        try {
            Optional<BlogPost> existingPost = blogPostRepository.findById(postId);
            if (existingPost.isEmpty()) {
                return ApiResponse.error("Blog post not found");
            }

            BlogPost blogPost = existingPost.get();

            // kiểm tra tác dả
            if (!blogPost.getAuthor().getId().equals(userId)) {
                return ApiResponse.error("Only the author can update this post");
            }

            // Kiểm tra category
            Optional<Category> category = categoryRepository.findById(request.getCategoryId());
            if (category.isEmpty()) {
                return ApiResponse.error("Category not found");
            } // Cập nhật bài viết
            blogPost.setTitle(request.getTitle());
            blogPost.setContent(request.getContent());
            // Xử lý giữ lại thumbnail cũ nếu không upload mới
            if (request.getThumbnailImage() != null) {
                blogPost.setThumbnailImage(request.getThumbnailImage());
            } else if (request.getExistingThumbnail() != null) {
                blogPost.setThumbnailImage(request.getExistingThumbnail());
            }
            // Nếu cả hai đều null thì KHÔNG set lại thumbnailImage, giữ nguyên giá trị cũ
            blogPost.setCategory(category.get());
            blogPost.setUpdatedAt(LocalDateTime.now());// PROCESSING sau khi cập nhật
            blogPost.setStatus(BlogPostStatus.PROCESSING);
            blogPost.setReviewer(null);
            blogPost.setReviewedAt(null);

            BlogPost updatedPost = blogPostRepository.save(blogPost);

            // Process sections if any
            if (request.getSections() != null && !request.getSections().isEmpty()) {
                // First delete existing sections
                List<BlogSection> existingSections = blogSectionRepository
                        .findByBlogPostPostIdOrderByDisplayOrder(postId);
                blogSectionRepository.deleteAll(existingSections);

                // Then add new sections
                for (BlogSectionRequest sectionRequest : request.getSections()) {
                    BlogSection section = new BlogSection();
                    section.setBlogPost(updatedPost);
                    section.setSectionTitle(sectionRequest.getSectionTitle());
                    section.setSectionContent(sectionRequest.getSectionContent());
                    // Xử lý giữ lại sectionImage cũ nếu không upload mới
                    if (sectionRequest.getSectionImage() != null) {
                        section.setSectionImage(sectionRequest.getSectionImage());
                    } else if (sectionRequest.getExistingSectionImage() != null) {
                        section.setSectionImage(sectionRequest.getExistingSectionImage());
                    }
                    // Nếu cả hai đều null thì KHÔNG set lại sectionImage, giữ nguyên giá trị cũ
                    section.setDisplayOrder(sectionRequest.getDisplayOrder());
                    blogSectionRepository.save(section);
                }
            }

            // Chuyển đổi sang response
            BlogPostResponse response = convertToResponse(updatedPost);

            return ApiResponse.success("Blog post updated successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to update blog post: " + e.getMessage());
        }
    }

    public ApiResponse<BlogPostResponse> updatePostStatus(Long postId, BlogPostStatusRequest request, Long staffId) {
        try {
            Optional<BlogPost> existingPost = blogPostRepository.findById(postId);
            if (existingPost.isEmpty()) {
                return ApiResponse.error("Blog post not found");
            }

            BlogPost blogPost = existingPost.get();

            // Kiểm tra quyền
            UserDtls staff = userRepository.findById(staffId).orElse(null);
            if (staff == null) {
                return ApiResponse.error("Staff not found");
            }

            // Cập nhật: Chỉ STAFF hoặc ADMIN mới có thể cập nhật trạng thái - Sử dụng
            // getRoleName()
            String staffRole = staff.getRoleName();
            if (!"STAFF".equals(staffRole) && !"ADMIN".equals(staffRole)) {
                return ApiResponse.error("Only STAFF or ADMIN can update blog post status");
            }

            // Nếu từ chối bài viết cần có lý do
            if (request.getStatus() == BlogPostStatus.CANCELED
                    && (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty())) {
                return ApiResponse.error("Rejection reason is required when canceling a post");
            }

            // Cập nhật trạng thái
            blogPost.setStatus(request.getStatus());
            blogPost.setReviewer(staff);
            blogPost.setReviewedAt(LocalDateTime.now());

            if (request.getStatus() == BlogPostStatus.CANCELED) {
                blogPost.setRejectionReason(request.getRejectionReason());
            } else {
                blogPost.setRejectionReason(null);
            }

            BlogPost updatedPost = blogPostRepository.save(blogPost);

            // Chuyển đổi sang response
            BlogPostResponse response = convertToResponse(updatedPost);

            return ApiResponse.success("Blog post status updated successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to update blog post status: " + e.getMessage());
        }
    }

    // Xóa bài viết
    public ApiResponse<String> deletePost(Long postId, Long userId) {
        try {
            Optional<BlogPost> existingPost = blogPostRepository.findById(postId);
            if (existingPost.isEmpty()) {
                return ApiResponse.error("Blog post not found");
            }

            BlogPost blogPost = existingPost.get(); // Kiểm tra quyền
            UserDtls currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser == null) {
                return ApiResponse.error("User not found");
            }

            // Cho phép ADMIN, STAFF hoặc tác giả xóa bài viết
            boolean isAdmin = "ADMIN".equals(currentUser.getRoleName());
            boolean isStaff = "STAFF".equals(currentUser.getRoleName());
            boolean isAuthor = blogPost.getAuthor().getId().equals(userId);

            if (!isAdmin && !isStaff && !isAuthor) {
                return ApiResponse.error("You don't have permission to delete this post");
            }

            blogPost.setStatus(BlogPostStatus.CANCELED);
            blogPostRepository.save(blogPost);

            return ApiResponse.success("Blog post canceled successfully", null);
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete blog post: " + e.getMessage());
        }
    }

    public ApiResponse<BlogPostResponse> getPostById(Long postId) {
        try {
            Optional<BlogPost> post = blogPostRepository.findById(postId);
            if (post.isEmpty()) {
                return ApiResponse.error("Blog post not found");
            }

            BlogPostResponse response = convertToResponse(post.get());

            return ApiResponse.success("Blog post retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve blog post: " + e.getMessage());
        }
    }

    public ApiResponse<Page<BlogPostResponse>> getPostsByStatus(BlogPostStatus status, Pageable pageable) {
        try {
            Page<BlogPost> posts = blogPostRepository.findByStatus(status, pageable);
            Page<BlogPostResponse> responseData = posts.map(this::convertToResponse);
            return ApiResponse.success("Blog posts retrieved successfully", responseData);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve blog posts: " + e.getMessage());
        }
    }

    public ApiResponse<Page<BlogPostResponse>> getProcessingPosts(Pageable pageable) {
        return getPostsByStatus(BlogPostStatus.PROCESSING, pageable);
    }

    public ApiResponse<Page<BlogPostResponse>> getAllPosts(Pageable pageable) {
        try {
            Page<BlogPost> posts = blogPostRepository.findAll(pageable);
            Page<BlogPostResponse> responses = posts.map(this::convertToResponse);

            return ApiResponse.success("Blog posts retrieved successfully", responses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve blog posts: " + e.getMessage());
        }
    }

    public ApiResponse<Page<BlogPostResponse>> getPostsByAuthor(Long authorId, Pageable pageable) {
        try {
            Optional<UserDtls> author = userRepository.findById(authorId);
            if (author.isEmpty()) {
                return ApiResponse.error("Author not found");
            }

            Page<BlogPost> posts = blogPostRepository.findByAuthor(author.get(), pageable);
            Page<BlogPostResponse> response = posts.map(this::convertToResponse);

            return ApiResponse.success("Blog posts retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve blog posts: " + e.getMessage());
        }
    }

    public ApiResponse<Page<BlogPostResponse>> getPostsByCategory(Long categoryId, Pageable pageable) {
        try {
            Optional<Category> category = categoryRepository.findById(categoryId);
            if (category.isEmpty()) {
                return ApiResponse.error("Category not found");
            }

            Page<BlogPost> posts = blogPostRepository.findByCategory(category.get(), pageable);
            Page<BlogPostResponse> responses = posts.map(this::convertToResponse);

            return ApiResponse.success("Blog posts retrieved successfully", responses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve blog posts: " + e.getMessage());
        }
    }

    public ApiResponse<Page<BlogPostResponse>> searchPosts(String query, Pageable pageable) {
        try {
            Page<BlogPost> posts = blogPostRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
                    query, query, pageable);
            Page<BlogPostResponse> responses = posts.map(this::convertToResponse);

            return ApiResponse.success("Blog posts retrieved successfully", responses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to search blog posts: " + e.getMessage());
        }
    }

    private BlogPostResponse convertToResponse(BlogPost blogPost) {
        BlogPostResponse response = new BlogPostResponse();
        response.setId(blogPost.getPostId());
        response.setTitle(blogPost.getTitle());
        response.setContent(blogPost.getContent());
        response.setThumbnailImage(blogPost.getThumbnailImage());
        response.setCategoryId(blogPost.getCategory().getCategoryId());
        response.setCategoryName(blogPost.getCategory().getName());
        response.setAuthorId(blogPost.getAuthor().getId());
        response.setAuthorName(blogPost.getAuthor().getFullName());
        response.setAuthorAvatar(blogPost.getAuthor().getAvatar());
        response.setCreatedAt(blogPost.getCreatedAt());
        response.setUpdatedAt(blogPost.getUpdatedAt());
        response.setStatus(blogPost.getStatus());

        // Nếu không có thumbnailImage, trả về existingThumbnail là ảnh cũ (nếu có)
        if (blogPost.getThumbnailImage() != null) {
            response.setExistingThumbnail(blogPost.getThumbnailImage());
        } else {
            response.setExistingThumbnail(null);
        }

        // Get sections for this blog post
        List<BlogSection> sections = blogSectionRepository
                .findByBlogPostPostIdOrderByDisplayOrder(blogPost.getPostId());
        if (sections != null && !sections.isEmpty()) {
            List<BlogSectionResponse> sectionResponses = new ArrayList<>();
            for (BlogSection section : sections) {
                BlogSectionResponse sectionResponse = new BlogSectionResponse();
                sectionResponse.setId(section.getSectionId());
                sectionResponse.setSectionTitle(section.getSectionTitle());
                sectionResponse.setSectionContent(section.getSectionContent());
                sectionResponse.setSectionImage(section.getSectionImage());
                sectionResponse.setDisplayOrder(section.getDisplayOrder());
                // Nếu không có sectionImage, trả về existingSectionImage là ảnh cũ (nếu có)
                if (section.getSectionImage() != null) {
                    sectionResponse.setExistingSectionImage(section.getSectionImage());
                } else {
                    sectionResponse.setExistingSectionImage(null);
                }
                sectionResponses.add(sectionResponse);
            }
            response.setSections(sectionResponses);
        }

        if (blogPost.getReviewer() != null) {
            response.setReviewerId(blogPost.getReviewer().getId());
            response.setReviewerName(blogPost.getReviewer().getFullName());
        }

        response.setReviewedAt(blogPost.getReviewedAt());
        response.setRejectionReason(blogPost.getRejectionReason());

        return response;
    }
}
