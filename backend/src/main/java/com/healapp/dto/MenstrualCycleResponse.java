package com.healapp.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenstrualCycleResponse {
    private Long id;
    private Long userId;
    private LocalDate startDate;
    private long numberOfDays;
    private long cycleLength;
    private LocalDate ovulationDate;
    private boolean reminderEnabled;
    private LocalDateTime createdAt;
}
