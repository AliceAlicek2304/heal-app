import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const consultationService = {    // Lấy danh sách consultant
    getAllConsultants: async (onAuthRequired = null) => {
        try {
            // Sử dụng fetch trực tiếp vì đây là endpoint public
            const response = await fetch(`${API_BASE_URL}/consultations/consultants`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching consultants:', error);
            return {
                success: false,
                message: 'Không thể tải danh sách consultant'
            };
        }
    },    // Lấy khung giờ có sẵn
    getAvailableTimeSlots: async (consultantId, date, onAuthRequired = null) => {
        try {
            const url = `${API_BASE_URL}/consultations/available-slots?consultantId=${consultantId}&date=${date}`;
            // Sử dụng fetch trực tiếp vì đây là endpoint public
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching available time slots:', error);
            return {
                success: false,
                message: 'Không thể kết nối đến server'
            };
        }
    },

    // Lấy thông tin profile consultant
    getConsultantProfile: async (consultantId, onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/consultant/${consultantId}/profile`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                    return { success: false, message: 'Yêu cầu đăng nhập' };
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể tải thông tin consultant'
            };
        }
    },

    // Đặt lịch tư vấn
    createConsultation: async (consultationData, onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations`, {
                method: 'POST',
                body: JSON.stringify(consultationData)
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể đặt lịch tư vấn'
            };
        }
    },

    // Lấy lịch tư vấn của user
    getMyConsultations: async (onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/my-consultations`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể tải lịch tư vấn'
            };
        }
    },

    // Cập nhật trạng thái lịch tư vấn
    updateConsultationStatus: async (consultationId, status, onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/${consultationId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể cập nhật trạng thái'
            };
        }
    },

    // Hủy lịch tư vấn
    cancelConsultation: async (consultationId, onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/${consultationId}/cancel`, {
                method: 'PUT'
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể hủy lịch tư vấn'
            };
        }
    },

    // Lấy chi tiết lịch tư vấn
    getConsultationDetails: async (consultationId, onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/${consultationId}`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể tải chi tiết lịch tư vấn'
            };
        }
    },    // Lấy profile của consultant hiện tại
    getCurrentConsultantProfile: async (userFromContext = null, onAuthRequired = null) => {
        try {
            // Ưu tiên sử dụng user từ context, fallback về authService
            let user = userFromContext;
            if (!user) {
                const userResult = await authService.getCurrentUser();
                if (!userResult.success) {
                    return { success: false, message: 'Chưa đăng nhập' };
                }
                user = userResult.data;
            }

            if (!user) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            if (user.role !== 'CONSULTANT') {
                return { success: false, message: `Người dùng có role ${user.role}, cần role CONSULTANT` };
            }

            const response = await authService.apiCall(`${API_BASE_URL}/consultants/profile`, {
                method: 'GET'
            });

            // Check for various error statuses
            if (response.status === 401) {
                // Token expired or invalid
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                }
                throw new Error('401: Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            }

            if (response.status === 403) {
                throw new Error('403: Không có quyền truy cập');
            }

            if (response.status === 500) {
                throw new Error('500: Lỗi server nội bộ');
            }

            if (!response.ok) {
                throw new Error(`${response.status}: Server error`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getCurrentConsultantProfile:', error);

            // Re-throw specific errors for better handling
            if (error.message.includes('401') || error.message.includes('403')) {
                throw error;
            }

            return {
                success: false,
                message: error.message || 'Không thể tải thông tin hồ sơ'
            };
        }
    },

    // Cập nhật profile của consultant hiện tại
    updateConsultantProfile: async (profileData, onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultants/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                    return { success: false, message: 'Yêu cầu đăng nhập' };
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể cập nhật thông tin hồ sơ'
            };
        }
    },

    // Lấy lịch tư vấn được phân công cho consultant
    getConsultantSchedule: async (onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/my-consultant-schedule`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể tải lịch làm việc'
            };
        }
    },

    // Cập nhật trạng thái consultation
    updateConsultationStatus: async (consultationId, status, onAuthRequired = null) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/${consultationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.status === 401) {
                authService.logout();
                if (onAuthRequired) {
                    onAuthRequired();
                }
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            if (response.status === 403) {
                return { success: false, message: 'Không có quyền thực hiện thao tác này' };
            }

            if (!response.ok) {
                return {
                    success: false,
                    message: `Server error: ${response.status}`
                };
            }

            return response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể cập nhật trạng thái lịch tư vấn'
            };
        }
    },

    // Get all consultations for admin
    getAllConsultations: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/all`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            return {
                success: false,
                message: 'Không thể tải danh sách tư vấn'
            };
        }
    },

    // Get consultation by ID
    getConsultationById: async (consultationId) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/consultations/${consultationId}`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            return {
                success: false, message: 'Không thể tải chi tiết tư vấn'
            };
        }
    },
};

export default consultationService;