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
    }
};