package com.healapp.repository;

import com.healapp.model.BlogPost;
import com.healapp.model.BlogPostStatus;
import com.healapp.model.Category;
import com.healapp.model.UserDtls;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

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
}