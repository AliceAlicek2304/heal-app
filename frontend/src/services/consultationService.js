const API_BASE_URL = 'http://localhost:8080';

export const consultationService = {
    // Lấy danh sách consultant
    getAllConsultants: async (onAuthRequired = null) => {
        try {
            const credentials = localStorage.getItem('credentials');

            const response = await fetch(`${API_BASE_URL}/consultations/consultants`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(credentials && { 'Authorization': `Basic ${credentials}` })
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                localStorage.removeItem('user');
                if (onAuthRequired) {
                    onAuthRequired();
                    return { success: false, message: 'Yêu cầu đăng nhập' };
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching consultants:', error);
            return {
                success: false,
                message: 'Không thể tải danh sách consultant'
            };
        }
    },

    // Lấy khung giờ có sẵn
    getAvailableTimeSlots: async (consultantId, date, onAuthRequired = null) => {
        try {
            const credentials = localStorage.getItem('credentials');

            const url = `${API_BASE_URL}/consultations/available-slots?consultantId=${consultantId}&date=${date}`;
            console.log('🔍 Fetching available slots from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(credentials && { 'Authorization': `Basic ${credentials}` })
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                localStorage.removeItem('user');
                if (onAuthRequired) {
                    onAuthRequired();
                    return { success: false, message: 'Yêu cầu đăng nhập' };
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    message: `Server error: ${response.status}`
                };
            }

            const data = await response.json();

            return data;
        } catch (error) {
            console.error('❌ Network error fetching available slots:', error);
            return {
                success: false,
                message: 'Không thể kết nối đến server'
            };
        }
    },

    // Lấy thông tin profile consultant
    getConsultantProfile: async (consultantId, onAuthRequired = null) => {
        try {
            const credentials = localStorage.getItem('credentials');

            const response = await fetch(`${API_BASE_URL}/consultations/consultant/${consultantId}/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(credentials && { 'Authorization': `Basic ${credentials}` })
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                localStorage.removeItem('user');
                if (onAuthRequired) {
                    onAuthRequired();
                    return { success: false, message: 'Yêu cầu đăng nhập' };
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching consultant profile:', error);
            return {
                success: false,
                message: 'Không thể tải thông tin consultant'
            };
        }
    },

    // Đặt lịch tư vấn
    createConsultation: async (consultationData, onAuthRequired = null) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/consultations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(consultationData)
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                localStorage.removeItem('user');
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating consultation:', error);
            return {
                success: false,
                message: 'Không thể đặt lịch tư vấn'
            };
        }
    },

    // Lấy lịch tư vấn của user
    getMyConsultations: async (onAuthRequired = null) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/consultations/my-consultations`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                localStorage.removeItem('user');
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching my consultations:', error);
            return {
                success: false,
                message: 'Không thể tải lịch tư vấn'
            };
        }
    },

    // Cập nhật trạng thái lịch tư vấn
    updateConsultationStatus: async (consultationId, status, onAuthRequired = null) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/consultations/${consultationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify({ status: status })
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                localStorage.removeItem('user');
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating consultation status:', error);
            return {
                success: false,
                message: 'Không thể cập nhật trạng thái'
            };
        }
    }
};