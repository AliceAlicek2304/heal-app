import React from 'react';
import { authService } from '../../../services/authService';
import styles from './ConsultantDetailModal.module.css';

const ConsultantDetailModal = ({ consultant, onClose, onBookConsultation }) => {
    if (!consultant) return null;

    const handleBooking = () => {
        onClose();
        onBookConsultation(consultant);
    };

    const getAvatarUrl = (avatar) => {
        return authService.getAvatarUrl(avatar);
    };

    const handleAvatarError = (e) => {
        e.target.src = '/img/avatar/default.jpg';
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Thông tin chuyên gia</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.consultantProfile}>
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

                        <div className={styles.profileInfo}>
                            <h3 className={styles.name}>{consultant.fullName}</h3>

                            <div className={styles.availability}>
                                <span className={styles.availabilityIcon}>●</span>
                                <span>Sẵn sàng tư vấn</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.detailsSection}>
                        {consultant.qualifications && (
                            <div className={styles.detailItem}>
                                <h4>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                    </svg>
                                    Chuyên môn
                                </h4>
                                <p>{consultant.qualifications}</p>
                            </div>
                        )}

                        {consultant.experience && (
                            <div className={styles.detailItem}>
                                <h4>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12,6 12,12 16,14"></polyline>
                                    </svg>
                                    Kinh nghiệm
                                </h4>
                                <p>{consultant.experience} năm kinh nghiệm trong lĩnh vực tư vấn sức khỏe</p>
                            </div>
                        )}

                        {/* Có thể thêm thông tin khác nếu có */}
                        {consultant.description && (
                            <div className={styles.detailItem}>
                                <h4>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14,2 14,8 20,8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10,9 9,9 8,9"></polyline>
                                    </svg>
                                    Mô tả
                                </h4>
                                <p>{consultant.description}</p>
                            </div>
                        )}

                        <div className={styles.detailItem}>
                            <h4>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                Thông tin tư vấn
                            </h4>
                            <div className={styles.consultationInfo}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>⏱️</span>
                                    <span>Thời lượng: 2 giờ</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>💻</span>
                                    <span>Hình thức: Tư vấn trực tuyến 1-1</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>🆓</span>
                                    <span>Chi phí: Miễn phí</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Đóng
                    </button>
                    <button className={styles.bookButton} onClick={handleBooking}>
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
        </div>
    );
};

export default ConsultantDetailModal;
