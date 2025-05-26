package com.healapp.dto;

import com.healapp.model.TestStatus;
import lombok.Data;

import java.util.List;

@Data
public class STITestStatusUpdateRequest {
    private TestStatus status;
    private List<TestResultRequest> results;  // Used when updating to RESULTED status
}