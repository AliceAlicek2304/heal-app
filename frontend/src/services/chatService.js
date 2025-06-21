import { authService } from './authService';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const chatService = {
    // Gửi câu hỏi đến chatbot
    sendMessage: async (message) => {
        try {
            const body = {
                contents: [
                    {
                        parts: [{ text: message }],
                        role: 'user'
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800
                }
            };
            const response = await authService.apiCall(`${API_BASE_URL}/chatbot`, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            return response.json();
        } catch (error) {
            console.error('Error sending message to chatbot:', error);
            throw error;
        }
    },

    // Lấy lịch sử chat (chỉ cho người dùng đã đăng nhập)
    getChatHistory: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/chatbot/history`, { method: 'GET' });

            return response.json();
        } catch (error) {
            console.error('Error fetching chat history:', error);
            throw error;
        }
    },

    // Xóa lịch sử chat (chỉ cho người dùng đã đăng nhập)
    clearChatHistory: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/chatbot/history`, { method: 'DELETE' });

            return response.json();
        } catch (error) {
            console.error('Error clearing chat history:', error);
            throw error;
        }
    }
};