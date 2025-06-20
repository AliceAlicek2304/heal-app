import React from 'react';
import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={handleBackdropClick}>
            <div className={`${styles.modalContent} ${styles[size]}`}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>{title}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
