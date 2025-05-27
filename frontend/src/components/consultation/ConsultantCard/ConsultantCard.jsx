import React, { useState, useEffect } from 'react';
import { consultationService } from '../../../services/consultationService';
import { authService } from '../../../services/authService';
import styles from './ConsultantCard.module.css';

const ConsultantCard = ({ consultant, consultationPrice, onBookConsultation }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConsultantProfile();
    }, [consultant.id]);

    const fetchConsultantProfile = async () => {
        try {
            const response = await consultationService.getConsultantProfile(consultant.id);
            if (response.success) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('Error fetching consultant profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDisplayName = () => {
        return consultant.fullName || consultant.username || 'Chuyên gia';
    };

    const getSpecialization = () => {
        return profile?.qualifications || 'Tư vấn tổng quát';
    };

    const getExperience = () => {
        return profile?.experience || 'Kinh nghiệm chuyên môn';
    };

    const getBio = () => {
        return profile?.bio || 'Thông tin chi tiết';
    };

    return (
        <div className={styles.consultantCard}>
            <div className={styles.consultantAvatar}>
                <img
                    src={authService.getAvatarUrl(consultant.avatar)}
                    alt={getDisplayName()}
                    onError={(e) => {
                        e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                    }}
                    className={styles.avatarImage}
                />
                <div className={styles.onlineStatus}></div>
            </div>

            <div className={styles.consultantInfo}>
                <div className={styles.consultantHeader}>
                    <h3 className={styles.consultantName}>{getDisplayName()}</h3>
                    <div className={styles.verifiedBadge}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,11 12,14 22,4"></polyline>
                            <path d="M21,12v7a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2V5a2,2 0 0,1,2-2h11"></path>
                        </svg>
                        <span>Verified</span>
                    </div>
                </div>

                <div className={styles.consultantDetails}>
                    <div className={styles.detailItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{getSpecialization()}</span>
                    </div>

                    <div className={styles.detailItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        <span>{getExperience()}</span>
                    </div>

                    <div className={styles.detailItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9,9h6v6H9z"></path>
                        </svg>
                        <span>{getBio()}</span>
                    </div>
                </div>

                <div className={styles.consultantPrice}>
                    <div className={styles.priceHeader}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        <span className={styles.priceText}>Giá tư vấn</span>
                    </div>
                    <span className={styles.priceAmount}>
                        {consultationPrice.toLocaleString('vi-VN')} VNĐ/giờ
                    </span>
                </div>

                <div className={styles.consultantActions}>
                    <button
                        className={styles.bookBtn}
                        onClick={() => onBookConsultation(consultant)}
                        disabled={loading}
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

            {loading && (
                <div className={styles.cardLoading}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            )}
        </div>
    );
};

export default ConsultantCard;