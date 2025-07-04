import { authService } from './authService';
import { parseDate } from '../utils/dateUtils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const menstrualCycleService = {
    // Thêm chu kỳ kinh nguyệt mới
    addCycle: async (cycleData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/addCycle`, {
                method: 'POST',
                body: JSON.stringify(cycleData)
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding menstrual cycle:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Tính toán chu kỳ kinh nguyệt không lưu vào database
    calculateCycle: async (cycleData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/calculate`, {
                method: 'POST',
                body: JSON.stringify(cycleData)
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calculating menstrual cycle:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Lấy tất cả chu kỳ của user
    getCyclesByUserId: async (userId) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/${userId}`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching menstrual cycles:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Lấy chu kỳ của current user (giống như STI /my-tests)
    getCurrentUserCycles: async () => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/my-cycles`, {
                method: 'GET'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching current user cycles:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Cập nhật chu kỳ kinh nguyệt
    updateCycle: async (cycleId, cycleData) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/${cycleId}`, {
                method: 'PUT',
                body: JSON.stringify(cycleData)
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating menstrual cycle:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Bật/tắt nhắc nhở chu kỳ
    toggleReminder: async (cycleId, isEnabled) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/${cycleId}/reminder`, {
                method: 'PUT',
                body: JSON.stringify({ reminderEnabled: isEnabled })
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error toggling reminder:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Xóa chu kỳ kinh nguyệt
    deleteCycle: async (cycleId) => {
        try {
            const response = await authService.apiCall(`${API_BASE_URL}/menstrual-cycle/${cycleId}`, {
                method: 'DELETE'
            });

            if (response.status === 401) {
                authService.logout();
                return { success: false, message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting menstrual cycle:', error);
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    // Tính xác suất mang thai hiện tại dựa trên ngày rụng trứng
    calculateCurrentPregnancyProbability: (ovulationDate) => {
        if (!ovulationDate) return 0.5;
        
        const today = new Date();
        const ovulation = parseDate(ovulationDate);
        
        if (!ovulation) {
            console.warn('Invalid ovulation date:', ovulationDate);
            return 0.5;
        }
        
        const daysDiff = Math.round((today - ovulation) / (1000 * 60 * 60 * 24));

        if (daysDiff >= -5 && daysDiff <= 1) {
            // Thời kỳ dễ thụ thai: 5 ngày trước rụng trứng đến 1 ngày sau
            switch (daysDiff) {
                case -5: return 8.0;   // 5 ngày trước
                case -4: return 12.0;  // 4 ngày trước
                case -3: return 18.0;  // 3 ngày trước
                case -2: return 25.0;  // 2 ngày trước
                case -1: return 30.0;  // 1 ngày trước
                case 0: return 28.0;   // Ngày rụng trứng
                case 1: return 15.0;   // 1 ngày sau
            }
        } else if (daysDiff >= -7 && daysDiff <= -6) {
            // Thời kỳ có thể thụ thai nhưng tỷ lệ thấp
            return 3.0;
        } else if (daysDiff >= 2 && daysDiff <= 3) {
            // Vẫn có thể thụ thai nhưng tỷ lệ rất thấp
            return 2.0;
        } else {
            // Thời kỳ khó thụ thai
            return 0.5;
        }
    },

    // Kiểm tra có trong thời kỳ dễ thụ thai không
    isInFertilePeriod: (ovulationDate) => {
        if (!ovulationDate) return false;
        
        const today = new Date();
        const ovulation = parseDate(ovulationDate);
        
        if (!ovulation) {
            console.warn('Invalid ovulation date:', ovulationDate);
            return false;
        }
        
        const daysDiff = Math.round((today - ovulation) / (1000 * 60 * 60 * 24));
        
        // Thời kỳ dễ thụ thai: 5 ngày trước đến 1 ngày sau rụng trứng
        return daysDiff >= -5 && daysDiff <= 1;
    },

    // Tính các ngày quan trọng trong chu kỳ
    calculateCycleDates: (cycle) => {
        if (!cycle || !cycle.startDate || !cycle.ovulationDate) {
            return null;
        }

        const startDate = parseDate(cycle.startDate);
        const ovulationDate = parseDate(cycle.ovulationDate);
        
        if (!startDate || !ovulationDate) {
            console.warn('Invalid dates in cycle:', cycle);
            return null;
        }
        
        // Ngày kết thúc kinh nguyệt
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + cycle.numberOfDays - 1);
        
        // Chu kỳ tiếp theo
        const nextCycleDate = new Date(startDate);
        nextCycleDate.setDate(startDate.getDate() + cycle.cycleLength);
        
        // Thời kỳ dễ thụ thai (5 ngày trước đến 1 ngày sau rụng trứng)
        const fertileStart = new Date(ovulationDate);
        fertileStart.setDate(ovulationDate.getDate() - 5);
        
        const fertileEnd = new Date(ovulationDate);
        fertileEnd.setDate(ovulationDate.getDate() + 1);

        return {
            startDate,
            endDate,
            ovulationDate,
            nextCycleDate,
            fertileStart,
            fertileEnd,
            currentPregnancyProbability: menstrualCycleService.calculateCurrentPregnancyProbability(ovulationDate),
            inFertilePeriod: menstrualCycleService.isInFertilePeriod(ovulationDate)
        };
    }
};