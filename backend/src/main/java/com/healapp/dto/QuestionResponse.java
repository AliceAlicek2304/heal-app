package com.healapp.dto;

import com.healapp.model.Question.QuestionStatus;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class QuestionResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String content;
    private String answer;
    private QuestionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long customerId;
    private String customerName;
    private Long updaterId;
    private String updaterName;
    private Long replierId;
    private String replierName;
}