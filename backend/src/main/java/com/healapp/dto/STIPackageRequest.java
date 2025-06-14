package com.healapp.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class STIPackageRequest {

    @NotBlank(message = "Package name is required")
    @Size(max = 200, message = "Package name must not exceed 200 characters")
    private String packageName;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Package price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Package price must be greater than 0")
    @DecimalMax(value = "50000000.0", message = "Package price must not exceed 50,000,000 VND")
    private BigDecimal packagePrice;

    private Boolean isActive = true;

    @NotEmpty(message = "At least one service is required for package")
    @Size(min = 2, message = "Package must contain at least 2 services")
    private List<Long> serviceIds;
}
