package com.healapp.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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

            // kiểm tra tác giả
            if (!blogPost.getAuthor().getId().equals(userId)) {
                return ApiResponse.error("Only the author can update this post");
            }

            // Kiểm tra category
            Optional<Category> category = categoryRepository.findById(request.getCategoryId());
            if (category.isEmpty()) {
                return ApiResponse.error("Category not found");
            }

            // Cập nhật bài viết
            blogPost.setTitle(request.getTitle());
            blogPost.setContent(request.getContent());

            // Xử lý thumbnail: nếu có ảnh mới thì dùng, không thì giữ ảnh cũ
            if (request.getThumbnailImage() != null) {
                blogPost.setThumbnailImage(request.getThumbnailImage());
            } else if (request.getExistingThumbnail() != null) {
                blogPost.setThumbnailImage(request.getExistingThumbnail());
            }
            // Nếu cả hai đều null thì giữ nguyên thumbnailImage hiện tại

            blogPost.setCategory(category.get());
            blogPost.setUpdatedAt(LocalDateTime.now());

            // Chuyển về PROCESSING sau khi cập nhật
            blogPost.setStatus(BlogPostStatus.PROCESSING);
            blogPost.setReviewer(null);
            blogPost.setReviewedAt(null);

            BlogPost updatedPost = blogPostRepository.save(blogPost);

            // Process sections if any
            if (request.getSections() != null && !request.getSections().isEmpty()) {
                // Get existing sections to preserve images
                List<BlogSection> existingSections = blogSectionRepository
                        .findByBlogPostPostIdOrderByDisplayOrder(postId);

                // Create a map of existing sections by display order for easy lookup
                Map<Integer, BlogSection> existingSectionsMap = new HashMap<>();
                for (BlogSection existingSection : existingSections) {
                    existingSectionsMap.put(existingSection.getDisplayOrder(), existingSection);
                }

                // Delete existing sections
                blogSectionRepository.deleteAll(existingSections);

                // Then add new sections
                for (BlogSectionRequest sectionRequest : request.getSections()) {
                    BlogSection section = new BlogSection();
                    section.setBlogPost(updatedPost);
                    section.setSectionTitle(sectionRequest.getSectionTitle());
                    section.setSectionContent(sectionRequest.getSectionContent());

                    // Xử lý sectionImage: ưu tiên ảnh mới, sau đó ảnh cũ từ request, cuối cùng là
                    // ảnh cũ từ database
                    if (sectionRequest.getSectionImage() != null) {
                        section.setSectionImage(sectionRequest.getSectionImage());
                    } else if (sectionRequest.getExistingSectionImage() != null) {
                        section.setSectionImage(sectionRequest.getExistingSectionImage());
                    } else {
                        // Try to preserve from existing section at same position
                        BlogSection existingSection = existingSectionsMap.get(sectionRequest.getDisplayOrder());
                        if (existingSection != null && existingSection.getSectionImage() != null) {
                            section.setSectionImage(existingSection.getSectionImage());
                        }
                    }

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
            // Tìm kiếm theo title, content và category name, chỉ lấy bài viết CONFIRMED
            Page<BlogPost> posts = blogPostRepository.findByStatusAndTitleContainingIgnoreCaseOrStatusAndContentContainingIgnoreCaseOrStatusAndCategoryNameContainingIgnoreCase(
                    BlogPostStatus.CONFIRMED, query, BlogPostStatus.CONFIRMED, query, BlogPostStatus.CONFIRMED, query, pageable);
            Page<BlogPostResponse> responses = posts.map(this::convertToResponse);

            return ApiResponse.success("Blog posts retrieved successfully", responses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to search blog posts: " + e.getMessage());
        }
    }

    // Tìm kiếm bài viết trong một category cụ thể
    public ApiResponse<Page<BlogPostResponse>> searchPostsInCategory(String query, Long categoryId, Pageable pageable) {
        try {
            // Kiểm tra category có tồn tại không
            Optional<Category> category = categoryRepository.findById(categoryId);
            if (category.isEmpty()) {
                return ApiResponse.error("Category not found");
            }

            // Tìm kiếm bài viết trong category cụ thể theo title, content hoặc category name, chỉ lấy CONFIRMED
            Page<BlogPost> posts = blogPostRepository.findByCategoryAndStatusAndTitleContainingIgnoreCaseOrCategoryAndStatusAndContentContainingIgnoreCaseOrCategoryAndStatusAndCategoryNameContainingIgnoreCase(
                    category.get(), BlogPostStatus.CONFIRMED, query, category.get(), BlogPostStatus.CONFIRMED, query, category.get(), BlogPostStatus.CONFIRMED, query, pageable);
            Page<BlogPostResponse> responses = posts.map(this::convertToResponse);

            return ApiResponse.success("Blog posts retrieved successfully", responses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to search blog posts in category: " + e.getMessage());
        }
    }

    // Lấy các bài viết mới nhất đã được xác nhận
    public ApiResponse<List<BlogPostResponse>> getLatestPosts(int limit) {
        try {
            List<BlogPost> posts = blogPostRepository.findByStatusOrderByCreatedAtDesc(
                    BlogPostStatus.CONFIRMED,
                    org.springframework.data.domain.PageRequest.of(0, limit));

            List<BlogPostResponse> responses = posts.stream()
                    .map(this::convertToResponse)
                    .toList();

            return ApiResponse.success("Latest blog posts retrieved successfully", responses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve latest blog posts: " + e.getMessage());
        }
    }

    // Lấy blog liên quan (cùng category HOẶC cùng tác giả) - chỉ lấy CONFIRMED
    public ApiResponse<List<BlogPostResponse>> getRelatedPosts(Long postId, int limit) {
        try {
            Optional<BlogPost> currentPost = blogPostRepository.findById(postId);
            if (currentPost.isEmpty()) {
                return ApiResponse.error("Blog post not found");
            }

            BlogPost post = currentPost.get();
            List<BlogPost> relatedPosts = new ArrayList<>();

            // Lấy blog cùng category (CONFIRMED)
            List<BlogPost> sameCategoryPosts = blogPostRepository
                    .findByCategoryAndStatusAndPostIdNotOrderByCreatedAtDesc(
                            post.getCategory(), 
                            BlogPostStatus.CONFIRMED, 
                            postId, 
                            PageRequest.of(0, limit));

            relatedPosts.addAll(sameCategoryPosts);

            // Lấy blog cùng tác giả (CONFIRMED) nếu chưa đủ
            if (relatedPosts.size() < limit) {
                int remainingLimit = limit - relatedPosts.size();
                List<BlogPost> sameAuthorPosts = blogPostRepository
                        .findByAuthorAndStatusAndPostIdNotOrderByCreatedAtDesc(
                                post.getAuthor(), 
                                BlogPostStatus.CONFIRMED, 
                                postId, 
                                PageRequest.of(0, remainingLimit));
                
                // Loại bỏ trùng lặp
                for (BlogPost authorPost : sameAuthorPosts) {
                    if (relatedPosts.stream().noneMatch(p -> p.getPostId().equals(authorPost.getPostId()))) {
                        relatedPosts.add(authorPost);
                        if (relatedPosts.size() >= limit) break;
                    }
                }
            }

            // Nếu vẫn chưa đủ, lấy thêm blog mới nhất (CONFIRMED)
            if (relatedPosts.size() < limit) {
                int remainingLimit = limit - relatedPosts.size();
                List<BlogPost> latestPosts = blogPostRepository
                        .findByStatusAndPostIdNotOrderByCreatedAtDesc(
                                BlogPostStatus.CONFIRMED, 
                                postId, 
                                PageRequest.of(0, remainingLimit));
                
                // Loại bỏ trùng lặp
                for (BlogPost latestPost : latestPosts) {
                    if (relatedPosts.stream().noneMatch(p -> p.getPostId().equals(latestPost.getPostId()))) {
                        relatedPosts.add(latestPost);
                        if (relatedPosts.size() >= limit) break;
                    }
                }
            }

            List<BlogPostResponse> response = relatedPosts.stream()
                    .map(this::convertToResponse)
                    .toList();

            return ApiResponse.success("Related posts retrieved successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Failed to get related posts: " + e.getMessage());
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

        // Set existingThumbnail để frontend biết ảnh cũ
        response.setExistingThumbnail(blogPost.getThumbnailImage());

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
                // Set existingSectionImage để frontend biết ảnh cũ
                sectionResponse.setExistingSectionImage(section.getSectionImage());

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
