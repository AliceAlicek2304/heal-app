import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastMessage from '../components/common/ToastMessage/ToastMessage';
import './ToastContext.module.css';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = ++toastId;
        const toast = {
            id,
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        setToasts(prev => [...prev, toast]);

        // Auto remove toast after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const success = useCallback((message, duration) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const error = useCallback((message, duration) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const warning = useCallback((message, duration) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    const info = useCallback((message, duration) => {
        return addToast(message, 'info', duration);
    }, [addToast]);

    const value = {
        toasts,
        addToast,
        removeToast,
        clearAllToasts,
        success,
        error,
        warning,
        info
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastMessage
                        key={toast.id}
                        toast={toast}
                        onRemove={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};