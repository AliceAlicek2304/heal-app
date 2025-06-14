package com.healapp.repository;

import com.healapp.model.Rating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    // Kiểm tra user đã đánh giá chưa
    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, Rating.RatingTargetType targetType, Long targetId);

    // Tìm rating của user cho target cụ thể
    Optional<Rating> findByUserIdAndTargetTypeAndTargetId(Long userId, Rating.RatingTargetType targetType,
            Long targetId);

    // Lấy tất cả ratings của một target
    List<Rating> findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
            Rating.RatingTargetType targetType, Long targetId);

    // Lấy ratings với phân trang
    Page<Rating> findByTargetTypeAndTargetIdAndIsActiveTrue(
            Rating.RatingTargetType targetType, Long targetId, Pageable pageable);

    // Lấy ratings theo user
    Page<Rating> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Lấy ratings chưa có staff reply
    @Query("SELECT r FROM Rating r WHERE r.targetType = :targetType AND r.targetId = :targetId " +
            "AND r.isActive = true AND r.staffReply IS NULL ORDER BY r.createdAt DESC")
    List<Rating> findPendingReplyRatings(@Param("targetType") Rating.RatingTargetType targetType,
            @Param("targetId") Long targetId);

    // Lấy ratings theo filter rating score
    Page<Rating> findByTargetTypeAndTargetIdAndRatingAndIsActiveTrue(
            Rating.RatingTargetType targetType, Long targetId, Integer rating, Pageable pageable);

    // Tìm kiếm trong comment
    @Query("SELECT r FROM Rating r WHERE r.targetType = :targetType AND r.targetId = :targetId " +
            "AND r.isActive = true AND (LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Rating> searchInComments(@Param("targetType") Rating.RatingTargetType targetType,
            @Param("targetId") Long targetId,
            @Param("keyword") String keyword,
            Pageable pageable);

    // Lấy top ratings có comment
    @Query("SELECT r FROM Rating r WHERE r.targetType = :targetType AND r.targetId = :targetId " +
            "AND r.isActive = true AND r.comment IS NOT NULL AND LENGTH(r.comment) > 10 " +
            "ORDER BY r.rating DESC, r.createdAt DESC")
    List<Rating> findTopRatingsWithComments(@Param("targetType") Rating.RatingTargetType targetType,
            @Param("targetId") Long targetId,
            Pageable pageable);

    // Count ratings by score
    @Query("SELECT r.rating, COUNT(r) FROM Rating r WHERE r.targetType = :targetType " +
            "AND r.targetId = :targetId AND r.isActive = true GROUP BY r.rating")
    List<Object[]> countRatingsByScore(@Param("targetType") Rating.RatingTargetType targetType,
            @Param("targetId") Long targetId);
}
