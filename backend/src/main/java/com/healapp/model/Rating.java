package com.healapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ratings")
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rating_id")
    private Long ratingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private UserDtls user; // Customer đánh giá

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private RatingTargetType targetType; // CONSULTANT, STI_SERVICE

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "rating", nullable = false)
    private Integer rating; // 1-5 sao

    @Column(name = "comment", length = 500, columnDefinition = "nvarchar(500)")
    private String comment;

    // Staff reply fields
    @Column(name = "staff_reply", length = 500, columnDefinition = "nvarchar(500)")
    private String staffReply;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replied_by")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private UserDtls repliedBy; // Staff reply

    @Column(name = "replied_at")
    private LocalDateTime repliedAt; // Reference fields - link to specific service usage
    @Column(name = "consultation_id")
    private Long consultationId; // For CONSULTANT ratings

    @Column(name = "sti_test_id")
    private Long stiTestId; // For STI_SERVICE ratings

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    } // Constructor convenience

    public Rating(UserDtls user, RatingTargetType targetType, Long targetId, Integer rating, String comment) {
        this.user = user;
        this.targetType = targetType;
        this.targetId = targetId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Constructor with reference IDs
    public Rating(UserDtls user, RatingTargetType targetType, Long targetId, Integer rating, String comment,
            Long consultationId, Long stiTestId) {
        this.user = user;
        this.targetType = targetType;
        this.targetId = targetId;
        this.rating = rating;
        this.comment = comment;
        this.consultationId = consultationId;
        this.stiTestId = stiTestId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public enum RatingTargetType {
        CONSULTANT,
        STI_SERVICE,
        STI_PACKAGE
    }
}
