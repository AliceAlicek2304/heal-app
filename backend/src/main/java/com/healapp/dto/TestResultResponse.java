package com.healapp.dto;

import java.time.LocalDateTime;

import com.healapp.model.TestConclusion;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestResultResponse {

    private Long resultId;
    private Long testId;
    private Long componentId;
    private String componentName;
    private String testName;
    private String referenceRange;
    private String resultValue;
    private String normalRange;
    private String unit;
    private TestConclusion conclusion;
    private String conclusionDisplayName;
    private Long reviewedBy;
    private String reviewerName;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}