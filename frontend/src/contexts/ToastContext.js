import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import ToastMessage from '../components/common/ToastMessage/ToastMessage';
import styles from './ToastContext.module.css';

const ToastContext = createContext();

export const ToastProvider = ({ children, maxToasts = 5, position = 'top-right' }) => {
    const [toasts, setToasts] = useState([]);
    const toastTimeouts = useRef(new Map());

    // Cleanup timeouts when component unmounts
    useEffect(() => {
        return () => {
            toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
            toastTimeouts.current.clear();
        };
    }, []);

    const generateId = useCallback(() => {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 5000, options = {}) => {
        const id = generateId();
        const newToast = {
            id,
            message,
            type,
            duration,
            position: options.position || position,
            ...options
        };

        setToasts(prevToasts => {
            const updatedToasts = [...prevToasts, newToast];

            // Limit number of toasts
            if (updatedToasts.length > maxToasts) {
                const toastsToRemove = updatedToasts.slice(0, updatedToasts.length - maxToasts);
                toastsToRemove.forEach(toast => {
                    if (toastTimeouts.current.has(toast.id)) {
                        clearTimeout(toastTimeouts.current.get(toast.id));
                        toastTimeouts.current.delete(toast.id);
                    }
                });
                return updatedToasts.slice(-maxToasts);
            }

            return updatedToasts;
        });

        // Set up auto-dismiss timeout
        if (duration > 0) {
            const timeoutId = setTimeout(() => {
                hideToast(id);
            }, duration);
            toastTimeouts.current.set(id, timeoutId);
        }

        return id;
    }, [generateId, maxToasts, position]);

    // Completely rewritten hideToast function with robust error handling
    const hideToast = useCallback((id) => {
        console.log('Hiding toast with ID:', id);

        // Directly set new state with the toast filtered out
        setToasts(prevToasts => {
            console.log('Current toasts before removal:', prevToasts.map(t => t.id));

            // Simple filter approach with explicit string comparison
            const filteredToasts = prevToasts.filter(toast => String(toast.id) !== String(id));

            console.log('Toasts after removal:', filteredToasts.map(t => t.id));
            return filteredToasts;
        });

        // Clean up any timeouts
        if (toastTimeouts.current.has(id)) {
            clearTimeout(toastTimeouts.current.get(id));
            toastTimeouts.current.delete(id);
        }
    }, []);

    const hideAllToasts = useCallback(() => {
        toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
        toastTimeouts.current.clear();
        setToasts([]);
    }, []);

    // Enhanced type methods with better default durations
    const success = useCallback((message, duration = 3000, options = {}) =>
        showToast(message, 'success', duration, options),
        [showToast]
    );

    const error = useCallback((message, duration = 5000, options = {}) =>
        showToast(message, 'error', duration, options),
        [showToast]
    );

    const warning = useCallback((message, duration = 4000, options = {}) =>
        showToast(message, 'warning', duration, options),
        [showToast]
    );

    const info = useCallback((message, duration = 3000, options = {}) =>
        showToast(message, 'info', duration, options),
        [showToast]
    );

    // Group toasts by position for better organization
    const groupedToasts = toasts.reduce((groups, toast) => {
        const pos = toast.position || position;
        if (!groups[pos]) {
            groups[pos] = [];
        }
        groups[pos].push(toast);
        return groups;
    }, {});

    const contextValue = {
        showToast,
        hideToast,
        hideAllToasts,
        success,
        error,
        warning,
        info,
        toasts,
        toastCount: toasts.length
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Render toast containers for each position */}
            {Object.entries(groupedToasts).map(([pos, positionToasts]) => (
                <div
                    key={pos}
                    className={`${styles.toastContainer} ${styles[pos.replace('-', '')]}`}
                    data-position={pos}
                >
                    {positionToasts.map(toast => (
                        <ToastMessage
                            key={toast.id}
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            position={toast.position}
                            // CRITICAL FIX: Create a specific handler for each toast
                            onClose={(toastId) => {
                                console.log('Close button clicked for toast:', toastId);
                                hideToast(toastId);
                            }}
                        />
                    ))}
                </div>
            ))}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Helper hook for common toast patterns
export const useToastNotifications = () => {
    const toast = useToast();

    const notifySuccess = useCallback((message) => {
        return toast.success(message);
    }, [toast]);

    const notifyError = useCallback((message) => {
        return toast.error(message);
    }, [toast]);

    const notifyInfo = useCallback((message) => {
        return toast.info(message);
    }, [toast]);

    const notifyWarning = useCallback((message) => {
        return toast.warning(message);
    }, [toast]);

    return {
        notifySuccess,
        notifyError,
        notifyInfo,
        notifyWarning,
        clearAll: toast.hideAllToasts
    };
};