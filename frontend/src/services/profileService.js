import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const profileService = {
    // Lấy thông tin profile người dùng
    getUserProfile: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật thông tin cơ bản
    updateBasicProfile: async (profileData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/basic`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Gửi mã xác thực để cập nhật email
    sendEmailVerification: async (emailData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/email/send-verification`, {
                method: 'POST',
                body: JSON.stringify({ email: emailData.email })
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật email
    updateEmail: async (updateData) => {
        try {
            const requestBody = {
                newEmail: updateData.newEmail,
                verificationCode: updateData.verificationCode
            };

            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/email`, {
                method: 'PUT',
                body: JSON.stringify(requestBody)
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Thay đổi mật khẩu
    changePassword: async (passwordData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/password`, {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật ảnh đại diện
    updateAvatar: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('authToken');
            if (!token) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/users/profile/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Phone verification services
    sendPhoneVerification: async (phoneData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/phone/send-verification`, {
                method: 'POST',
                body: JSON.stringify({ phone: phoneData.phone })
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },    verifyPhone: async (verificationData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/phone/verify`, {
                method: 'POST',
                body: JSON.stringify({
                    phone: verificationData.phone, // Send clean phone number
                    verificationCode: verificationData.otp // Use correct field name
                })
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },
};