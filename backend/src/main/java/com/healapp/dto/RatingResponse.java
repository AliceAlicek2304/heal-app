package com.healapp.dto;

import java.time.LocalDateTime;

import com.healapp.model.Rating;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatingResponse {

    private Long ratingId;
    private Long userId;
    private String userFullName;
    private String userAvatar;
    private Rating.RatingTargetType targetType;
    private Long targetId;
    private String targetName; // Tên thực của đối tượng được đánh giá
    private Integer rating;
    private String comment;

    // Staff reply info
    private String staffReply;
    private Long repliedById;
    private String repliedByName;
    private LocalDateTime repliedAt;

    // Reference fields - link to specific service usage
    private Long consultationId; // For CONSULTANT ratings
    private Long stiTestId; // For STI_SERVICE ratings

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean canEdit; // Có thể edit trong 24h

    // Helper method to mask user name for privacy
    public String getMaskedUserName() {
        if (userFullName == null || userFullName.length() <= 3) {
            return userFullName;
        }

        String[] parts = userFullName.trim().split("\\s+");
        if (parts.length == 1) {
            // Single name: "Nguyen" -> "N***"
            return parts[0].charAt(0) + "***";
        } else {
            // Multiple names: "Nguyen Van A" -> "Nguyen V***"
            StringBuilder masked = new StringBuilder();
            for (int i = 0; i < parts.length; i++) {
                if (i == parts.length - 1) {
                    // Last name: mask
                    masked.append(parts[i].charAt(0)).append("***");
                } else {
                    // Other names: keep full
                    masked.append(parts[i]);
                    if (i < parts.length - 1) {
                        masked.append(" ");
                    }
                }
            }
            return masked.toString();
        }
    }
}
