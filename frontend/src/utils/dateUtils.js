/**
 * Utility functions for handling date and time formatting
 */

/**
 * Safely parse date from various formats and return a valid Date object
 * @param {string|Date|Array} dateInput - Date string, Date object, or array format
 * @returns {Date|null} - Valid Date object or null if parsing fails
 */
export const parseDate = (dateInput) => {
    if (!dateInput) return null;

    // If already a Date object, return it
    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    // Handle array format from backend: [2025, 6, 6, 10, 47, 20, 645941000]
    if (Array.isArray(dateInput)) {
        try {
            const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = dateInput;
            if (year && month && day) {
                const date = new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
                return isNaN(date.getTime()) ? null : date;
            }
        } catch (error) {
            console.warn('Error parsing array date format:', error);
        }
        return null;
    }

    // If it's a string, try to parse it
    if (typeof dateInput === 'string') {
        // Handle ISO format with microseconds (e.g., "2024-12-10T15:30:45.123456")
        const isoMicroRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?$/;
        if (isoMicroRegex.test(dateInput)) {
            const date = new Date(dateInput);
            return isNaN(date.getTime()) ? null : date;
        }

        // Handle ISO format (e.g., "2024-12-10T15:30:45" or "2024-12-10T15:30:45.123")
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?$/;
        if (isoDateRegex.test(dateInput)) {
            const date = new Date(dateInput);
            return isNaN(date.getTime()) ? null : date;
        }

        // Handle ISO format with timezone (e.g., "2024-12-10T15:30:45Z" or "2024-12-10T15:30:45+07:00")
        const isoWithTzRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;
        if (isoWithTzRegex.test(dateInput)) {
            const date = new Date(dateInput);
            return isNaN(date.getTime()) ? null : date;
        }

        // Handle date only format (e.g., "2024-12-10")
        const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateOnlyRegex.test(dateInput)) {
            const date = new Date(dateInput + 'T00:00:00');
            return isNaN(date.getTime()) ? null : date;
        }

        // Handle timestamp format (string of numbers)
        if (/^\d+$/.test(dateInput)) {
            const timestamp = parseInt(dateInput, 10);
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? null : date;
        }

        // Try to parse as general date string
        try {
            const date = new Date(dateInput);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            console.warn('Error parsing date string:', error);
        }
    }

    // Handle numeric timestamp
    if (typeof dateInput === 'number') {
        try {
            const date = new Date(dateInput);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            console.warn('Error parsing numeric timestamp:', error);
        }
    }

    return null;
};

/**
 * Format date to Vietnamese locale string
 * @param {string|Date} dateInput - Date string or Date object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string or fallback message
 */
export const formatDateTime = (dateInput, options = {}) => {
    const date = parseDate(dateInput);
    if (!date) return 'Không có thông tin';

    const defaultOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };

    try {
        return date.toLocaleString('vi-VN', defaultOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return date.toString();
    }
};

/**
 * Format date only (without time)
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateInput) => {
    return formatDateTime(dateInput, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

/**
 * Format time only (without date)
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} - Formatted time string
 */
export const formatTime = (dateInput) => {
    return formatDateTime(dateInput, {
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Get relative time (e.g., "2 giờ trước", "1 ngày trước")
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return 'Không có thông tin';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return 'Vừa xong';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
    } else {
        return formatDate(date);
    }
};

/**
 * Check if a date is today
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {boolean} - True if date is today
 */
export const isToday = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return false;

    const today = new Date();
    return date.toDateString() === today.toDateString();
};

/**
 * Check if a date is in the future
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {boolean} - True if date is in the future
 */
export const isFuture = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return false;

    return date.getTime() > new Date().getTime();
};

/**
 * Check if a date is in the past
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {boolean} - True if date is in the past
 */
export const isPast = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return false;

    return date.getTime() < new Date().getTime();
};
