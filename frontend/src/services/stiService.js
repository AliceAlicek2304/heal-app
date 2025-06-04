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
    getMyTests: async (paginationParams, onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            console.log('🔍 Fetching STI tests from backend...'); // Debug log

            const response = await fetch(`${API_BASE_URL}/sti-services/my-tests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
            });

            // Handle authentication error
            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            if (response.status === 500) {
                console.warn('⚠️ Server error 500 - returning empty result');
                return {
                    success: true,
                    message: 'No STI tests found',
                    data: {
                        content: [],
                        totalPages: 0,
                        totalElements: 0,
                        number: 0,
                        size: paginationParams?.size || 5,
                        first: true,
                        last: true,
                        numberOfElements: 0
                    }
                };
            }

            if (!response.ok) {
                console.error('❌ HTTP error:', response.status);
                return {
                    success: true,
                    message: 'No STI tests found',
                    data: {
                        content: [],
                        totalPages: 0,
                        totalElements: 0,
                        number: 0,
                        size: paginationParams?.size || 5,
                        first: true,
                        last: true,
                        numberOfElements: 0
                    }
                };
            }

            const data = await response.json();
            console.log('📦 Backend response:', data); // Debug log

            if (data.success && data.data) {
                const tests = Array.isArray(data.data) ? data.data : [];

                const page = paginationParams?.page || 0;
                const size = paginationParams?.size || 5;

                const totalElements = tests.length;
                const totalPages = Math.ceil(totalElements / size);
                const startIndex = page * size;
                const endIndex = Math.min(startIndex + size, totalElements);

                const pageContent = tests.slice(startIndex, endIndex);

                console.log(`📊 Pagination: page=${page}, size=${size}, total=${totalElements}, showing=${pageContent.length}`);

                return {
                    success: true,
                    message: data.message || 'STI tests retrieved successfully',
                    data: {
                        content: pageContent,
                        totalPages: totalPages,
                        totalElements: totalElements,
                        number: page,
                        size: size,
                        first: page === 0,
                        last: page >= totalPages - 1,
                        numberOfElements: pageContent.length
                    }
                };
            } else {
                console.log('📭 No tests found or error response');
                return {
                    success: true,
                    message: 'No STI tests found',
                    data: {
                        content: [],
                        totalPages: 0,
                        totalElements: 0,
                        number: 0,
                        size: paginationParams?.size || 5,
                        first: true,
                        last: true,
                        numberOfElements: 0
                    }
                };
            }

        } catch (error) {
            console.error('🚨 Network error fetching STI tests:', error);

            return {
                success: true,
                message: 'No STI tests found',
                data: {
                    content: [],
                    totalPages: 0,
                    totalElements: 0,
                    number: 0,
                    size: paginationParams?.size || 5,
                    first: true,
                    last: true,
                    numberOfElements: 0
                }
            };
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