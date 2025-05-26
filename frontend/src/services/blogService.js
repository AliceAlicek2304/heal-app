const API_BASE_URL = 'http://localhost:8080';

export const blogService = {
    // Tạo blog post mới
    createBlogPost: async (blogData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
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

                // Append section images
                sectionImages.forEach(image => {
                    formData.append('sectionImages', image);
                });

                // Append section image indexes
                sectionImageIndexes.forEach(index => {
                    formData.append('sectionImageIndexes', index);
                });
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
                    // Không include sectionImage ở đây vì nó được xử lý riêng
                })) : []
            };

            formData.append('request', new Blob([JSON.stringify(requestData)], {
                type: 'application/json'
            }));

            console.log('Sending create blog request with:');
            console.log('- Thumbnail:', blogData.thumbnail?.name);
            console.log('- Section images count:', sectionImages.length);
            console.log('- Request data:', requestData);

            const response = await fetch(`${API_BASE_URL}/blog`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`
                    // Không set Content-Type cho multipart/form-data
                },
                body: formData
            });

            console.log('Response status:', response.status);

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

    // Lấy danh sách categories
    getCategories: async () => {
        try {
            console.log('Fetching categories from:', `${API_BASE_URL}/categories`);

            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Categories response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Parsed categories data:', data);

            // Backend trả về ApiResponse<List<CategoryResponse>>
            if (data && data.success && Array.isArray(data.data)) {
                return {
                    success: true,
                    data: data.data.map(category => ({
                        id: category.categoryId,    // Map categoryId -> id
                        name: category.name
                    }))
                };
            } else {
                console.error('Invalid categories response format:', data);
                return { success: false, message: 'Invalid response format' };
            }

        } catch (error) {
            console.error('Error fetching categories:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    }, getMyPosts: async ({ page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = {}) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }
            const url = `${API_BASE_URL}/blog/my-posts?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching my posts:', error);
            return { success: false, message: 'Không thể tải lịch sử bài viết' };
        }
    },
};