import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const searchService = {    // Tìm kiếm tổng hợp - sử dụng các API hiện có
    globalSearch: async (query, filters = {}) => {
        try {
            if (!query || query.trim().length < 2) {
                return { success: false, message: 'Vui lòng nhập ít nhất 2 ký tự để tìm kiếm' };
            }

            const {
                page = 0,
                size = 10
            } = filters;

            // Tìm kiếm blog, questions và STI services song song
            const [blogResponse, questionResponse, stiResponse] = await Promise.all([
                searchService.searchBlogs(query, { page, size: Math.ceil(size / 3) }),
                searchService.searchQuestions(query, { page, size: Math.ceil(size / 3) }),
                searchService.searchSTIServices(query)
            ]);

            const results = {
                blogs: blogResponse.success ? (blogResponse.data.content || []) : [],
                questions: questionResponse.success ? (questionResponse.data.content || []) : [],
                stiServices: stiResponse.success ? (stiResponse.data || []) : [],
                totalElements: (blogResponse.data?.totalElements || 0) +
                    (questionResponse.data?.totalElements || 0) +
                    (stiResponse.data?.length || 0)
            };

            return { success: true, data: results };
        } catch (error) {
            console.error('Error in globalSearch:', error);
            return { success: false, message: 'Có lỗi xảy ra khi tìm kiếm' };
        }
    },

    // Tìm kiếm blog - sử dụng API hiện có
    searchBlogs: async (query, filters = {}) => {
        try {
            if (!query || query.trim().length < 2) {
                return { success: false, message: 'Vui lòng nhập ít nhất 2 ký tự để tìm kiếm' };
            }

            const {
                page = 0,
                size = 10,
                sortBy = 'createdAt',
                sortDir = 'desc'
            } = filters;

            const queryParams = new URLSearchParams({
                query: query.trim(),
                page: page.toString(),
                size: size.toString(),
                sortBy: sortBy,
                sortDir: sortDir
            });

            const response = await fetch(`${API_BASE_URL}/blog/search?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không tìm thấy bài viết' };
            }
        } catch (error) {
            console.error('Error in searchBlogs:', error);
            return { success: false, message: 'Có lỗi xảy ra khi tìm kiếm bài viết' };
        }
    },    // Tìm kiếm câu hỏi - sử dụng API search mới
    searchQuestions: async (query, filters = {}) => {
        try {
            if (!query || query.trim().length < 2) {
                return { success: false, message: 'Vui lòng nhập ít nhất 2 ký tự để tìm kiếm' };
            }

            const {
                page = 0,
                size = 10,
                sort = 'createdAt',
                direction = 'DESC'
            } = filters;

            const queryParams = new URLSearchParams({
                query: query.trim(),
                page: page.toString(),
                size: size.toString(),
                sort: sort,
                direction: direction
            });

            const response = await fetch(`${API_BASE_URL}/questions/search?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không tìm thấy câu hỏi' };
            }
        } catch (error) {
            console.error('Error in searchQuestions:', error);
            return { success: false, message: 'Có lỗi xảy ra khi tìm kiếm câu hỏi' };
        }
    },

    // Tìm kiếm STI services
    searchSTIServices: async (query) => {
        try {
            if (!query || query.trim().length < 2) {
                return { success: false, message: 'Vui lòng nhập ít nhất 2 ký tự để tìm kiếm' };
            }

            const queryParams = new URLSearchParams({
                keyword: query.trim()
            });

            const response = await fetch(`${API_BASE_URL}/sti-services/search?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, data: data.data };
            } else {
                return { success: false, message: data.message || 'Không tìm thấy dịch vụ' };
            }
        } catch (error) {
            console.error('Error in searchSTIServices:', error);
            return { success: false, message: 'Có lỗi xảy ra khi tìm kiếm dịch vụ' };
        }
    },

    // Gợi ý tìm kiếm - tạm thời disable vì backend chưa có API
    getSearchSuggestions: async (query) => {
        try {
            // Tạm thời trả về empty array vì backend chưa có API này
            return { success: true, data: [] };

            // TODO: Implement khi backend có API suggestions
            /*
            if (!query || query.trim().length < 2) {
                return { success: true, data: [] };
            }

            const queryParams = new URLSearchParams({
                q: query.trim(),
                limit: '5'
            });

            const response = await fetch(`${API_BASE_URL}/search/suggestions?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                return { success: true, data: data.data || [] };
            } else {
                return { success: true, data: [] };
            }
            */
        } catch (error) {
            console.error('Error in getSearchSuggestions:', error);
            return { success: true, data: [] };
        }
    }
};
