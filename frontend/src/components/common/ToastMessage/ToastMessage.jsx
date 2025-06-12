import React, { useState, useEffect } from 'react';
import styles from './ToastMessage.module.css';

const ToastMessage = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Show animation
        const showTimer = setTimeout(() => {
            setIsVisible(true);
        }, 50);

        return () => clearTimeout(showTimer);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onRemove(toast.id);
        }, 300);
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                    </svg>
                );
        }
    };

    const getProgressBarDuration = () => {
        return toast.duration > 0 ? `${toast.duration}ms` : 'none';
    };

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]} ${isVisible ? styles.visible : ''
                } ${isExiting ? styles.exiting : ''}`}
        >
            <div className={styles.toastContent}>
                <div className={styles.toastIcon}>
                    {getIcon()}
                </div>
                <div className={styles.toastMessage}>
                    {toast.message}
                </div>
                <button
                    className={styles.toastClose}
                    onClick={handleClose}
                    aria-label="Đóng thông báo"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {toast.duration > 0 && (
                <div
                    className={styles.toastProgress}
                    style={{
                        animationDuration: getProgressBarDuration()
                    }}
                />
            )}
        </div>
    );
};

export default ToastMessage;