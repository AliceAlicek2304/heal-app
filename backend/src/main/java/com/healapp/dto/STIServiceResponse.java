package com.healapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class STIServiceResponse {

    private Long serviceId;
    private String name;
    private String description;
    private Double price;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Thông tin components
    private Integer componentCount;
    private List<TestComponentResponse> testComponents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestComponentResponse {
        private Long componentId;
        private String testName;
        private String referenceRange;
    }
}