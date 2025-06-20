package com.healapp.repository;

import com.healapp.model.Question;
import com.healapp.model.Question.QuestionStatus;
import com.healapp.model.UserDtls;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    Page<Question> findByStatus(QuestionStatus status, Pageable pageable);

    Page<Question> findByCategoryQuestion_CategoryQuestionId(Long categoryId, Pageable pageable);

    Page<Question> findByCustomer(UserDtls customer, Pageable pageable);

    Page<Question> findByStatusAndCategoryQuestion_CategoryQuestionId(QuestionStatus status, Long categoryId,
            Pageable pageable);

    Page<Question> findByStatusAndCustomer(QuestionStatus status, UserDtls customer, Pageable pageable);
      @Query("SELECT q FROM Question q WHERE q.status = 'ANSWERED' AND " +
           "(LOWER(q.content) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(q.answer) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Question> searchAnsweredQuestions(@Param("query") String query, Pageable pageable);
}