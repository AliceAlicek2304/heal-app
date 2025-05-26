const API_BASE_URL = 'http://localhost:8080';

export const chatService = {
    // Gửi câu hỏi đến chatbot
    sendMessage: async (message) => {
        try {
            // Lấy thông tin xác thực từ localStorage nếu có
            const credentials = localStorage.getItem('credentials');
            const headers = {
                'Content-Type': 'application/json',
            };

            // Thêm Basic Auth header nếu đã đăng nhập
            if (credentials) {
                headers['Authorization'] = `Basic ${credentials}`;
            }

            const response = await fetch(`${API_BASE_URL}/chatbot`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    userQuestion: message
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending message to chatbot:', error);
            throw error;
        }
    },

    // Lấy lịch sử chat (chỉ cho người dùng đã đăng nhập)
    getChatHistory: async () => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/chatbot/history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching chat history:', error);
            throw error;
        }
    },

    // Xóa lịch sử chat (chỉ cho người dùng đã đăng nhập)
    clearChatHistory: async () => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            const response = await fetch(`${API_BASE_URL}/chatbot/history`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error clearing chat history:', error);
            throw error;
        }
    }
};