const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const stiService = {
    // Lấy danh sách dịch vụ STI đang hoạt động
    getActiveServices: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sti-services`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching STI services:', error);
            return { success: false, message: 'Không thể tải danh sách dịch vụ' };
        }
    },

    // Lấy chi tiết dịch vụ STI
    getServiceDetails: async (serviceId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/sti-services/${serviceId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching STI service details:', error);
            return { success: false, message: 'Không thể tải chi tiết dịch vụ' };
        }
    },

    // Đặt lịch xét nghiệm STI
    bookTest: async (testData, onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/book-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(credentials && { 'Authorization': `Basic ${credentials}` })
                },
                body: JSON.stringify(testData)
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || `Server error: ${response.status}`
                };
            }

            return data;
        } catch (error) {
            console.error('Error booking STI test:', error);
            return {
                success: false,
                message: error.message || 'Network error occurred'
            };
        }
    },

    // Lấy danh sách xét nghiệm của tôi
    getMyTests: async (onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/my-tests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to fetch tests' };
            }

            return data;
        } catch (error) {
            console.error('Error fetching my tests:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Lấy chi tiết xét nghiệm
    getTestDetails: async (testId, onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/tests/${testId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to fetch test details' };
            }

            return data;
        } catch (error) {
            console.error('Error fetching test details:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Hủy xét nghiệm
    cancelTest: async (testId, onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/tests/${testId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to cancel test' };
            }

            return data;
        } catch (error) {
            console.error('Error cancelling test:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Lấy kết quả xét nghiệm
    getTestResults: async (testId, onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/tests/${testId}/results`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to fetch test results' };
            }

            return data;
        } catch (error) {
            console.error('Error fetching test results:', error);
            return { success: false, message: 'Network error occurred' };
        }
    }
};