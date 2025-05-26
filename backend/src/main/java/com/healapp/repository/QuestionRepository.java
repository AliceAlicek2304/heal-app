package com.healapp.repository;

import com.healapp.model.Question;
import com.healapp.model.Question.QuestionStatus;
import com.healapp.model.UserDtls;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    Page<Question> findByStatus(QuestionStatus status, Pageable pageable);

    Page<Question> findByCategoryQuestion_CategoryQuestionId(Long categoryId, Pageable pageable);

    Page<Question> findByCustomer(UserDtls customer, Pageable pageable);

    Page<Question> findByStatusAndCategoryQuestion_CategoryQuestionId(QuestionStatus status, Long categoryId,
            Pageable pageable);

    Page<Question> findByStatusAndCustomer(QuestionStatus status, UserDtls customer, Pageable pageable);
}