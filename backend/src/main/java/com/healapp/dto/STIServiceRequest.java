package com.healapp.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class STIServiceRequest {

    @NotBlank(message = "Service name is required")
    @Size(max = 200, message = "Service name must not exceed 200 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @DecimalMax(value = "10000000.0", message = "Price must not exceed 10,000,000 VND")
    private Double price;

    private Boolean isActive = true;

    @Valid
    @NotEmpty(message = "At least one test component is required")
    private List<TestComponentRequest> testComponents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestComponentRequest {

        @NotBlank(message = "Test name is required")
        @Size(max = 100, message = "Test name must not exceed 100 characters")
        private String testName;

        @Size(max = 100, message = "Reference range must not exceed 100 characters")
        private String referenceRange;

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        private String unit;

        private Boolean status = true;
    }
}
