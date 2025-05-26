package com.healapp.dto;

import lombok.Data;

@Data
public class TestResultRequest {
    private Long componentId;
    private String resultValue;
    private String normalRange;
    private String unit;
}