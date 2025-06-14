package com.healapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class STIPackageResponse {

    private Long packageId;
    private String packageName;
    private String description;
    private BigDecimal packagePrice;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Thông tin services
    private Integer serviceCount;
    private Integer totalComponentCount;
    private List<STIServiceResponse> services;

    // Thông tin giá
    private BigDecimal totalIndividualPrice;
    private BigDecimal savingsAmount;
    private Double discountPercentage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PackageServiceInfo {
        private Long serviceId;
        private String serviceName;
        private String serviceDescription;
        private Double servicePrice;
        private Integer componentCount;
        private List<String> componentNames;
    }
}
