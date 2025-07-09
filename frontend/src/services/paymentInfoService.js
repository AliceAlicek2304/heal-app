const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const paymentInfoService = {
    // Lấy danh sách thẻ đã lưu của user
    getMyCards: async (onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payment-info/my-cards`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to fetch saved cards' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Lấy thẻ mặc định
    getDefaultCard: async (onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payment-info/default`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to fetch default card' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Thêm thẻ mới
    addCard: async (cardData, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payment-info/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cardData)
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to add card' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Cập nhật thẻ
    updateCard: async (paymentInfoId, cardData, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payment-info/${paymentInfoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cardData)
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to update card' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Xóa thẻ
    deleteCard: async (paymentInfoId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payment-info/${paymentInfoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to delete card' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Đặt thẻ làm mặc định
    setDefaultCard: async (paymentInfoId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payment-info/${paymentInfoId}/set-default`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to set default card' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Helper function để format số thẻ
    formatCardNumber: (cardNumber) => {
        if (!cardNumber) return '';
        const cleaned = cardNumber.replace(/\s/g, '');
        const match = cleaned.match(/(\d{1,4})/g);
        return match ? match.join(' ') : cleaned;
    },

    // Helper function để mask số thẻ
    maskCardNumber: (cardNumber) => {
        if (!cardNumber) return '**** **** **** ****';
        const cleaned = cardNumber.replace(/\s/g, '');
        if (cleaned.length < 4) return '**** **** **** ****';
        return '**** **** **** ' + cleaned.slice(-4);
    },

    // Helper function để validate thẻ
    validateCard: (cardData) => {
        const errors = {};

        if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length !== 16) {
            errors.cardNumber = 'Số thẻ phải có 16 chữ số';
        }

        if (!cardData.expiryMonth || !cardData.expiryYear) {
            errors.expiryDate = 'Vui lòng nhập ngày hết hạn';
        } else {
            const month = parseInt(cardData.expiryMonth);
            const year = parseInt(cardData.expiryYear);
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;

            if (month < 1 || month > 12) {
                errors.expiryDate = 'Tháng không hợp lệ';
            } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
                errors.expiryDate = 'Thẻ đã hết hạn';
            }
        }

        if (!cardData.cvc || cardData.cvc.length < 3) {
            errors.cvc = 'CVC phải có 3-4 chữ số';
        }

        if (!cardData.cardHolderName || cardData.cardHolderName.trim().length === 0) {
            errors.cardHolderName = 'Vui lòng nhập tên chủ thẻ';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}; 