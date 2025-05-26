package com.healapp.repository;

import com.healapp.model.CategoryQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryQuestionRepository extends JpaRepository<CategoryQuestion, Long> {
    boolean existsByName(String name);
}