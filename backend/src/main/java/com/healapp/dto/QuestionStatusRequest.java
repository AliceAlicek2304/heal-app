package com.healapp.dto;

import com.healapp.model.Question.QuestionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuestionStatusRequest {
    @NotNull(message = "Status is required")
    private QuestionStatus status;

    private String rejectionReason;
}