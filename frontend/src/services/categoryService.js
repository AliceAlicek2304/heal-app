import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const categoryService = {
    // Blog Categories
    blogCategories: {
        getAll: async () => {
            try {
                const response = await authService.apiCall(`${API_BASE_URL}/categories`, {
                    method: 'GET'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    data: responseData?.data || []
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi lấy danh sách danh mục blog'
                };
            }
        },

        getById: async (id) => {
            try {
                const response = await authService.apiCall(`${API_BASE_URL}/categories/${id}`, {
                    method: 'GET'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    data: responseData?.data
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi lấy thông tin danh mục'
                };
            }
        },

        create: async (categoryData) => {
            try {
                if (!authService.isAuthenticated()) {
                    return { success: false, message: 'Chưa đăng nhập' };
                }

                const response = await authService.apiCall(`${API_BASE_URL}/categories`, {
                    method: 'POST',
                    body: JSON.stringify(categoryData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    data: responseData?.data
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi tạo danh mục'
                };
            }
        },

        update: async (id, categoryData) => {
            try {
                if (!authService.isAuthenticated()) {
                    return { success: false, message: 'Chưa đăng nhập' };
                }

                const response = await authService.apiCall(`${API_BASE_URL}/categories/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(categoryData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    data: responseData?.data
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi cập nhật danh mục'
                };
            }
        },

        delete: async (id) => {
            try {
                if (!authService.isAuthenticated()) {
                    return { success: false, message: 'Chưa đăng nhập' };
                }

                const response = await authService.apiCall(`${API_BASE_URL}/categories/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    message: responseData?.message || 'Xóa danh mục thành công'
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi xóa danh mục'
                };
            }
        }
    },

    // Question Categories
    questionCategories: {
        getAll: async () => {
            try {
                const response = await authService.apiCall(`${API_BASE_URL}/question-categories`, {
                    method: 'GET'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    data: responseData?.data || []
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi lấy danh sách danh mục câu hỏi'
                };
            }
        },

        getById: async (id) => {
            try {
                const response = await authService.apiCall(`${API_BASE_URL}/question-categories/${id}`, {
                    method: 'GET'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    data: responseData?.data
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi lấy thông tin danh mục'
                };
            }
        },

        create: async (categoryData) => {
            try {
                if (!authService.isAuthenticated()) {
                    return { success: false, message: 'Chưa đăng nhập' };
                }

                const response = await authService.apiCall(`${API_BASE_URL}/question-categories`, {
                    method: 'POST',
                    body: JSON.stringify(categoryData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    data: responseData?.data
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi tạo danh mục'
                };
            }
        },

        update: async (id, categoryData) => {
            try {
                if (!authService.isAuthenticated()) {
                    return { success: false, message: 'Chưa đăng nhập' };
                }

                const response = await authService.apiCall(`${API_BASE_URL}/question-categories/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(categoryData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    data: responseData?.data
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi cập nhật danh mục'
                };
            }
        },

        delete: async (id) => {
            try {
                if (!authService.isAuthenticated()) {
                    return { success: false, message: 'Chưa đăng nhập' };
                }

                const response = await authService.apiCall(`${API_BASE_URL}/question-categories/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                return {
                    success: true,
                    message: responseData?.message || 'Xóa danh mục thành công'
                };
            } catch (error) {
                return {
                    success: false,
                    message: error.message || 'Lỗi khi xóa danh mục'
                };
            }
        }
    }
};

export default categoryService;
