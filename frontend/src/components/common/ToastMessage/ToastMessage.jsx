import React, { useState, useEffect } from 'react';
import './ToastMessage.css';

const ToastMessage = ({ message, type = 'success', duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) setTimeout(onClose, 300); // Chờ animation kết thúc rồi mới gọi onClose
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast-message ${type} ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {type === 'success' && <i className="fas fa-check-circle"></i>}
                    {type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                    {type === 'info' && <i className="fas fa-info-circle"></i>}
                    {type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                </div>
                <div className="toast-message-text">{message}</div>
                <button className="toast-close" onClick={() => {
                    setIsVisible(false);
                    if (onClose) setTimeout(onClose, 300);
                }}>
                    <i className="fas fa-times"></i>
                </button>
            </div>
            <div className="toast-progress-bar">
                <div
                    className="toast-progress"
                    style={{ animationDuration: `${duration}ms` }}
                ></div>
            </div>
        </div>
    );
};

export default ToastMessage;