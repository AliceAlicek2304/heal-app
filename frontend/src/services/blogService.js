import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const blogService = {
    // Tạo bài viết blog mới
    createBlogPost: async (blogData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const formData = new FormData();

            // Thumbnail là required
            if (!blogData.thumbnail) {
                return { success: false, message: 'Thumbnail image is required' };
            }
            formData.append('thumbnail', blogData.thumbnail);

            // Section images nếu có
            const sectionImages = [];
            const sectionImageIndexes = [];

            if (blogData.sections && blogData.sections.length > 0) {
                blogData.sections.forEach((section, index) => {
                    if (section.sectionImage) {
                        sectionImages.push(section.sectionImage);
                        sectionImageIndexes.push(index);
                    }
                });
            }

            // Append section images nếu có
            if (sectionImages.length > 0) {
                sectionImages.forEach(image => {
                    formData.append('sectionImages', image);
                });
                formData.append('sectionImageIndexes', JSON.stringify(sectionImageIndexes));
            }

            // Request data (JSON)
            const requestData = {
                title: blogData.title,
                content: blogData.content,
                categoryId: blogData.categoryId,
                sections: blogData.sections ? blogData.sections.map(section => ({
                    sectionTitle: section.sectionTitle,
                    sectionContent: section.sectionContent,
                    displayOrder: section.displayOrder
                })) : []
            };

            formData.append('request', JSON.stringify(requestData));

            const response = await fetch(`${API_BASE_URL}/blog`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật bài viết blog
    updateBlogPost: async (postId, blogData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const formData = new FormData();

            // Thumbnail (optional cho update)
            if (blogData.thumbnail) {
                formData.append('thumbnail', blogData.thumbnail);
            }

            // Section images nếu có
            const sectionImages = [];
            const sectionImageIndexes = [];

            if (blogData.sections && blogData.sections.length > 0) {
                blogData.sections.forEach((section, index) => {
                    if (section.sectionImage && section.sectionImage instanceof File) {
                        sectionImages.push(section.sectionImage);
                        sectionImageIndexes.push(index);
                    }
                });
            }

            // Append section images nếu có
            if (sectionImages.length > 0) {
                sectionImages.forEach(image => {
                    formData.append('sectionImages', image);
                });
                formData.append('sectionImageIndexes', JSON.stringify(sectionImageIndexes));
            }

            // Request data (JSON)            // Request data (JSON)
            const requestData = {
                title: blogData.title,
                content: blogData.content,
                categoryId: blogData.categoryId,
                sections: blogData.sections ? blogData.sections.map(section => ({
                    sectionTitle: section.sectionTitle,
                    sectionContent: section.sectionContent,
                    displayOrder: section.displayOrder
                })) : []
            };
            formData.append('request', JSON.stringify(requestData));

            const response = await fetch(`${API_BASE_URL}/blog/${postId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Could not parse error response
                }
                return { success: false, message: errorMessage };
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến server: ' + error.message };
        }
    },

    // Lấy danh mục blog
    getCategories: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/categories`, { method: 'GET' });

            if (!response.ok) {
                if (response.status === 401) {
                    return { success: false, message: 'Cần đăng nhập để xem danh mục' };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tải danh mục' };
        }
    },

    // Lấy bài viết của tôi
    getMyPosts: async ({ page = 0, size = 10 }) => {
        try {
            const response = await authService.apiCall(
                `${API_BASE_URL}/blog/my-posts?page=${page}&size=${size}`,
                { method: 'GET' }
            );

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tải bài viết của bạn' };
        }
    },

    // Lấy tất cả bài viết blog (public endpoint)
    getBlogPosts: async (page = 0, size = 12) => {
        try {
            const response = await fetch(`${API_BASE_URL}/blog?page=${page}&size=${size}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không thể tải danh sách bài viết' };
            }
        } catch (error) {
            return { success: false, message: 'Không thể tải danh sách bài viết' };
        }
    },

    // Lấy chi tiết bài viết theo ID (public endpoint)
    getBlogPostById: async (postId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/blog/${postId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không thể tải bài viết' };
            }
        } catch (error) {
            return { success: false, message: 'Không thể tải bài viết' };
        }
    },    // Lấy tất cả bài viết để quản lý (STAFF/ADMIN)
    getAllBlogs: async (params = {}) => {
        try {
            const {
                page = 0,
                size = 10,
                sort = 'createdAt',
                direction = 'DESC'
            } = params;

            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sortBy: sort,
                sortDir: direction.toLowerCase()
            });

            const response = await authService.apiCall(`${API_BASE_URL}/blog?${queryParams}`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Trả về toàn bộ response data bao gồm pagination info
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không thể tải danh sách blog' };
            }
        } catch (error) {
            return { success: false, message: 'Không thể tải danh sách blog' };
        }
    },

    // Cập nhật trạng thái blog (STAFF/ADMIN)
    updateBlogStatus: async (blogId, statusData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/blog/${blogId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statusData)
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không thể cập nhật trạng thái blog' };
            }
        } catch (error) {
            return { success: false, message: 'Không thể cập nhật trạng thái blog' };
        }
    },    // Xóa blog (STAFF/ADMIN)
    deleteBlog: async (blogId) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/blog/${blogId}`, {
                method: 'DELETE'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Chưa đăng nhập' };
            } if (!response.ok) {
                // Try to get error details from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Could not parse delete error response
                }
                return { success: false, message: errorMessage };
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, message: data.message || 'Xóa blog thành công' };
            } else {
                return { success: false, message: data.message || 'Không thể xóa blog' };
            }
        } catch (error) {
            return { success: false, message: 'Không thể xóa blog: ' + error.message };
        }
    },

    // Tạo URL cho ảnh blog
    getBlogImageUrl: (imagePath) => {
        if (!imagePath) return `${API_BASE_URL}/img/blog/default.jpg`;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/img/')) return `${API_BASE_URL}${imagePath}`;
        return `${API_BASE_URL}/img/blog/${imagePath}`;
    },

    // Lấy bài viết mới nhất cho homepage
    getLatestBlogPosts: async (limit = 3) => {
        try {
            const response = await fetch(`${API_BASE_URL}/blog/latest?limit=${limit}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không thể tải bài viết mới nhất' };
            }
        } catch (error) {
            return { success: false, message: 'Không thể tải bài viết mới nhất' };
        }
    }
};

export default blogService;