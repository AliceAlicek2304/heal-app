package com.healapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.healapp.model.BlogPost;
import com.healapp.model.BlogSection;

@Repository
public interface BlogSectionRepository extends JpaRepository<BlogSection, Long> {
    List<BlogSection> findByBlogPostOrderByDisplayOrder(BlogPost blogPost);

    List<BlogSection> findByBlogPostPostIdOrderByDisplayOrder(Long postId);
}
