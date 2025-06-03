package com.healapp.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Table(name = "pregnancy_prob_log")
@NoArgsConstructor
@AllArgsConstructor
public class PregnancyProbLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "menstrual_cycle_id")
    private MenstrualCycle menstrualCycle;

    @Column(nullable = false)
    private LocalDate date; // Ngày dự đoán

    @Column(nullable = false)
    @Min(0)
    @Max(100)
    private double probability; // Xác suất mang thai

}
