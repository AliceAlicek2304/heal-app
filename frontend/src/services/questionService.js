import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const questionService = {
    // Tạo câu hỏi mới
    createQuestion: async (questionData) => {
        try {
            if (!authService.isAuthenticated()) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await authService.apiCall(`${API_BASE_URL}/questions`, {
                method: 'POST',
                body: JSON.stringify(questionData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tạo câu hỏi' };
        }
    },

    // Lấy câu hỏi của tôi
    getMyQuestions: async ({ page = 0, size = 10, sort = 'createdAt', direction = 'DESC' } = {}) => {
        try {
            if (!authService.isAuthenticated()) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const url = `${API_BASE_URL}/questions/my-questions?page=${page}&size=${size}&sort=${sort}&direction=${direction}`;
            const response = await authService.apiCall(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },

    // Lấy danh mục câu hỏi
    getCategories: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/question-categories`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tải danh mục' };
        }
    },

    // Lấy câu hỏi đã được trả lời (public)
    getAnsweredQuestions: async ({ page = 0, size = 10, sort = 'createdAt', direction = 'DESC' } = {}) => {
        try {
            const url = `${API_BASE_URL}/questions/answered?page=${page}&size=${size}&sort=${sort}&direction=${direction}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },

    // Lấy chi tiết câu hỏi
    getQuestionById: async (questionId) => {
        try {
            if (!authService.isAuthenticated()) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await authService.apiCall(`${API_BASE_URL}/questions/${questionId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },

    // Lấy câu hỏi theo trạng thái
    getQuestionsByStatus: async (params = {}) => {
        try {
            if (!authService.isAuthenticated()) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            let url;

            if (params.status && params.status !== 'ALL') {
                const queryParams = new URLSearchParams({
                    page: params.page || 0,
                    size: params.size || 10,
                    sort: params.sort || 'createdAt',
                    direction: params.direction || 'DESC'
                });

                url = `${API_BASE_URL}/questions/status/${params.status}?${queryParams}`;
            } else {
                const queryParams = new URLSearchParams({
                    page: params.page || 0,
                    size: params.size || 10,
                    sort: params.sort || 'createdAt',
                    direction: params.direction || 'DESC'
                });

                url = `${API_BASE_URL}/questions/answered?${queryParams}`;
            }

            const response = await authService.apiCall(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },

    // Lấy tất cả câu hỏi
    getAllQuestions: async (params = {}) => {
        try {
            if (!authService.isAuthenticated()) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const statuses = ['PROCESSING', 'CONFIRMED', 'ANSWERED'];
            const promises = statuses.map(status =>
                questionService.getQuestionsByStatus({ ...params, status })
            );

            const responses = await Promise.all(promises);

            let allQuestions = [];
            responses.forEach(response => {
                if (response.success && response.data && response.data.content) {
                    allQuestions = allQuestions.concat(response.data.content);
                }
            });

            allQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const page = params.page || 0;
            const size = params.size || 10;
            const start = page * size;
            const end = start + size;

            return {
                success: true,
                data: {
                    content: allQuestions.slice(start, end),
                    totalElements: allQuestions.length,
                    totalPages: Math.ceil(allQuestions.length / size),
                    number: page,
                    size: size
                }
            };
        } catch (error) {
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },

    // Cập nhật trạng thái câu hỏi
    updateQuestionStatus: async (questionId, statusData) => {
        try {
            if (!authService.isAuthenticated()) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await authService.apiCall(
                `${API_BASE_URL}/questions/${questionId}/status`,
                { method: 'PUT', body: JSON.stringify(statusData) }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể cập nhật trạng thái' };
        }
    },

    // Trả lời câu hỏi
    answerQuestion: async (questionId, answerData) => {
        try {
            if (!authService.isAuthenticated()) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await authService.apiCall(
                `${API_BASE_URL}/questions/${questionId}/answer`,
                { method: 'PUT', body: JSON.stringify(answerData) }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            return { success: false, message: 'Không thể trả lời câu hỏi' };
        }
    },

    // Lấy tất cả câu hỏi cho staff
    getAllQuestionsForStaff: async (params = {}) => {
        try {
            if (!authService.isAuthenticated()) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const statusCalls = ['PROCESSING', 'CONFIRMED', 'ANSWERED'].map(async (status) => {
                const queryParams = new URLSearchParams({
                    page: 0,
                    size: 1000,
                    sort: params.sort || 'createdAt',
                    direction: params.direction || 'DESC'
                });

                const url = `${API_BASE_URL}/questions/status/${status}?${queryParams}`;
                const response = await authService.apiCall(url, { method: 'GET' });

                if (response.ok) {
                    const data = await response.json();
                    return data.success ? data.data.content : [];
                }
                return [];
            });

            const results = await Promise.all(statusCalls);
            const allQuestions = results.flat();

            allQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const page = params.page || 0;
            const size = params.size || 10;
            const start = page * size;
            const end = start + size;

            return {
                success: true,
                data: {
                    content: allQuestions.slice(start, end),
                    totalElements: allQuestions.length,
                    totalPages: Math.ceil(allQuestions.length / size),
                    number: page,
                    size: size
                }
            };
        } catch (error) {
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    }
};