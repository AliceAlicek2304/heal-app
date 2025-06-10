import { authService } from './authService';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const profileService = {
    // Lấy thông tin profile người dùng
    getUserProfile: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile`, { method: 'GET' });
            if (response.status === 401) { authService.logout(); return { success: false, message: 'Chưa đăng nhập' }; }
             
            return response.json();
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật thông tin cơ bản
    updateBasicProfile: async (profileData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/basic`, { method: 'PUT', body: JSON.stringify(profileData) });
            if (response.status === 401) { authService.logout(); return { success: false, message: 'Chưa đăng nhập' }; }
             
            return response.json();
        } catch (error) {
            console.error('Error updating basic profile:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Gửi mã xác thực để cập nhật email
    sendEmailVerification: async (emailData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/email/send-verification`, { method: 'POST', body: JSON.stringify({ email: emailData.email }) });
            if (response.status === 401) { authService.logout(); return { success: false, message: 'Chưa đăng nhập' }; }

            return response.json();
        } catch (error) {
            console.error('Error sending verification code:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật email
    updateEmail: async (updateData) => {
        try {
            // Sử dụng đúng field names từ SecurityForm
            const requestBody = {
                newEmail: updateData.newEmail,
                verificationCode: updateData.verificationCode
            };

            console.log('Sending email update request:', requestBody); // Debug log

            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/email`, { method: 'PUT', body: JSON.stringify(requestBody) });
            if (response.status === 401) { authService.logout(); return { success: false, message: 'Chưa đăng nhập' }; }

            console.log('Email update response:', response); // Debug log
            return response.json();
        } catch (error) {
            console.error('Error updating email:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Thay đổi mật khẩu
    changePassword: async (passwordData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/users/profile/password`, { method: 'PUT', body: JSON.stringify(passwordData) });
            if (response.status === 401) { authService.logout(); return { success: false, message: 'Chưa đăng nhập' }; }

            return response.json();
        } catch (error) {
            console.error('Error changing password:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật ảnh đại diện
    updateAvatar: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            // Use fetch directly to send FormData with JWT header
            const headers = authService.getAuthHeader ? authService.getAuthHeader() : {};
            const response = await fetch(`${API_BASE_URL}/users/profile/avatar`, { method: 'POST', headers, body: formData });
            if (response.status === 401) { authService.logout(); return { success: false, message: 'Chưa đăng nhập' }; }

            return response.json();
        } catch (error) {
            console.error('Error updating avatar:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    }
};