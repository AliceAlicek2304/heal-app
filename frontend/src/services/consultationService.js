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

            const response = await fetch(`${API_BASE_URL}/consultations/available-slots?staffId=${consultantId}&date=${date}`, {
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
            console.error('Error fetching available slots:', error);
            return {
                success: false,
                message: 'Không thể tải khung giờ'
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

    // Lấy giá tư vấn hiện tại
    getConsultationPrice: async (onAuthRequired = null) => {
        try {
            const credentials = localStorage.getItem('credentials');

            const response = await fetch(`${API_BASE_URL}/consultations/consultation-price`, {
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
                }
                return {
                    success: true,
                    data: 150000,
                    message: 'Sử dụng giá mặc định'
                };
            }

            if (!response.ok) {
                console.error('Response not ok:', response.status, response.statusText);
                return {
                    success: true,
                    data: 150000,
                    message: `HTTP Error: ${response.status}, sử dụng giá mặc định`
                };
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Response is not JSON:', contentType);
                return {
                    success: true,
                    data: 150000,
                    message: 'Server response is not JSON, sử dụng giá mặc định'
                };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching consultation price:', error);
            return {
                success: true,
                data: 150000,
                message: 'Không thể tải giá tư vấn, sử dụng giá mặc định'
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