package com.healapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long questionId;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private UserDtls customer;

    @ManyToOne
    @JoinColumn(name = "category_question_id", nullable = false)
    private CategoryQuestion categoryQuestion;

    @Column(columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String content;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String answer;

    @Enumerated(EnumType.STRING)
    private QuestionStatus status = QuestionStatus.PROCESSING;

    @ManyToOne
    @JoinColumn(name = "updater_id")
    private UserDtls updater;

    @ManyToOne
    @JoinColumn(name = "replier_id")
    private UserDtls replier;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String rejectionReason;

    public enum QuestionStatus {
        PROCESSING, CONFIRMED, CANCELED, ANSWERED
    }
}