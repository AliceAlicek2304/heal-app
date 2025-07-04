package com.healapp.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.healapp.service.MenstrualCycleService.CycleRegularity;

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
    
    private LocalDate endDate;
    private LocalDate nextCycleDate;
    private LocalDate fertileStart;
    private LocalDate fertileEnd;
    private double currentPregnancyProbability;
    private boolean inFertilePeriod;
    
    private Double averageCycleLength;
    private Double cycleVariability;
    private String confidenceLevel;
    private LocalDate predictedNextCycle;
    private boolean hasHistoricalData;
    private int totalCycles;
    
    private CycleRegularity regularity;
}
