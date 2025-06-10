import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import styles from './ConsultantCard.module.css';

const ConsultantCard = ({ consultant, onBookConsultation, onAuthRequired }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleBooking = () => {
        onBookConsultation(consultant);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const getAvatarUrl = (avatar) => {
        if (!avatar) return '/img/avatar/default.jpg';

        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
            return avatar;
        }
        return authService.getAvatarUrl(avatar);
    };
    const handleAvatarError = (e) => {
        e.target.src = '/img/avatar/default.jpg';
    };    return (
        <div className={`${styles.consultantCard} ${isExpanded ? styles.expanded : ''}`}>
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

                    {/* Phần thông tin cơ bản - luôn hiển thị */}
                    {consultant.qualifications && (
                        <div className={styles.qualifications}>
                            <span className={styles.label}>Chuyên môn:</span>
                            <div className={isExpanded ? styles.fullContent : styles.truncatedContent}>
                                {consultant.qualifications}
                            </div>
                        </div>
                    )}

                    {consultant.experience && (
                        <div className={styles.experience}>
                            <span className={styles.label}>Kinh nghiệm:</span>
                            <div className={isExpanded ? styles.fullContent : styles.truncatedContent}>
                                {consultant.experience}
                            </div>
                        </div>
                    )}

                    {/* Bio chỉ hiển thị khi expanded */}
                    {consultant.bio && (
                        <div className={`${styles.bio} ${isExpanded ? styles.visible : styles.hidden}`}>
                            <span className={styles.label}>Giới thiệu:</span>
                            <div className={styles.fullContent}>
                                {consultant.bio}
                            </div>
                        </div>
                    )}

                    {/* Nút xem thêm/thu gọn */}
                    {(consultant.qualifications || consultant.experience || consultant.bio) && (
                        <button 
                            className={styles.toggleButton}
                            onClick={toggleExpanded}
                        >
                            {isExpanded ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="18,15 12,9 6,15"></polyline>
                                    </svg>
                                    Thu gọn
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6,9 12,15 18,9"></polyline>
                                    </svg>
                                    Xem thêm
                                </>
                            )}
                        </button>
                    )}

                    <div className={styles.availability}>
                        <span className={styles.availabilityIcon}>●</span>
                        <span>Sẵn sàng tư vấn</span>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
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
                    Đặt lịch tư vấn
                </button>
            </div>
        </div>
    );
};

export default ConsultantCard;