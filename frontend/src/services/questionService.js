const API_BASE_URL = 'http://localhost:8080';

export const questionService = {
    // Tạo câu hỏi mới
    createQuestion: async (questionData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(questionData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating question:', error);
            return { success: false, message: 'Không thể tạo câu hỏi' };
        }
    },

    // Lấy câu hỏi của tôi
    getMyQuestions: async ({ page = 0, size = 10, sort = 'createdAt', direction = 'DESC' } = {}) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const url = `${API_BASE_URL}/questions/my-questions?page=${page}&size=${size}&sort=${sort}&direction=${direction}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching my questions:', error);
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },

    // Lấy danh mục câu hỏi
    getCategories: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/question-categories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching question categories:', error);
            return { success: false, message: 'Không thể tải danh mục' };
        }
    },

    // Lấy câu hỏi đã được trả lời (public)
    getAnsweredQuestions: async ({ page = 0, size = 10, sort = 'createdAt', direction = 'DESC' } = {}) => {
        try {
            const url = `${API_BASE_URL}/questions/answered?page=${page}&size=${size}&sort=${sort}&direction=${direction}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching answered questions:', error);
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },

    // Lấy chi tiết câu hỏi
    getQuestionById: async (questionId) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching question:', error);
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },
    getQuestionsByStatus: async (params = {}) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            let url;

            if (params.status && params.status !== 'ALL') {
                // Sử dụng endpoint /questions/status/{status}
                const queryParams = new URLSearchParams({
                    page: params.page || 0,
                    size: params.size || 10,
                    sort: params.sort || 'createdAt',
                    direction: params.direction || 'DESC'
                });

                url = `${API_BASE_URL}/questions/status/${params.status}?${queryParams}`;
            } else {
                // Nếu là ALL hoặc không có status, lấy tất cả từ answered endpoint
                const queryParams = new URLSearchParams({
                    page: params.page || 0,
                    size: params.size || 10,
                    sort: params.sort || 'createdAt',
                    direction: params.direction || 'DESC'
                });

                url = `${API_BASE_URL}/questions/answered?${queryParams}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching questions by status:', error);
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },

    // Cập nhật method getAllQuestions để lấy tất cả status
    getAllQuestions: async (params = {}) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            // Tạo promise array để gọi tất cả các status
            const statuses = ['PROCESSING', 'CONFIRMED', 'ANSWERED'];
            const promises = statuses.map(status =>
                questionService.getQuestionsByStatus({ ...params, status })
            );

            const responses = await Promise.all(promises);

            // Gộp tất cả kết quả
            let allQuestions = [];
            let totalElements = 0;

            responses.forEach(response => {
                if (response.success && response.data && response.data.content) {
                    allQuestions = allQuestions.concat(response.data.content);
                    totalElements += response.data.totalElements || 0;
                }
            });

            // Sắp xếp theo thời gian
            allQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Phân trang thủ công
            const page = params.page || 0;
            const size = params.size || 10;
            const start = page * size;
            const end = start + size;
            const paginatedQuestions = allQuestions.slice(start, end);

            return {
                success: true,
                data: {
                    content: paginatedQuestions,
                    totalElements: allQuestions.length,
                    totalPages: Math.ceil(allQuestions.length / size),
                    number: page,
                    size: size
                }
            };
        } catch (error) {
            console.error('Error fetching all questions:', error);
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    },
    updateQuestionStatus: async (questionId, statusData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/questions/${questionId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(statusData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating question status:', error);
            return { success: false, message: 'Không thể cập nhật trạng thái' };
        }
    },
    answerQuestion: async (questionId, answerData) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answer`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(answerData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error answering question:', error);
            return { success: false, message: 'Không thể trả lời câu hỏi' };
        }
    },
    getAllQuestionsForStaff: async (params = {}) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            // Gọi từng status và gộp lại
            const statusCalls = ['PROCESSING', 'CONFIRMED', 'ANSWERED'].map(async (status) => {
                const queryParams = new URLSearchParams({
                    page: 0, // Lấy tất cả từ page 0
                    size: 1000, // Lấy nhiều để đảm bảo có đủ data
                    sort: params.sort || 'createdAt',
                    direction: params.direction || 'DESC'
                });

                const url = `${API_BASE_URL}/questions/status/${status}?${queryParams}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${credentials}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.success ? data.data.content : [];
                }
                return [];
            });

            const results = await Promise.all(statusCalls);
            const allQuestions = results.flat();

            // Sort by created date
            allQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Manual pagination
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
            console.error('Error fetching all questions for staff:', error);
            return { success: false, message: 'Không thể tải câu hỏi' };
        }
    }
};