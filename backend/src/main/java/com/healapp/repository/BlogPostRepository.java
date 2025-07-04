package com.healapp.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.healapp.model.BlogPost;
import com.healapp.model.BlogPostStatus;
import com.healapp.model.Category;
import com.healapp.model.UserDtls;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    List<BlogPost> findByStatus(BlogPostStatus status);

    Page<BlogPost> findByStatus(BlogPostStatus status, Pageable pageable);

    // Tìm bài viết theo tác giả
    List<BlogPost> findByAuthor(UserDtls author);

    Page<BlogPost> findByAuthor(UserDtls author, Pageable pageable);

    // Tìm kiếm bài viết theo tác giả và trạng thái
    List<BlogPost> findByAuthorAndStatus(UserDtls author, BlogPostStatus status);

    Page<BlogPost> findByAuthorAndStatus(UserDtls author, BlogPostStatus status, Pageable pageable);

    // Tìm bài viết theo danh mục
    List<BlogPost> findByCategory(Category category);

    Page<BlogPost> findByCategory(Category category, Pageable pageable);

    // Tìm bài viết theo tiêu đề
    List<BlogPost> findByTitleContainingIgnoreCase(String title);

    Page<BlogPost> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    // Tìm bài viết theo nội dung
    List<BlogPost> findByContentContainingIgnoreCase(String content);

    Page<BlogPost> findByContentContainingIgnoreCase(String content, Pageable pageable);

    // Tìm bài viết theo khoảng thời gian
    List<BlogPost> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    Page<BlogPost> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    // Tìm kiếm bài viết theo tiêu đề hoặc nội dung
    Page<BlogPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String title, String content, Pageable pageable);

    // Tìm kiếm bài viết theo tiêu đề, nội dung hoặc tên danh mục
    Page<BlogPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrCategoryNameContainingIgnoreCase(
            String title, String content, String categoryName, Pageable pageable);

    // Tìm kiếm bài viết CONFIRMED theo tiêu đề, nội dung hoặc tên danh mục
    Page<BlogPost> findByStatusAndTitleContainingIgnoreCaseOrStatusAndContentContainingIgnoreCaseOrStatusAndCategoryNameContainingIgnoreCase(
            BlogPostStatus status, String title, BlogPostStatus status2, String content, BlogPostStatus status3, String categoryName, Pageable pageable);

    // Tìm kiếm bài viết trong category cụ thể theo tiêu đề, nội dung hoặc tên danh mục
    Page<BlogPost> findByCategoryAndTitleContainingIgnoreCaseOrCategoryAndContentContainingIgnoreCaseOrCategoryAndCategoryNameContainingIgnoreCase(
            Category category, String title, Category category2, String content, Category category3, String categoryName, Pageable pageable);

    // Tìm kiếm bài viết CONFIRMED trong category cụ thể theo tiêu đề, nội dung hoặc tên danh mục
    Page<BlogPost> findByCategoryAndStatusAndTitleContainingIgnoreCaseOrCategoryAndStatusAndContentContainingIgnoreCaseOrCategoryAndStatusAndCategoryNameContainingIgnoreCase(
            Category category, BlogPostStatus status, String title, Category category2, BlogPostStatus status2, String content, Category category3, BlogPostStatus status3, String categoryName, Pageable pageable);

    // Lấy các bài viết mới nhất theo trạng thái
    List<BlogPost> findByStatusOrderByCreatedAtDesc(BlogPostStatus status, Pageable pageable);

    List<BlogPost> findByCategoryAndStatusAndPostIdNotOrderByCreatedAtDesc(Category category, BlogPostStatus status, Long postId, Pageable pageable);
    
    List<BlogPost> findByAuthorAndStatusAndPostIdNotOrderByCreatedAtDesc(UserDtls author, BlogPostStatus status, Long postId, Pageable pageable);
    
    List<BlogPost> findByStatusAndPostIdNotOrderByCreatedAtDesc(BlogPostStatus status, Long postId, Pageable pageable);

    List<BlogPost> findByCategoryOrAuthorAndStatusAndPostIdNotOrderByCreatedAtDesc(Category category, UserDtls author, BlogPostStatus status, Long postId, Pageable pageable);
}