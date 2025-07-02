package com.healapp.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationRequest {
    @NotNull(message = "Consultant ID is required")
    private Long consultantId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotEmpty(message = "Time slot is required")
    private String timeSlot;

    @Size(max = 1000, message = "Note must not exceed 1000 characters")
    private String note;
}