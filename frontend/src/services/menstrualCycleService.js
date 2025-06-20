import { authService } from './authService';

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
        if (!ovulationDate) return 1.0;
        
        const today = new Date();
        const ovulation = new Date(ovulationDate);
        const daysDiff = Math.round((today - ovulation) / (1000 * 60 * 60 * 24));

        switch (daysDiff) {
            case -5: return 6.4;   // 5 ngày trước rụng trứng
            case -4: return 7.8;   // 4 ngày trước rụng trứng
            case -3: return 10.7;  // 3 ngày trước rụng trứng
            case -2: return 19.3;  // 2 ngày trước rụng trứng
            case -1: return 23.5;  // 1 ngày trước rụng trứng
            case 0: return 15.7;   // Ngày rụng trứng
            case 1: return 5.7;    // 1 ngày sau rụng trứng
            default: return 1.0;   // Các ngày khác
        }
    },

    // Kiểm tra có trong thời kỳ dễ thụ thai không
    isInFertilePeriod: (ovulationDate) => {
        if (!ovulationDate) return false;
        
        const today = new Date();
        const ovulation = new Date(ovulationDate);
        const daysDiff = Math.round((today - ovulation) / (1000 * 60 * 60 * 24));
        
        // Thời kỳ dễ thụ thai: 5 ngày trước đến 1 ngày sau rụng trứng
        return daysDiff >= -5 && daysDiff <= 1;
    },

    // Tính các ngày quan trọng trong chu kỳ
    calculateCycleDates: (cycle) => {
        if (!cycle || !cycle.startDate || !cycle.ovulationDate) {
            return null;
        }

        const startDate = new Date(cycle.startDate);
        const ovulationDate = new Date(cycle.ovulationDate);
        
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
            isInFertilePeriod: menstrualCycleService.isInFertilePeriod(ovulationDate)
        };
    }
};