import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import RatingBadge from '../../common/RatingBadge/RatingBadge';
import RatingQuickView from '../../common/RatingQuickView/RatingQuickView';
import styles from './ConsultantCard.module.css';

const ConsultantCard = ({ consultant, onBookConsultation, onViewDetails, onAuthRequired }) => {
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [refreshRating, setRefreshRating] = useState(0);

    const handleBooking = () => {
        onBookConsultation(consultant);
    };

    const handleViewDetails = () => {
        onViewDetails(consultant);
    }; const handleRatingClick = () => {
        setShowRatingModal(true);
    };

    const handleRatingSuccess = () => {
        setShowRatingModal(false);
        setRefreshRating(prev => prev + 1);
    };

    const getAvatarUrl = (avatar) => {
        if (!avatar) return authService.getAvatarUrl('/img/avatar/default.jpg');
        // Nếu avatar đã là url tuyệt đối thì giữ nguyên
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
            return avatar;
        }
        // Luôn dùng authService.getAvatarUrl để sinh url đúng chuẩn backend
        return authService.getAvatarUrl(avatar.replace(/^.*[\\/]/, ''));
    };

    const handleAvatarError = (e) => {
        e.target.src = '/img/avatar/default.jpg';
    };    // Function to truncate text to 2 lines
    const truncateText = (text, maxLength = 80) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }; return (
        <>
            <div className={styles.consultantCard}>
                <div className={styles.consultantInfo}>
                    <div className={styles.avatar}>
                        {consultant.avatar ? (
                            <img
                                src={getAvatarUrl(consultant.avatar)}
                                alt={consultant.fullName}
                                onError={handleAvatarError}
                            />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {consultant.fullName?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                        )}
                    </div>

                    <div className={styles.details}>
                        <h3 className={styles.name}>{consultant.fullName}</h3>

                        {consultant.qualifications && (
                            <p className={styles.qualifications}>
                                <span className={styles.label}>Chuyên môn:</span>
                                <span className={styles.truncatedText}>
                                    {truncateText(consultant.qualifications)}
                                </span>
                            </p>
                        )}

                        {consultant.experience && (
                            <p className={styles.experience}>
                                <span className={styles.label}>Kinh nghiệm:</span>
                                {consultant.experience} năm
                            </p>
                        )}

                        <div className={styles.availability}>
                            <span className={styles.availabilityIcon}>●</span>
                            <span>Sẵn sàng tư vấn</span>
                        </div>

                        {/* Rating Section */}
                        <div className={styles.ratingSection}>
                            <RatingBadge
                                targetType="consultant"
                                targetId={consultant.userId || consultant.profileId || consultant.id}
                                onClick={handleRatingClick}
                                size="small"
                                minimal={true}
                                refreshTrigger={refreshRating}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.detailButton}
                        onClick={handleViewDetails}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        Chi tiết
                    </button>

                    <button
                        className={styles.bookButton}
                        onClick={handleBooking}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Đặt lịch
                    </button>
                </div>
            </div>            {/* Rating Quick View Modal */}
            {showRatingModal && (
                <RatingQuickView
                    targetType="consultant"
                    targetId={consultant.userId || consultant.profileId || consultant.id}
                    targetName={consultant.fullName}
                    onClose={() => setShowRatingModal(false)}
                    onRefresh={handleRatingSuccess}
                    refreshTrigger={refreshRating}
                />
            )}
        </>
    );
};

export default ConsultantCard;