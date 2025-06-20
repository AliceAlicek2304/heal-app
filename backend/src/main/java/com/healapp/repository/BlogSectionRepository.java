package com.healapp.repository;

import com.healapp.model.BlogPost;
import com.healapp.model.BlogSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogSectionRepository extends JpaRepository<BlogSection, Long> {
    List<BlogSection> findByBlogPostOrderByDisplayOrder(BlogPost blogPost);

    List<BlogSection> findByBlogPostPostIdOrderByDisplayOrder(Long postId);
}
