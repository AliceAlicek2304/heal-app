import React, { createContext, useState, useContext } from 'react';
import ToastMessage from '../components/common/ToastMessage/ToastMessage';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success', duration = 5000) => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
        return id;
    };

    const hideToast = (id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    const success = (message, duration) => showToast(message, 'success', duration);
    const error = (message, duration) => showToast(message, 'error', duration);
    const info = (message, duration) => showToast(message, 'info', duration);
    const warning = (message, duration) => showToast(message, 'warning', duration);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, success, error, info, warning }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastMessage
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => hideToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);