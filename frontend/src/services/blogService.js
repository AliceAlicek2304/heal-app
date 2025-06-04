const API_BASE_URL = 'http://localhost:8080';

const blogService = {
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
                headers: {
                    'Authorization': `Basic ${credentials}`
                },
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
            // Sửa từ /category thành /categories và thêm credentials nếu có
            const credentials = localStorage.getItem('credentials');
            const headers = {};
            
            if (credentials) {
                headers['Authorization'] = `Basic ${credentials}`;
            }

            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                // Nếu 401 và không có credentials, thử không cần auth
                if (response.status === 401 && !credentials) {
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
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(
                `${API_BASE_URL}/blog/my-posts?page=${page}&size=${size}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching my posts:', error);
            return { success: false, message: 'Không thể tải bài viết của bạn' };
        }
    }
};

export { blogService };
export default blogService;