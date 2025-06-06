import React, { useState, useEffect, useRef } from 'react';
import styles from './ToastMessage.module.css';

const ToastMessage = ({ id, message, type = 'success', duration = 5000, onClose, position = 'top-right' }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);
    const closeRef = useRef(false); // ✅ Prevent multiple close calls
    const handleClose = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (closeRef.current || isLeaving) {
            console.log('Close already in progress for toast:', id);
            return;
        }

        console.log('🔴 Closing toast:', id);
        closeRef.current = true;
        setIsLeaving(true);

        if (typeof onClose === 'function') {
            onClose(id);
        }

        setTimeout(() => {
            setIsVisible(false);
        }, 300);
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                );
            case 'error':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                );
            case 'warning':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                );
            case 'info':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                );
            default:
                return null;
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className={`${styles.toastMessage} ${styles[type]} ${styles[position.replace('-', '')]} ${isLeaving ? styles.leaving : styles.entering}`}
            data-toast-id={id}
        >
            <div className={styles.toastContainer}>
                <div className={styles.toastContent}>
                    <div className={styles.toastIcon}>
                        {getIcon()}
                    </div>
                    <div className={styles.toastText}>
                        <div className={styles.messageText}>{message}</div>
                    </div>
                </div>

                <button
                    className={styles.toastClose}
                    onClick={handleClose}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label="Đóng thông báo"
                    type="button"
                    disabled={isLeaving}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {duration > 0 && (
                <div className={styles.toastProgressBar}>
                    <div
                        className={styles.toastProgress}
                        style={{ animationDuration: `${duration}ms` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default ToastMessage;