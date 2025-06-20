import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ratingService } from '../../../services/ratingService';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDateTime } from '../../../utils/dateUtils';
import RatingModal from '../RatingModal/RatingModal';
import styles from './RatingQuickView.module.css';

const RatingQuickView = ({
    targetType,
    targetId,
    targetName,
    onClose,
    onRefresh,
    refreshTrigger = 0,
    consultationId = null,
    stiTestId = null
}) => {
    const [summary, setSummary] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRatingForm, setShowRatingForm] = useState(false);
    const [userRating, setUserRating] = useState(null);
    const [hasUserRated, setHasUserRated] = useState(false);
    const [currentPage, setCurrentPage] = useState(0); const [canRate, setCanRate] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();    // Fetch data when component mounts or refreshTrigger changes
    useEffect(() => {
        if (targetId) {
            fetchRatingData();
        }
    }, [targetId, targetType, refreshTrigger, isAuthenticated]);

    const fetchRatingData = async () => {
        try {
            setLoading(true);
            setError(null);            // Fetch rating summary
            const summaryResponse = await ratingService.getRatingStats(targetType.toLowerCase(), targetId);

            // Fetch ratings list
            const ratingsResponse = await ratingService.getRatings(targetType.toLowerCase(), targetId, 0, 5); if (summaryResponse.success) {
                // Handle nested data structure if present
                if (summaryResponse.data && summaryResponse.data.data) {
                    setSummary(summaryResponse.data.data);
                } else {
                    setSummary(summaryResponse.data);
                }
            } else {
                setError(summaryResponse.message);
            }

            if (ratingsResponse.success) {
                // Kiểm tra nếu có cấu trúc data.content hoặc data.data.content
                let processedRatings = [];

                if (ratingsResponse.data?.content) {
                    processedRatings = ratingsResponse.data.content;
                } else if (ratingsResponse.data?.data?.content) {
                    processedRatings = ratingsResponse.data.data.content;
                } else if (ratingsResponse.data?.recentRatings) {
                    // Kiểm tra nếu có recentRatings từ summary API
                    processedRatings = ratingsResponse.data.recentRatings;
                } else if (ratingsResponse.data?.data?.recentRatings) {
                    processedRatings = ratingsResponse.data.data.recentRatings;
                } else {
                    // Fallback - kiểm tra nếu data là một mảng
                    processedRatings = Array.isArray(ratingsResponse.data) ? ratingsResponse.data : [];
                }

                // Nếu không có ratings từ API ratings, thử lấy từ summary API
                if (processedRatings.length === 0 && summary?.recentRatings) {
                    processedRatings = summary.recentRatings;
                } setRatings(processedRatings);
            }

            // Disable rating functionality for read-only display
            setCanRate(false);
            setHasUserRated(false);
        } catch (error) {
            console.error('Error fetching rating data:', error);
            // Don't show error for rating data - it's not critical for viewing consultants
            // Just set empty state
            setSummary(null);
            setRatings([]);
            setError(null); // Don't show error to user
        } finally {
            setLoading(false);
        }
    };

    const handleRatingSuccess = (data) => {
        setShowRatingForm(false);
        fetchRatingData(); // Refresh data
        if (onRefresh) {
            onRefresh(); // Notify parent component
        }
    };

    const handleViewAllRatings = () => {
        const targetTypeParam = targetType.toLowerCase().replace('_', '-');
        navigate(`/all-ratings/${targetTypeParam}/${targetId}`);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const renderStars = (rating, starSize = 16) => {
        return Array.from({ length: 5 }, (_, index) => (
            <svg
                key={index}
                width={starSize}
                height={starSize}
                viewBox="0 0 24 24"
                fill={index < rating ? "#fbbf24" : "none"}
                stroke={index < rating ? "#fbbf24" : "#d1d5db"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" />
            </svg>
        ));
    }; const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            // Xử lý nhiều định dạng ngày khác nhau
            let date;
            if (Array.isArray(dateString)) {
                // Nếu là mảng timestamp từ Java [2025, 6, 14, ...]
                const [year, month, day] = dateString;
                date = new Date(year, month - 1, day);
            } else {
                date = new Date(dateString);
            }

            // Kiểm tra nếu là Invalid Date
            if (isNaN(date.getTime())) {
                return '';
            }

            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('vi-VN', options);
        } catch (e) {
            console.error('Error formatting date:', e);
            return '';
        }
    };

    const renderDistributionBars = () => {
        if (!summary || !summary.starDistribution) return null;

        const maxCount = Math.max(...Object.values(summary.starDistribution));

        return [5, 4, 3, 2, 1].map(star => {
            const count = summary.starDistribution[star] || 0;
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
                <div key={star} className={styles.distributionItem}>
                    <span className={styles.starLabel}>{star}</span>
                    <div className={styles.distributionBar}>
                        <div
                            className={styles.distributionFill}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <span className={styles.distributionCount}>{count}</span>
                </div>
            );
        });
    };

    const renderRatings = () => {
        // Nếu có tổng số đánh giá > 0 nhưng không có recent ratings, hiển thị message khác
        if ((!ratings || ratings.length === 0) && summary?.totalRatings > 0) {
            return (
                <div className={styles.noRatings}>
                    <div className={styles.noRatingsIcon}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 15s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                    </div>
                    <div className={styles.noRatingsTitle}>Đánh giá chi tiết không khả dụng</div>
                    <div className={styles.noRatingsText}>Đã có {summary?.totalRatings} đánh giá</div>
                </div>
            );
        }

        if (!ratings || ratings.length === 0) {
            return (
                <div className={styles.noRatings}>
                    <div className={styles.noRatingsIcon}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 15s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                    </div>
                    <div className={styles.noRatingsTitle}>Chưa có đánh giá</div>
                    <div className={styles.noRatingsText}>Hãy là người đầu tiên đánh giá</div>
                </div>
            );
        }

        return ratings.map((rating, index) => (
            <div key={rating.ratingId || index} className={styles.ratingItem}>                <div className={styles.ratingHeader}>
                <div className={styles.ratingStars}>
                    {renderStars(rating.rating || 0)}
                </div>
                <div className={styles.ratingDate}>
                    {formatDate(rating.createdAt || rating.date || rating.timestamp)}
                </div>
            </div>                {rating.comment && (
                <p className={styles.ratingComment}>{rating.comment}</p>
            )}                <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                        {(rating.userName || rating.user?.fullName || rating.user?.username)?.charAt(0) || 'U'}
                    </div>
                    <div className={styles.userName}>
                        {rating.userName || rating.user?.fullName || rating.user?.username || 'Người dùng HealApp'}
                    </div>
                </div>

                {/* Hiển thị phản hồi của staff nếu có */}
                {rating.staffReply && (
                    <div className={styles.staffReply || styles.ratingComment + ' ' + styles.staffReplySection}>
                        <div className={styles.staffReplyHeader || styles.ratingHeader}>
                            <strong>Phản hồi của nhân viên:</strong>
                        </div>
                        <p className={styles.staffReplyContent || styles.ratingComment}>
                            {typeof rating.staffReply === 'string' ? rating.staffReply :
                                (rating.staffReply?.content || rating.staffReply?.staffReply || '')}
                        </p>
                        <div className={styles.staffReplyMeta || styles.ratingMeta}>
                            <span>{rating.repliedByName || 'Nhân viên'}</span>
                            <span>{formatDate(rating.repliedAt)}</span>
                        </div>
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className={styles.modalOverlay} onClick={handleBackdropClick}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>                {showRatingForm ? (
                <RatingModal
                    targetType={targetType}
                    targetId={targetId}
                    targetName={targetName}
                    onClose={() => setShowRatingForm(false)}
                    onSuccess={handleRatingSuccess}
                    existingRating={null}
                />
            ) : (
                <>                    <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        Tất cả đánh giá của {targetName}
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        &times;
                    </button>
                </div>

                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.loadingSpinner}></div>
                        </div>
                    ) : error ? (
                        <div className={styles.error}>
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className={styles.ratingSummary}>
                                <div className={styles.overallRating}>
                                    <h3 className={styles.overallRatingValue}>
                                        {summary?.averageRating?.toFixed(1) || '0.0'}
                                    </h3>
                                    <div className={styles.overallRatingStars}>
                                        {renderStars(Math.round(summary?.averageRating || 0))}
                                    </div>
                                    <p className={styles.totalRatings}>
                                        {summary?.totalRatings || 0} đánh giá
                                    </p>
                                </div>

                                <div className={styles.ratingDistribution}>
                                    {renderDistributionBars()}
                                </div>
                            </div>                            {/* Section đánh giá */}                            <div className={styles.recentRatings}>
                                <h3 className={styles.sectionTitle}>
                                    Một số đánh giá gần đây
                                </h3>
                                {renderRatings()}
                            </div>                            <div className={styles.actionButtons}>
                                <button
                                    className={styles.btnSecondary}
                                    onClick={onClose}
                                >
                                    Đóng
                                </button>

                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleViewAllRatings}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                                    </svg>
                                    Tất cả đánh giá
                                </button>
                            </div>
                        </>
                    )}
                </>)}
            </div>        </div>
    );
};

export default RatingQuickView;
