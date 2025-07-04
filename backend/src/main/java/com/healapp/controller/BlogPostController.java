package com.healapp.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.BlogPostRequest;
import com.healapp.dto.BlogPostResponse;
import com.healapp.dto.BlogPostStatusRequest;
import com.healapp.model.BlogPostStatus;
import com.healapp.service.BlogPostService;
import com.healapp.service.FileStorageService;
import com.healapp.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/blog")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", allowedHeaders = "*")
public class BlogPostController {
    @Autowired
    private BlogPostService blogPostService;

    @Autowired
    private UserService userService;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping(consumes = { "multipart/form-data" })
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BlogPostResponse>> createPost(
            @RequestPart("thumbnail") MultipartFile thumbnail,
            @RequestPart(value = "sectionImages", required = false) MultipartFile[] sectionImages,
            @RequestPart(value = "sectionImageIndexes", required = false) Integer[] sectionImageIndexes,
            @RequestPart("request") @Valid BlogPostRequest request) {

        try {
            // Xử lý thumbnail
            if (thumbnail == null || thumbnail.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Thumbnail image is required"));
            }
            String thumbnailUrl = fileStorageService.storeBlogThumbnail(thumbnail);
            request.setThumbnailImage(thumbnailUrl);

            // Xử lý section images
            if (sectionImages != null && sectionImages.length > 0) {
                if (request.getSections() != null) {
                    if (sectionImageIndexes != null && sectionImageIndexes.length == sectionImages.length) {
                        for (int i = 0; i < sectionImages.length; i++) {
                            if (sectionImages[i] != null && !sectionImages[i].isEmpty()) {
                                int sectionIndex = sectionImageIndexes[i];
                                if (sectionIndex >= 0 && sectionIndex < request.getSections().size()) {
                                    String sectionImageUrl = fileStorageService.storeBlogSectionImage(sectionImages[i],
                                            sectionIndex + 1);
                                    request.getSections().get(sectionIndex).setSectionImage(sectionImageUrl);
                                }
                            }
                        }
                    } else if (sectionImages.length == request.getSections().size()) {
                        for (int i = 0; i < sectionImages.length; i++) {
                            if (sectionImages[i] != null && !sectionImages[i].isEmpty()) {
                                String sectionImageUrl = fileStorageService.storeBlogSectionImage(sectionImages[i],
                                        i + 1);
                                request.getSections().get(i).setSectionImage(sectionImageUrl);
                            }
                        }
                    } else {
                        for (int i = 0; i < Math.min(sectionImages.length, request.getSections().size()); i++) {
                            if (sectionImages[i] != null && !sectionImages[i].isEmpty()) {
                                String sectionImageUrl = fileStorageService.storeBlogSectionImage(sectionImages[i],
                                        i + 1);
                                request.getSections().get(i).setSectionImage(sectionImageUrl);
                            }
                        }
                    }
                }
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            Long authorId = userService.getUserIdFromUsername(username);

            ApiResponse<BlogPostResponse> response = blogPostService.createPost(request, authorId);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to process image files: " + e.getMessage()));
        }
    }

    @PutMapping(path = "/{postId}", consumes = { "multipart/form-data" })
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BlogPostResponse>> updatePost(
            @PathVariable Long postId,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
            @RequestPart(value = "sectionImages", required = false) MultipartFile[] sectionImages,
            @RequestPart(value = "sectionImageIndexes", required = false) Integer[] sectionImageIndexes,
            @RequestPart("request") @Valid BlogPostRequest request) {

        try {
            // Xử lý thumbnail mới
            if (thumbnail != null && !thumbnail.isEmpty()) {
                String thumbnailUrl = fileStorageService.storeBlogThumbnail(thumbnail);
                request.setThumbnailImage(thumbnailUrl);
            }

            // Xử lý section images mới
            if (sectionImages != null && sectionImages.length > 0) {
                if (request.getSections() != null) {
                    if (sectionImageIndexes != null && sectionImageIndexes.length == sectionImages.length) {
                        for (int i = 0; i < sectionImages.length; i++) {
                            if (sectionImages[i] != null && !sectionImages[i].isEmpty()) {
                                int sectionIndex = sectionImageIndexes[i];
                                if (sectionIndex >= 0 && sectionIndex < request.getSections().size()) {
                                    String sectionImageUrl = fileStorageService.storeBlogSectionImage(sectionImages[i],
                                            sectionIndex + 1);
                                    request.getSections().get(sectionIndex).setSectionImage(sectionImageUrl);
                                }
                            }
                        }
                    } else if (sectionImages.length == request.getSections().size()) {
                        for (int i = 0; i < sectionImages.length; i++) {
                            if (sectionImages[i] != null && !sectionImages[i].isEmpty()) {
                                String sectionImageUrl = fileStorageService.storeBlogSectionImage(sectionImages[i],
                                        i + 1);
                                request.getSections().get(i).setSectionImage(sectionImageUrl);
                            }
                        }
                    } else {
                        for (int i = 0; i < Math.min(sectionImages.length, request.getSections().size()); i++) {
                            if (sectionImages[i] != null && !sectionImages[i].isEmpty()) {
                                String sectionImageUrl = fileStorageService.storeBlogSectionImage(sectionImages[i],
                                        i + 1);
                                request.getSections().get(i).setSectionImage(sectionImageUrl);
                            }
                        }
                    }
                }
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            ApiResponse<BlogPostResponse> response = blogPostService.updatePost(postId, request, userId);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to process image files: " + e.getMessage()));
        }
    }

    @PutMapping("/{postId}/status")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<BlogPostResponse>> updatePostStatus(
            @PathVariable Long postId,
            @Valid @RequestBody BlogPostStatusRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Long staffId = userService.getUserIdFromUsername(username);

        ApiResponse<BlogPostResponse> response = blogPostService.updatePostStatus(postId, request, staffId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> deletePost(@PathVariable Long postId) {

        // Lấy ID của người dùng hiện tại từ Authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // Lấy ID từ username đã được xác thực
        Long userId = userService.getUserIdFromUsername(username);

        ApiResponse<String> response = blogPostService.deletePost(postId, userId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<BlogPostResponse>> getPostById(@PathVariable Long postId) {
        ApiResponse<BlogPostResponse> response = blogPostService.getPostById(postId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<BlogPostResponse>>> getPostsByStatus(
            @PathVariable BlogPostStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        ApiResponse<Page<BlogPostResponse>> response = blogPostService.getPostsByStatus(status, pageable);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BlogPostResponse>>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // Kiểm tra xem người dùng có đăng nhập và có vai trò STAFF hoặc ADMIN không
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = authentication != null && authentication.isAuthenticated() &&
                !"anonymousUser".equals(authentication.getName());
        boolean isStaffOrAdmin = false;

        if (isAuthenticated) {
            isStaffOrAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_STAFF") || a.getAuthority().equals("ROLE_ADMIN"));
        }

        ApiResponse<Page<BlogPostResponse>> response;

        if (isStaffOrAdmin) {
            // Nếu là STAFF hoặc ADMIN, trả về tất cả bài viết
            response = blogPostService.getAllPosts(pageable);
        } else {
            // Nếu là người dùng thông thường hoặc chưa đăng nhập, chỉ trả về bài viết đã
            // được duyệt
            response = blogPostService.getPostsByStatus(BlogPostStatus.CONFIRMED, pageable);
        }

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/my-posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<BlogPostResponse>>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // Lấy user ID từ authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long userId = userService.getUserIdFromUsername(username);

        ApiResponse<Page<BlogPostResponse>> response = blogPostService.getPostsByAuthor(userId, pageable);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<Page<BlogPostResponse>>> getPostsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        ApiResponse<Page<BlogPostResponse>> response = blogPostService.getPostsByCategory(categoryId, pageable);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BlogPostResponse>>> searchPosts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Long categoryId) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        ApiResponse<Page<BlogPostResponse>> response;
        
        // Nếu có categoryId, tìm kiếm trong category cụ thể
        if (categoryId != null) {
            response = blogPostService.searchPostsInCategory(query, categoryId, pageable);
        } else {
            // Tìm kiếm tổng quát
            response = blogPostService.searchPosts(query, pageable);
        }

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<List<BlogPostResponse>>> getLatestPosts(
            @RequestParam(defaultValue = "3") int limit) {

        ApiResponse<List<BlogPostResponse>> response = blogPostService.getLatestPosts(limit);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{postId}/related")
    public ResponseEntity<ApiResponse<List<BlogPostResponse>>> getRelatedPosts(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "3") int limit) {

        ApiResponse<List<BlogPostResponse>> response = blogPostService.getRelatedPosts(postId, limit);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}