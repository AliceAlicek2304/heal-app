const API_BASE_URL = 'http://localhost:8080';

const createBasicAuthHeader = (username, password) => {
    return 'Basic ' + btoa(username + ':' + password);
};

export const authService = {
    // Gửi mã xác thực đến email
    sendVerificationCode: async (email) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/send-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending verification code:', error);
            throw error;
        }
    },

    // Đăng ký người dùng
    registerUser: async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    },

    // Đăng nhập người dùng
    loginUser: async (loginData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: loginData.username,
                    password: loginData.password
                })
            });

            const data = await response.json();

            // Lưu thông tin nếu đăng nhập thành công
            if (data.success && data.data) {
                // Lưu thông tin đăng nhập để tái sử dụng
                localStorage.setItem('credentials', btoa(loginData.username + ':' + loginData.password));

                const userInfo = {
                    userId: data.data.userId,
                    username: data.data.username,
                    fullName: data.data.fullName,
                    email: data.data.email,
                    avatar: data.data.avatar,
                    role: data.data.role,
                    birthDay: data.data.birthDay,
                    phone: data.data.phone
                };

                localStorage.setItem('user', JSON.stringify(userInfo));

                return {
                    success: data.success,
                    message: data.message,
                    data: {
                        user: userInfo
                    }
                };
            }

            return data;
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            return {
                success: false,
                message: 'Đã xảy ra lỗi khi đăng nhập'
            };
        }
    },

    // Lấy thông tin user hiện tại
    getCurrentUser: async () => {
        try {
            const credentials = localStorage.getItem('credentials');
            const userStr = localStorage.getItem('user');
            const storedUser = userStr ? JSON.parse(userStr) : null;

            // Nếu không có credentials nhưng có thông tin user, trả về user
            if (!credentials && storedUser) {
                return { success: true, data: storedUser };
            }

            // Nếu có credentials, thử lấy thông tin user từ server  
            if (credentials) {
                const response = await fetch(`${API_BASE_URL}/users/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 401) {
                    localStorage.removeItem('credentials');
                    return { success: true, data: storedUser };
                }

                const data = await response.json();

                if (data.success && data.data) {
                    // Format user info từ API response - MAPPING ĐÚNG TÊN TRƯỜNG
                    const userInfo = {
                        userId: data.data.id || data.data.userId,
                        username: data.data.username,
                        fullName: data.data.fullName,
                        email: data.data.email,
                        // Xử lý birthDay - có thể là LocalDate array hoặc string
                        birthDay: data.data.birthDay,
                        // Xử lý phone từ backend
                        phone: data.data.phone,
                        avatar: data.data.avatar,
                        role: data.data.role
                    };

                    localStorage.setItem('user', JSON.stringify(userInfo));
                    return { success: true, data: userInfo };
                }
            }

            return { success: true, data: storedUser };
        } catch (error) {
            console.error('Error getting current user:', error);
            const userStr = localStorage.getItem('user');
            return userStr ? { success: true, data: JSON.parse(userStr) } : { success: false };
        }
    },
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
    updateAvatar: async (file) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/users/profile/avatar`, { // Sửa từ /users/avatar thành /users/profile/avatar
                method: 'POST', // Sửa từ PUT thành POST theo backend
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
    },
    // Đăng xuất
    logout: () => {
        localStorage.removeItem('credentials');
        localStorage.removeItem('user');
    },

    // Kiểm tra trạng thái đăng nhập
    isAuthenticated: () => {
        const credentials = localStorage.getItem('credentials');
        const userStr = localStorage.getItem('user');
        return !!(credentials && userStr);
    },

    // Lấy user từ localStorage
    getUserFromStorage: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Lấy URL đầy đủ cho avatar
    getAvatarUrl: (avatarPath) => {
        if (!avatarPath) {
            return `${API_BASE_URL}/img/avatar/default.jpg`;
        }

        // Nếu là đường dẫn đầy đủ thì trả về luôn
        if (avatarPath.startsWith('http')) {
            return avatarPath;
        }

        // Nếu đã có domain thì trả về luôn
        if (avatarPath.startsWith(API_BASE_URL)) {
            return avatarPath;
        }

        // Nếu bắt đầu bằng / thì bỏ đi
        const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;

        return `${API_BASE_URL}/${cleanPath}`;
    },

    getBlogPosts: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/blog?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            throw error;
        }
    },

    // Lấy chi tiết một bài viết
    getBlogPostById: async (postId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/blog/${postId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching blog post:', error);
            throw error;
        }
    },

    // Lấy URL đầy đủ cho blog thumbnail
    getBlogImageUrl: (imagePath) => {
        if (!imagePath) {
            return `${API_BASE_URL}/img/blog/default.jpg`;
        }

        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        if (imagePath.startsWith(API_BASE_URL)) {
            return imagePath;
        }

        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return `${API_BASE_URL}/${cleanPath}`;
    },
    forgotPassword: async (email) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending reset password request:', error);
            throw error;
        }
    },

    // Đặt lại mật khẩu với mã xác thực
    resetPassword: async (email, code, newPassword) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    code,
                    newPassword
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    },
    getMenstrualCycles: async (userId) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/menstrual-cycle/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                localStorage.removeItem('user');
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();

            return data;
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    addMenstrualCycle: async (cycleData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }


            // ✅ Updated: Sử dụng endpoint mới
            const response = await fetch(`${API_BASE_URL}/menstrual-cycle/addCycle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(cycleData)
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                localStorage.removeItem('user');
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();

            return data;
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật chu kỳ kinh nguyệt
    updateMenstrualCycle: async (cycleId, cycleData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/menstrual-cycle/${cycleId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(cycleData)
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating menstrual cycle:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Bật/tắt nhắc nhở chu kỳ
    toggleCycleReminder: async (cycleId, isEnabled) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/menstrual-cycle/${cycleId}/reminder`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ reminderEnabled: isEnabled })
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error toggling reminder:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Xóa chu kỳ kinh nguyệt
    deleteMenstrualCycle: async (cycleId) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/menstrual-cycle/${cycleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.status === 401) {
                localStorage.removeItem('credentials');
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting menstrual cycle:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },
};