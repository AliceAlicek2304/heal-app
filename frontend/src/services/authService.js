const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Store tokens
const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

// Clear tokens
const clearTokens = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
};

// Refresh access token
const refreshToken = async () => {
    try {
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (!refreshTokenValue) {
            console.log('No refresh token available');
            throw new Error('No refresh token');
        }

        console.log('Attempting to refresh token...');
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshTokenValue })
        });

        if (!response.ok) {
            console.log('Refresh token failed with status:', response.status);
            clearTokens();
            return null;
        }

        const data = await response.json();

        if (data.success !== false && data.accessToken && data.refreshToken) {
            setTokens(data.accessToken, data.refreshToken);
            console.log(' Token refreshed successfully');
            return data.accessToken;
        } else {
            console.log('Refresh response format error:', data);
            clearTokens();
            return null;
        }
    } catch (error) {
        console.error('Error during token refresh:', error);
        clearTokens();
        return null;
    }
};

// API call wrapper with automatic token refresh
const apiCall = async (url, options = {}) => {
    try {
        // Add a retry counter to prevent infinite loops
        let retryCount = 0;
        const maxRetries = 1;

        // Try to make the API call, with possible token refresh
        const makeRequest = async () => {
            // Ensure we have the latest token for each attempt
            const currentToken = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json',
                ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
                ...options.headers
            };
            let response = await fetch(url, { ...options, headers });

            // Handle unauthorized response by trying to refresh the token once
            if (response.status === 401 && retryCount < maxRetries) {
                console.log('Received 401, attempting token refresh');
                retryCount++;

                try {
                    const newToken = await refreshToken();
                    if (newToken) {
                        console.log('Token refreshed successfully, retrying request');
                        // Retry the request with the new token
                        const newHeaders = {
                            ...options.headers,
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${newToken}`
                        };
                        return await fetch(url, { ...options, headers: newHeaders });
                    } else {
                        console.log('Token refresh failed, clearing auth data');
                        clearTokens();
                        return response;
                    }
                } catch (refreshError) {
                    console.error('Error during token refresh:', refreshError);
                    clearTokens();
                    return response;
                }
            }

            return response;
        };

        return await makeRequest();
    } catch (error) {
        console.error('API Call error:', error);
        throw error;
    }
};

export const authService = {
    // Gửi mã xác thực đến email
    sendVerificationCode: async (email) => {
        const response = await fetch(`${API_BASE_URL}/users/send-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return response.json();
    },
    // Đăng ký người dùng
    registerUser: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return response.json();
    },  // Đăng nhập người dùng và lưu token
    loginUser: async (loginData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            }); const responseText = await response.text();

            if (!responseText) {
                return { success: false, message: 'Server trả về phản hồi trống' };
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                return { success: false, message: 'Phản hồi từ server không hợp lệ' };
            } if (response.ok) {                // Store the JWT tokens
                setTokens(data.accessToken, data.refreshToken);

                // Fetch complete user profile after successful login
                try {
                    const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${data.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();

                        if (profileData.success && profileData.data) {
                            // Store complete user profile
                            localStorage.setItem('user', JSON.stringify(profileData.data));

                            return {
                                success: true,
                                data: {
                                    user: profileData.data,
                                    accessToken: data.accessToken,
                                    refreshToken: data.refreshToken
                                }
                            };
                        }
                    }
                } catch (profileError) {
                    console.warn("Profile fetch error, using basic user info:", profileError);
                }

                // Fallback: use basic user info if profile fetch fails
                const userInfo = {
                    userId: data.userId,
                    username: data.username,
                    email: data.email,
                    role: data.role
                };

                localStorage.setItem('user', JSON.stringify(userInfo));

                return {
                    success: true,
                    data: {
                        user: userInfo,
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken
                    }
                };
            }

            return { success: false, message: data.error || data.message || 'Đăng nhập thất bại' };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: 'Có lỗi xảy ra trong quá trình đăng nhập' };
        }
    },
    // Đăng xuất
    logout: () => {
        clearTokens();
    },    // Kiểm tra trạng thái đăng nhập
    isAuthenticated: () => {
        const token = localStorage.getItem('authToken');
        return !!token;
    },

    // Check if token is expired or about to expire
    isTokenExpired: () => {
        const token = localStorage.getItem('authToken');
        if (!token) return true;

        try {
            // Decode JWT payload
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const decoded = JSON.parse(jsonPayload);
            const now = Date.now() / 1000;

            // Check if token is expired (with 30 seconds buffer)
            return decoded.exp && decoded.exp <= (now + 30);
        } catch (error) {
            console.error('Error checking token expiry:', error);
            return true; // Assume expired if we can't decode
        }
    },// Lấy thông tin user hiện tại từ server hoặc storage
    getCurrentUser: async () => {       // Always try to get from localStorage first
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');

        if (!token) {
            clearTokens();
            return { success: false };
        }

        // If we have cached user data, return it immediately
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                return { success: true, data: userData };
            } catch (parseError) {
                console.error('Error parsing cached user data:', parseError);
            }
        }

        // Only try to fetch from server if we don't have cached data
        try {
            const response = await apiCall(`${API_BASE_URL}/users/profile`, { method: 'GET' });
            if (!response.ok) {
                if (response.status === 401) {
                    clearTokens();
                }
                return { success: false };
            }
            const data = await response.json();

            if (data.success && data.data) {
                localStorage.setItem('user', JSON.stringify(data.data));
                return { success: true, data: data.data };
            } else {
                localStorage.setItem('user', JSON.stringify(data));
                return { success: true, data };
            }
        } catch (error) {
            console.error('Error getting current user from server:', error);
            // If server call fails but we have a token, assume user is still logged in
            return userStr ? { success: true, data: JSON.parse(userStr) } : { success: false };
        }
    },// Generate avatar URL
    getAvatarUrl: (avatarPath) => {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        
        // Nếu không có avatarPath hoặc rỗng, trả về default
        if (!avatarPath || typeof avatarPath !== 'string' || !avatarPath.trim()) {
            return `${API_BASE_URL}/uploads/avatar/default.jpg`;
        }
        
        // Nếu đã là URL đầy đủ (http/https), trả về nguyên xi
        if (/^https?:\/\//.test(avatarPath)) {
            return avatarPath;
        }
        
        // Nếu path bắt đầu bằng /uploads/avatar hoặc /img/avatar, thêm API_BASE_URL
        if (avatarPath.startsWith('/uploads/avatar') || avatarPath.startsWith('/img/avatar')) {
            return `${API_BASE_URL}${avatarPath}`;
        }
        
        // Trường hợp còn lại: chỉ có tên file, thêm vào path uploads/avatar
        return `${API_BASE_URL}/uploads/avatar/${avatarPath}`;
    },

    // Forgot password - send reset code
    forgotPassword: async (email) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return response.json();
        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Reset password with verification code
    resetPassword: async (email, verificationCode, newPassword) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    code: verificationCode,
                    newPassword
                })
            });
            return response.json();
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },    // Get blog posts (with authentication)
    getBlogPosts: async (page = 0, size = 12) => {
        try {
            const response = await apiCall(`${API_BASE_URL}/blog?page=${page}&size=${size}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            return { success: false, message: 'Không thể tải danh sách bài viết' };
        }
    },

    // Get a specific blog post by ID
    getBlogPostById: async (postId) => {
        try {
            const response = await apiCall(`${API_BASE_URL}/blog/${postId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching blog post:', error);
            return { success: false, message: 'Không thể tải bài viết' };
        }
    },

    // Generate blog image URL
    getBlogImageUrl: (imagePath) => {
        if (!imagePath) return `${API_BASE_URL}/img/blog/default.jpg`;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/img/')) return `${API_BASE_URL}${imagePath}`;
        return `${API_BASE_URL}/img/blog/${imagePath}`;
    },    // Refresh user profile data
    refreshUserProfile: async () => {
        try {
            const response = await apiCall(`${API_BASE_URL}/users/profile`, { method: 'GET' });

            if (!response.ok) {
                if (response.status === 401) {
                    clearTokens();
                    return { success: false, message: 'Chưa đăng nhập' };
                }
                return { success: false, message: 'Không thể tải thông tin người dùng' };
            }

            const data = await response.json();

            if (data.success && data.data) {
                localStorage.setItem('user', JSON.stringify(data.data));
                return { success: true, data: data.data };
            } else {
                return { success: false, message: 'Dữ liệu người dùng không hợp lệ' };
            }
        } catch (error) {
            console.error('Error refreshing user profile:', error);
            return { success: false, message: 'Có lỗi xảy ra khi tải thông tin người dùng' };
        }
    },    // Expose refresh token method
    refreshToken,

    apiCall
};

// Export getAuthHeader function for backward compatibility
export const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};