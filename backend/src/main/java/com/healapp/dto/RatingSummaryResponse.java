package com.healapp.dto;

import com.healapp.model.Rating;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatingSummaryResponse {

    private Rating.RatingTargetType targetType;
    private Long targetId;
    private Integer totalRatings;
    private BigDecimal averageRating;

    // Star distribution
    private Map<Integer, Integer> starDistribution;

    // Recent ratings (top 5)
    private List<RatingResponse> recentRatings;

    // Constructor without recent ratings
    public RatingSummaryResponse(Rating.RatingTargetType targetType, Long targetId,
            Integer totalRatings, BigDecimal averageRating) {
        this.targetType = targetType;
        this.targetId = targetId;
        this.totalRatings = totalRatings;
        this.averageRating = averageRating;
        this.starDistribution = new HashMap<>();
    }

    // Helper method to set star distribution
    public void setStarCounts(Integer fiveStar, Integer fourStar, Integer threeStar,
            Integer twoStar, Integer oneStar) {
        this.starDistribution = new HashMap<>();
        this.starDistribution.put(5, fiveStar);
        this.starDistribution.put(4, fourStar);
        this.starDistribution.put(3, threeStar);
        this.starDistribution.put(2, twoStar);
        this.starDistribution.put(1, oneStar);
    }

    // Helper method to get percentage for each star
    public Map<Integer, Double> getStarPercentages() {
        Map<Integer, Double> percentages = new HashMap<>();
        if (totalRatings == 0) {
            for (int i = 1; i <= 5; i++) {
                percentages.put(i, 0.0);
            }
            return percentages;
        }

        for (int star = 1; star <= 5; star++) {
            int count = starDistribution.getOrDefault(star, 0);
            double percentage = (count * 100.0) / totalRatings;
            percentages.put(star, Math.round(percentage * 10.0) / 10.0); // Round to 1 decimal
        }
        return percentages;
    }
}
