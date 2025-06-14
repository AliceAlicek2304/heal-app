import React, { useState } from 'react';
import { ratingService } from '../../../services/ratingService';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './RatingModal.module.css';

const RatingModal = ({
    targetType,
    targetId,
    targetName,
    onClose,
    onSuccess,
    existingRating = null,
    consultationId = null, stiTestId = null
}) => {
    const [rating, setRating] = useState(existingRating?.rating || 0);
    const [comment, setComment] = useState(existingRating?.comment || '');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const { user, isAuthenticated } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check authentication first
        if (!isAuthenticated || !user) {
            toast.error('Vui lòng đăng nhập để đánh giá');
            onClose();
            return;
        }

        if (rating === 0) {
            toast.error('Vui lòng chọn số sao đánh giá');
            return;
        }        try {
            setLoading(true);
            
            let response;
            if (existingRating && existingRating.ratingId) {
                // Update existing rating
                response = await ratingService.updateRating(existingRating.ratingId, {
                    rating,
                    comment
                });
            } else {
                // Create new rating (one rating per consultation/sti_test)
                response = await ratingService.submitRating({
                    targetType: targetType.toLowerCase(),
                    targetId,
                    rating,
                    comment,
                    consultationId,
                    stiTestId
                });
            }

            if (response.success) {
                toast.success(existingRating ? 'Cập nhật đánh giá thành công!' : 'Gửi đánh giá thành công!');
                onSuccess && onSuccess(response.data);
            } else {
                toast.error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            toast.error('Có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const renderStarRating = () => {
        return (
            <div className={styles.starRating}>
                {Array.from({ length: 5 }, (_, index) => {
                    const starValue = index + 1;
                    return (
                        <button
                            key={index}
                            type="button"
                            className={`${styles.starButton} ${starValue <= rating ? styles.starActive : ''}`}
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setRating(starValue)}
                        >
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill={starValue <= rating ? "#fbbf24" : "none"}
                                stroke={starValue <= rating ? "#fbbf24" : "#d1d5db"}
                                strokeWidth="2"
                            >
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                            </svg>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles.modalOverlay} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>                <div className={styles.modalHeader}>
                    <h3>{existingRating ? 'Chỉnh sửa đánh giá' : 'Đánh giá dịch vụ'}</h3>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    type="button"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        {!isAuthenticated || !user ? (
                            <div className={styles.authRequired}>
                                <div className={styles.authIcon}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <h4>Đăng nhập để đánh giá</h4>
                                <p>Bạn cần đăng nhập để có thể đánh giá dịch vụ này</p>
                                <button
                                    type="button"
                                    className={styles.loginBtn}
                                    onClick={onClose}
                                >
                                    Đóng
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className={styles.serviceInfo}>
                                    <p><strong>{targetName}</strong></p>
                                    <p>Hãy chia sẻ trải nghiệm của bạn để giúp người khác</p>
                                </div>                        <div className={styles.ratingSection}>
                                    <label>Đánh giá của bạn:</label>
                                    {renderStarRating()}
                                </div>

                                <div className={styles.commentSection}>
                                    <label htmlFor="comment">Nhận xét (tùy chọn):</label>
                                    <textarea
                                        id="comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Chia sẻ trải nghiệm của bạn..."
                                        maxLength={500}
                                        rows={4}
                                    />
                                    <div className={styles.characterCount}>
                                        {comment.length}/500
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {isAuthenticated && user && (
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={onClose}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading || rating === 0}
                            >
                                {loading ? 'Đang gửi...' : (existingRating ? 'Cập nhật' : 'Gửi đánh giá')}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
