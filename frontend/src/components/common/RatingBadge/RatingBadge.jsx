import React, { useState, useEffect } from 'react';
import { ratingService } from '../../../services/ratingService';
import styles from './RatingBadge.module.css';

const RatingBadge = ({
    targetType,
    targetId,
    onClick,
    size = 'medium',
    showCount = true,
    minimal = false,
    refreshTrigger = 0
}) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (targetId) {
            fetchRatingSummary();
        }
    }, [targetId, targetType, refreshTrigger]);

    const fetchRatingSummary = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await ratingService.getRatingStats(targetType.toLowerCase(), targetId);

            if (response.success) {
                // Kiểm tra response có cấu trúc lồng data.data không
                if (response.data && response.data.data) {
                    setSummary(response.data.data);
                } else {
                    setSummary(response.data);
                }
            } else {
                setError(response.message);
            }
        } catch (error) {
            console.error('Error fetching rating summary:', error);
            setError('Không thể tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const handleClick = () => {
        if (onClick && !loading && !error) {
            onClick();
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
    };

    // Determine size-based styling
    const sizeClass = {
        small: styles.small,
        medium: styles.medium,
        large: styles.large
    }[size] || styles.medium;

    if (loading) {
        return (
            <div className={`${styles.ratingBadge} ${sizeClass} ${styles.loading} ${minimal ? styles.minimal : ''}`}>
                <div className={styles.loadingSpinner}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.ratingBadge} ${sizeClass} ${styles.error} ${minimal ? styles.minimal : ''}`}>
                <span>!</span>
            </div>
        );
    }

    const averageRating = summary?.averageRating || 0;
    const totalRatings = summary?.totalRatings || 0;

    return (
        <div 
            className={`${styles.ratingBadge} ${sizeClass} ${onClick ? styles.clickable : ''} ${minimal ? styles.minimal : ''}`}
            onClick={handleClick}
        >
            <div className={styles.stars}>
                {renderStars(Math.round(averageRating), size === 'small' ? 12 : size === 'large' ? 18 : 14)}
            </div>
            <div className={styles.ratingInfo}>
                <span className={styles.averageRating}>{averageRating.toFixed(1)}</span>
                {showCount && (
                    <span className={styles.ratingCount}>({totalRatings})</span>
                )}
            </div>
        </div>
    );
};

export default RatingBadge;
