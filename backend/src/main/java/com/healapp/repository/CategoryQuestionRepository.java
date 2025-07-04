package com.healapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healapp.model.CategoryQuestion;

public interface CategoryQuestionRepository extends JpaRepository<CategoryQuestion, Long> {
    boolean existsByName(String name);
    List<CategoryQuestion> findAllByIsActiveTrue();
}