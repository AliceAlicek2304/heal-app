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
                    'Authorization': `Basic ${credentials}`
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

            if (!response.ok) {
                return {
                    success: true,
                    message: 'No STI tests found',
                    data: []
                };
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error fetching user tests:', error);
            return {
                success: true,
                message: 'No STI tests found',
                data: []
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
    },

    // ✅ Lấy thông tin thanh toán - sử dụng paymentId từ test response
    getPaymentInfo: async (testId, onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            // Trước tiên lấy thông tin test để có paymentId
            const testResponse = await fetch(`${API_BASE_URL}/sti-services/tests/${testId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
            });

            if (testResponse.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            if (!testResponse.ok) {
                return { success: false, message: 'Failed to fetch test details' };
            }

            const testData = await testResponse.json();

            if (!testData.success || !testData.data?.paymentId) {
                return { success: false, message: 'Payment information not found' };
            }

            // Sau đó lấy thông tin payment chi tiết
            const paymentResponse = await fetch(`${API_BASE_URL}/payments/${testData.data.paymentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
            });

            if (paymentResponse.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {
                return { success: false, message: paymentData.message || 'Failed to fetch payment info' };
            }

            return paymentData;
        } catch (error) {
            console.error('Error fetching payment info:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // ✅ Tạo thanh toán QR
    createQRPayment: async (testId, onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payments/qr/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify({ testId })
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to create QR payment' };
            }

            return data;
        } catch (error) {
            console.error('Error creating QR payment:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // ✅ Kiểm tra trạng thái thanh toán QR
    checkQRPaymentStatus: async (qrReference, onAuthRequired) => {
        try {
            const credentials = localStorage.getItem('credentials');
            if (!credentials && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payments/qr/${qrReference}/check`, {
                method: 'POST',
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
                return { success: false, message: data.message || 'Failed to check payment status' };
            }

            return data;
        } catch (error) {
            console.error('Error checking QR payment status:', error);
            return { success: false, message: 'Network error occurred' };
        }
    }
};