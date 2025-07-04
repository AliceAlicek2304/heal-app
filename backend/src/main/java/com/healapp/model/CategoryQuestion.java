package com.healapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "category_questions")
public class CategoryQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryQuestionId;

    @Column(nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String name;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}