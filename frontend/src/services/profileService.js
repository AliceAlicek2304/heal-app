const API_BASE_URL = 'http://localhost:8080';

export const profileService = {
    // Lấy thông tin profile người dùng
    getUserProfile: async () => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật thông tin cơ bản
    updateBasicProfile: async (profileData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/users/profile/basic`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating basic profile:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Gửi mã xác thực để cập nhật email
    sendEmailVerification: async (emailData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/users/profile/email/send-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify({ email: emailData.email }) // Gửi đúng format
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending verification code:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật email
    updateEmail: async (updateData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            // Sử dụng đúng field names từ SecurityForm
            const requestBody = {
                newEmail: updateData.newEmail,
                verificationCode: updateData.verificationCode
            };

            console.log('Sending email update request:', requestBody); // Debug log

            const response = await fetch(`${API_BASE_URL}/users/profile/email`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('Email update response:', data); // Debug log
            return data;
        } catch (error) {
            console.error('Error updating email:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Thay đổi mật khẩu
    changePassword: async (passwordData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/users/profile/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(passwordData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error changing password:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật ảnh đại diện
    updateAvatar: async (file) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/users/profile/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`
                },
                body: formData
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating avatar:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    }
};