import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ratingService } from '../../services/ratingService';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Pagination from '../../components/common/Pagination/Pagination';
import styles from './AllRatings.module.css';

const AllRatings = () => {
    const { targetType, targetId } = useParams();
    const navigate = useNavigate();
    const toast = useToast(); const [ratings, setRatings] = useState([]);
    const [ratingStats, setRatingStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = 10; useEffect(() => {
        if (targetType && targetId) {
            fetchData();
        }
    }, [targetType, targetId, currentPage]);

    const fetchData = async () => {
        setError(null);
        await Promise.all([fetchRatings(), fetchRatingStats()]);
    }; const fetchRatings = async () => {
        try {
            setLoading(true);
            // Convert kebab-case to snake_case for API
            const apiTargetType = targetType.replace('-', '_');
            const response = await ratingService.getRatings(apiTargetType, targetId, currentPage, itemsPerPage);

            if (response.success) {
                // Handle nested data structure if present
                let processedRatings = [];
                if (response.data?.content) {
                    processedRatings = response.data.content;
                } else if (response.data?.data?.content) {
                    processedRatings = response.data.data.content;
                } else if (Array.isArray(response.data)) {
                    processedRatings = response.data;
                } else {
                    processedRatings = [];
                } setRatings(processedRatings);
                setTotalPages(response.data?.totalPages || response.data?.data?.totalPages || Math.ceil(processedRatings.length / itemsPerPage));
            } else {
                setError(response.message || 'Không thể tải danh sách đánh giá');
                toast.error(response.message || 'Không thể tải danh sách đánh giá');
            }
        } catch (error) {
            console.error('Error fetching ratings:', error);
            setError('Có lỗi xảy ra khi tải đánh giá');
            toast.error('Có lỗi xảy ra khi tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const fetchRatingStats = async () => {
        try {
            // Convert kebab-case to snake_case for API
            const apiTargetType = targetType.replace('-', '_');
            const response = await ratingService.getRatingStats(apiTargetType, targetId);

            if (response.success) {
                // Handle nested data structure if present
                let statsData = null;
                if (response.data?.data) {
                    statsData = response.data.data;
                } else {
                    statsData = response.data;
                }
                setRatingStats(statsData);
            } else {
                console.warn('Could not fetch rating stats:', response.message);
                // Don't show error toast for stats as it's not critical
            }
        } catch (error) {
            console.error('Error fetching rating stats:', error);
            // Don't show error toast for stats as it's not critical
        }
    }; const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleRetry = () => {
        fetchData();
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <svg
                key={index}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={index < rating ? "#fbbf24" : "none"}
                stroke={index < rating ? "#fbbf24" : "#d1d5db"}
                strokeWidth="2"
                className={styles.star}
            >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
            </svg>
        ));
    }; const formatDate = (dateString) => {
        if (!dateString) return '';

        try {
            // Handle different date formats
            let date;
            if (Array.isArray(dateString)) {
                // Handle Java timestamp array [2025, 6, 14, ...]
                const [year, month, day] = dateString;
                date = new Date(year, month - 1, day);
            } else {
                date = new Date(dateString);
            }

            // Check if it's a valid date
            if (isNaN(date.getTime())) {
                return '';
            }

            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    }; const getTargetTypeText = () => {
        if (targetType === 'consultant') {
            return 'Chuyên gia tư vấn';
        } else if (targetType === 'sti-service') {
            return 'Dịch vụ xét nghiệm STI';
        }
        return 'Dịch vụ';
    }; if (loading && currentPage === 0) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải đánh giá...</p>
            </div>
        );
    }

    if (error && ratings.length === 0) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3>Có lỗi xảy ra</h3>
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={handleRetry}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <polyline points="1,20 1,14 7,14"></polyline>
                        <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,4.36L23,14"></path>
                    </svg>
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className={styles.allRatings}>
            <div className={styles.header}>
                <button
                    className={styles.backBtn}
                    onClick={handleBack}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                    Quay lại
                </button>                <div className={styles.titleSection}>
                    <h1 className={styles.title}>
                        Tất cả đánh giá
                    </h1>
                    <p className={styles.subtitle}>
                        {getTargetTypeText()} • {ratingStats?.totalRatings || ratings.length} đánh giá
                    </p>
                </div>
            </div>

            {/* Rating Statistics */}
            {ratingStats && (
                <div className={styles.statsSection}>
                    <div className={styles.overallRating}>
                        <div className={styles.ratingNumber}>
                            {ratingStats.averageRating?.toFixed(1) || '0.0'}
                        </div>
                        <div className={styles.ratingStars}>
                            {renderStars(Math.round(ratingStats.averageRating || 0))}
                        </div>
                        <div className={styles.totalRatings}>
                            {ratingStats.totalRatings || 0} đánh giá
                        </div>
                    </div>                    <div className={styles.ratingDistribution}>
                        {[5, 4, 3, 2, 1].map(star => {
                            // Handle different data structure names
                            const distributionData = ratingStats.ratingDistribution || ratingStats.starDistribution || {};
                            const count = distributionData[star] || 0;
                            const totalRatings = ratingStats.totalRatings || 0;
                            const percentage = totalRatings > 0
                                ? (count / totalRatings * 100).toFixed(1)
                                : 0;

                            return (
                                <div key={star} className={styles.distributionRow}>
                                    <span className={styles.starLabel}>{star} sao</span>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className={styles.countLabel}>({count})</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}            {/* Ratings List */}
            <div className={styles.ratingsList}>
                {loading && currentPage > 0 && (
                    <div className={styles.pageLoadingContainer}>
                        <LoadingSpinner />
                        <p>Đang tải trang {currentPage + 1}...</p>
                    </div>
                )}

                {ratings.length === 0 && !loading ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                            </svg>
                        </div>
                        <h3>Chưa có đánh giá nào</h3>
                        <p>Hãy là người đầu tiên đánh giá {getTargetTypeText().toLowerCase()}!</p>
                        <button className={styles.backBtn} onClick={handleBack}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15,18 9,12 15,6"></polyline>
                            </svg>
                            Quay lại
                        </button>
                    </div>
                ) : (
                    <>
                        {ratings.map((rating) => (
                            <div key={rating.ratingId} className={styles.ratingCard}>                                <div className={styles.ratingHeader}>
                                <div className={styles.ratingInfo}>
                                    <div className={styles.ratingStars}>
                                        {renderStars(rating.rating)}
                                    </div>
                                    <span className={styles.ratingValue}>
                                        {rating.rating}/5
                                    </span>
                                </div>
                                <div className={styles.ratingDate}>
                                    {formatDate(rating.createdAt || rating.date || rating.timestamp)}
                                </div>
                            </div>

                                <div className={styles.ratingContent}>
                                    <div className={styles.raterInfo}>
                                        <strong className={styles.raterName}>
                                            {rating.raterName ||
                                                rating.userName ||
                                                rating.user?.fullName ||
                                                rating.user?.username ||
                                                'Người dùng HealApp'}
                                        </strong>
                                    </div>                                    {rating.comment && (
                                        <div className={styles.ratingComment}>
                                            {rating.comment}
                                        </div>
                                    )}

                                    {/* Hiển thị phản hồi từ nhân viên */}
                                    {rating.staffReply && (
                                        <div className={styles.staffReplySection}>
                                            <div className={styles.staffReplyHeader}>
                                                <span>Phản hồi của nhân viên:</span>
                                            </div>
                                            <div className={styles.staffReplyContent}>
                                                {typeof rating.staffReply === 'string' ? rating.staffReply :
                                                    (rating.staffReply?.content || rating.staffReply?.staffReply || '')}
                                            </div>
                                            <div className={styles.staffReplyMeta}>
                                                <span>{rating.repliedByName || 'Nhân viên'}</span>
                                                <span>{formatDate(rating.repliedAt)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AllRatings;
