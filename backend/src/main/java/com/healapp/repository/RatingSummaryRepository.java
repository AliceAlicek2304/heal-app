package com.healapp.repository;

import com.healapp.model.Rating;
import com.healapp.model.RatingSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RatingSummaryRepository extends JpaRepository<RatingSummary, Long> {

    // Tìm summary theo target
    Optional<RatingSummary> findByTargetTypeAndTargetId(Rating.RatingTargetType targetType, Long targetId);

    // Kiểm tra summary tồn tại
    boolean existsByTargetTypeAndTargetId(Rating.RatingTargetType targetType, Long targetId);
}
