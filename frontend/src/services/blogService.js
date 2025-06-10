import { authService } from './authService';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const blogService = {
    createBlogPost: async (blogData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const formData = new FormData();

            // 1. Thumbnail là required
            if (!blogData.thumbnail) {
                return { success: false, message: 'Thumbnail image is required' };
            }
            formData.append('thumbnail', blogData.thumbnail);

            // 2. Section images nếu có
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

                // Gửi sectionImageIndexes như JSON string để backend parse thành Integer[]
                formData.append('sectionImageIndexes', JSON.stringify(sectionImageIndexes));
            }

            // 3. Request data (JSON)
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

            console.log('Section images count:', sectionImages.length);
            console.log('Section image indexes:', sectionImageIndexes);

            const response = await fetch(`${API_BASE_URL}/blog`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Create blog response:', data);
            return data;
        } catch (error) {
            console.error('Error creating blog post:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    getCategories: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/categories`, { method: 'GET' }); if (!response.ok) {
                // Nếu 401, thử không cần auth
                if (response.status === 401) {
                    console.log('Categories endpoint requires authentication');
                    return { success: false, message: 'Cần đăng nhập để xem danh mục' };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return { success: false, message: 'Không thể tải danh mục' };
        }
    },

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

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching my posts:', error);
            return { success: false, message: 'Không thể tải bài viết của bạn' };
        }
    },    // Get all blog posts with pagination (public endpoint)
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
            console.log('Blog posts response:', data); // Debug log

            // Handle the response format from backend
            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không thể tải danh sách bài viết' };
            }
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            return { success: false, message: 'Không thể tải danh sách bài viết' };
        }
    },

    // Get a specific blog post by ID (public endpoint)
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
            console.log('Blog post detail response:', data); // Debug log

            // Handle the response format from backend
            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không thể tải bài viết' };
            }
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
    }
};

export default blogService;