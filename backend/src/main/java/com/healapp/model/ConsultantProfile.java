package com.healapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultant_profiles")
@Data
public class ConsultantProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long profileId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserDtls user;    @Column(columnDefinition = "nvarchar(1000)", nullable = false)
    private String qualifications;

    @Column(columnDefinition = "nvarchar(1000)", nullable = false)
    private String experience;

    @Column(columnDefinition = "nvarchar(2000)", nullable = false)
    private String bio;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}