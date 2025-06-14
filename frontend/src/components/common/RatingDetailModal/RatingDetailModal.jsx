import React from 'react';
import styles from './RatingDetailModal.module.css';

const RatingDetailModal = ({
    rating,
    serviceName,
    serviceType = "Dịch vụ",
    onClose,
    onEdit,
    onDelete,
    currentUserId
}) => {
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const renderStars = (ratingValue) => {
        return (
            <div className={styles.starRating}>
                {Array.from({ length: 5 }, (_, index) => {
                    const starValue = index + 1;
                    return (
                        <svg
                            key={index}
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill={starValue <= ratingValue ? "#fbbf24" : "none"}
                            stroke={starValue <= ratingValue ? "#fbbf24" : "#d1d5db"}
                            strokeWidth="2"
                            className={styles.star}
                        >
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                        </svg>
                    );
                })}
                <span className={styles.ratingValue}>({ratingValue}/5)</span>
            </div>
        );
    }; const formatDate = (dateString) => {
        if (!dateString) return 'Không xác định';
        try {
            // Handle different date formats
            let date;
            if (Array.isArray(dateString)) {
                // Java LocalDateTime array format [year, month, day, hour, minute, second, nano]
                const [year, month, day, hour = 0, minute = 0, second = 0] = dateString;
                date = new Date(year, month - 1, day, hour, minute, second);
            } else {
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) return 'Không xác định';

            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Không xác định';
        }
    };
    const canEditRating = (rating) => {
        if (!rating?.createdAt) {
            return false;
        }

        let createdAt;
        if (Array.isArray(rating.createdAt)) {
            // Java LocalDateTime array format [year, month, day, hour, minute, second, nano]
            const [year, month, day, hour = 0, minute = 0, second = 0] = rating.createdAt;
            createdAt = new Date(year, month - 1, day, hour, minute, second);
        } else {
            createdAt = new Date(rating.createdAt);
        } const now = new Date();
        const diffHours = (now - createdAt) / (1000 * 60 * 60);

        return diffHours < 48; // Temporary: increase to 48h for testing
    };

    if (!rating) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.headerIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                            </svg>
                        </div>
                        <div>
                            <h3>Đánh giá của bạn</h3>
                            <p>{serviceType}</p>
                        </div>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Đóng modal"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.serviceInfo}>
                        <h4>{serviceName}</h4>
                        <div className={styles.ratingSection}>
                            {renderStars(rating.rating)}
                        </div>
                    </div>

                    {rating.comment && (
                        <div className={styles.commentSection}>
                            <div className={styles.sectionHeader}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                                </svg>
                                <h5>Bình luận của bạn</h5>
                            </div>
                            <div className={styles.commentContent}>
                                <p>{rating.comment}</p>
                            </div>
                        </div>
                    )}

                    {rating.staffReply && (
                        <div className={styles.replySection}>
                            <div className={styles.sectionHeader}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="m21 15-3-3h-8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11z"></path>
                                    <path d="m7 17-3 3v-3h-2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"></path>
                                </svg>
                                <h5>Phản hồi từ nhà cung cấp</h5>
                            </div>
                            <div className={styles.replyContent}>
                                <p>{rating.staffReply}</p>
                                {rating.repliedBy?.name && (
                                    <div className={styles.replyAuthor}>
                                        <small>— {rating.repliedBy.name}</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={styles.metaInfo}>
                        <div className={styles.dateInfo}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            <span>Đánh giá vào {formatDate(rating.createdAt)}</span>
                        </div>
                    </div>
                </div>                <div className={styles.modalFooter}>
                    {currentUserId && rating.userId === currentUserId && canEditRating(rating) && (
                        <div className={styles.actionButtons}>
                            {onEdit && (
                                <button className={styles.editBtn} onClick={() => onEdit(rating)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="m18 2 4 4-14 14H4v-4L18 2z"></path>
                                        <path d="M21 7L17 3"></path>
                                    </svg>
                                    Chỉnh sửa
                                </button>
                            )}
                            {onDelete && (
                                <button className={styles.deleteBtn} onClick={() => onDelete(rating)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3,6 5,6 21,6"></polyline>
                                        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                                    </svg>
                                    Xóa
                                </button>)}
                        </div>
                    )}
                    <button className={styles.closeFooterBtn} onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingDetailModal;
