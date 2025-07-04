import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const menstrualCycleAIService = {
    // Phân tích chu kỳ kinh nguyệt cá nhân bằng AI
    generatePersonalAnalysis: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/ai/personal-analysis`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error generating personal analysis:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Phân tích sức khỏe chi tiết với khuyến nghị y tế
    generateHealthAnalysis: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/ai/health-analysis`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error generating health analysis:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Phân tích so sánh với chuẩn y tế
    generateComparativeAnalysis: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/ai/comparative-analysis`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error generating comparative analysis:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    }
}; 