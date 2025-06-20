package com.healapp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConfigStatusRequest {
    @NotNull(message = "Active status is required")
    private Boolean active;
}
