// ConsultantCard.jsx
import React from 'react';
import styles from './ConsultantCard.module.css';

const ConsultantCard = ({ consultant, onBookConsultation, onAuthRequired }) => {
    const handleBooking = () => {
        onBookConsultation(consultant);
    };

    return (
        <div className={styles.consultantCard}>
            <div className={styles.consultantInfo}>
                <div className={styles.avatar}>
                    {consultant.avatar ? (
                        <img src={consultant.avatar} alt={consultant.fullName} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {consultant.fullName?.charAt(0) || 'C'}
                        </div>
                    )}
                </div>

                <div className={styles.details}>
                    <h3 className={styles.name}>{consultant.fullName}</h3>

                    {consultant.qualifications && (
                        <p className={styles.qualifications}>
                            <span className={styles.label}>Chuyên môn:</span>
                            {consultant.qualifications}
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