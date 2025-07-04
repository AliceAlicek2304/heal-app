package com.healapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.healapp.model.Rating;

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

        // Kiểm tra user đã đánh giá consultation cụ thể chưa (chỉ active ratings)
        boolean existsByUserIdAndConsultationIdAndIsActiveTrue(Long userId, Long consultationId);

        // Kiểm tra user đã đánh giá STI test cụ thể chưa (chỉ active ratings)
        boolean existsByUserIdAndStiTestIdAndIsActiveTrue(Long userId, Long stiTestId);

        // Kiểm tra user đã đánh giá target type cụ thể chưa (chỉ active ratings)
        boolean existsByUserIdAndTargetTypeAndTargetIdAndIsActiveTrue(Long userId, Rating.RatingTargetType targetType,
                        Long targetId);

        // ===================== STAFF MANAGEMENT METHODS =====================

        // Lấy tất cả ratings (cho staff) - với Pageable sort
        Page<Rating> findByIsActiveTrue(Pageable pageable);

        // Lấy tất cả ratings (cho staff)
        Page<Rating> findByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

        List<Rating> findByIsActiveTrueOrderByCreatedAtDesc();

        // Lấy ratings theo target type - với Pageable sort
        Page<Rating> findByTargetTypeAndIsActiveTrue(Rating.RatingTargetType targetType, Pageable pageable);

        // Lấy ratings theo target type
        Page<Rating> findByTargetTypeAndIsActiveTrueOrderByCreatedAtDesc(Rating.RatingTargetType targetType,
                        Pageable pageable);

        List<Rating> findByTargetTypeAndIsActiveTrueOrderByCreatedAtDesc(Rating.RatingTargetType targetType);

        // Lấy ratings theo rating score - với Pageable sort
        Page<Rating> findByRatingAndIsActiveTrue(Integer rating, Pageable pageable);

        Page<Rating> findByTargetTypeAndRatingAndIsActiveTrue(Rating.RatingTargetType targetType, Integer rating,
                        Pageable pageable);

        // Lấy ratings theo rating score
        Page<Rating> findByRatingAndIsActiveTrueOrderByCreatedAtDesc(Integer rating, Pageable pageable);

        Page<Rating> findByTargetTypeAndRatingAndIsActiveTrueOrderByCreatedAtDesc(Rating.RatingTargetType targetType,
                        Integer rating, Pageable pageable);

        // Tìm kiếm trong tất cả comments (cho staff)
        @Query("SELECT r FROM Rating r WHERE r.isActive = true AND " +
                        "(LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Rating> searchAllInComments(@Param("keyword") String keyword, Pageable pageable);

        // Tìm kiếm trong comments với filter rating
        @Query("SELECT r FROM Rating r WHERE r.isActive = true AND r.rating = :rating AND " +
                        "(LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Rating> searchAllWithRatingFilter(@Param("keyword") String keyword, @Param("rating") Integer rating,
                        Pageable pageable);

        // Tìm kiếm trong consultation comments
        @Query("SELECT r FROM Rating r WHERE r.targetType = 'CONSULTANT' AND r.isActive = true AND " +
                        "(LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Rating> searchConsultationInComments(@Param("keyword") String keyword, Pageable pageable);

        // Tìm kiếm trong consultation comments với filter rating
        @Query("SELECT r FROM Rating r WHERE r.targetType = 'CONSULTANT' AND r.isActive = true AND r.rating = :rating AND "
                        +
                        "(LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Rating> searchConsultationWithRatingFilter(@Param("keyword") String keyword,
                        @Param("rating") Integer rating, Pageable pageable);

        // Tìm kiếm trong STI service comments
        @Query("SELECT r FROM Rating r WHERE r.targetType = 'STI_SERVICE' AND r.isActive = true AND " +
                        "(LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Rating> searchSTIServiceInComments(@Param("keyword") String keyword, Pageable pageable);

        // Tìm kiếm trong STI service comments với filter rating
        @Query("SELECT r FROM Rating r WHERE r.targetType = 'STI_SERVICE' AND r.isActive = true AND r.rating = :rating AND "
                        +
                        "(LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Rating> searchSTIServiceWithRatingFilter(@Param("keyword") String keyword, @Param("rating") Integer rating,
                        Pageable pageable);

        // Tìm kiếm trong STI package comments
        @Query("SELECT r FROM Rating r WHERE r.targetType = 'STI_PACKAGE' AND r.isActive = true AND " +
                        "(LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Rating> searchSTIPackageInComments(@Param("keyword") String keyword, Pageable pageable);

        // Tìm kiếm trong STI package comments với filter rating
        @Query("SELECT r FROM Rating r WHERE r.targetType = 'STI_PACKAGE' AND r.isActive = true AND r.rating = :rating AND "
                        +
                        "(LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(r.staffReply) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Rating> searchSTIPackageWithRatingFilter(@Param("keyword") String keyword,
                        @Param("rating") Integer rating, Pageable pageable);

        // Lấy top testimonials cho homepage
        @Query("SELECT r FROM Rating r WHERE r.isActive = true AND r.comment IS NOT NULL AND LENGTH(r.comment) > 5 " +
                        "ORDER BY r.rating DESC, r.createdAt DESC")
        List<Rating> findTopTestimonials(Pageable pageable);
}
