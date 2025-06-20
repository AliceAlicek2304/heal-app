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

            return await response.json();
        } catch (error) {
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

            return await response.json();
        } catch (error) {
            return { success: false, message: 'Không thể tải chi tiết dịch vụ' };
        }
    },

    // Đặt lịch xét nghiệm STI
    bookTest: async (testData, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            // Validate booking data - phải có serviceId HOẶC packageId
            if (!testData.serviceId && !testData.packageId) {
                return { success: false, message: 'Must specify either serviceId or packageId' };
            }

            if (testData.serviceId && testData.packageId) {
                return { success: false, message: 'Cannot specify both serviceId and packageId' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/book-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            return {
                success: false,
                message: error.message || 'Network error occurred'
            };
        }
    },

    // Lấy danh sách xét nghiệm của tôi
    getMyTests: async (paginationParams, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/my-tests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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

            return await response.json();
        } catch (error) {
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
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/tests/${testId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Hủy xét nghiệm
    cancelTest: async (testId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/tests/${testId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Lấy kết quả xét nghiệm
    getTestResults: async (testId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/tests/${testId}/results`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Lấy thông tin thanh toán
    getPaymentInfo: async (testId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            // Lấy thông tin test để có paymentId
            const testResponse = await fetch(`${API_BASE_URL}/sti-services/tests/${testId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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

            // Lấy thông tin payment chi tiết
            const paymentResponse = await fetch(`${API_BASE_URL}/payments/${testData.data.paymentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Tạo thanh toán QR
    createQRPayment: async (testId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payments/qr/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Tạo lại mã QR theo paymentId
    regenerateQRCode: async (paymentId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/regenerate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to regenerate QR code' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Tạo lại mã QR theo reference
    regenerateQRCodeByReference: async (qrReference, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payments/qr/${qrReference}/regenerate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to regenerate QR code' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Kiểm tra trạng thái thanh toán QR
    checkQRPaymentStatus: async (qrReference, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/payments/qr/${qrReference}/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to check payment status' };
            } return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // ========== STAFF FUNCTIONS ==========

    // Lấy danh sách xét nghiệm chờ xác nhận
    getPendingTests: async (onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/staff/pending-tests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to fetch pending tests' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Lấy danh sách xét nghiệm đã xác nhận
    getConfirmedTests: async (onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/staff/confirmed-tests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to fetch confirmed tests' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Lấy danh sách xét nghiệm của staff
    getStaffTests: async (onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/staff/my-tests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to fetch staff tests' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Xác nhận xét nghiệm
    confirmTest: async (testId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/staff/tests/${testId}/confirm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to confirm test' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Lấy mẫu xét nghiệm
    sampleTest: async (testId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/staff/tests/${testId}/sample`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to sample test' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Nhập kết quả xét nghiệm
    addTestResults: async (testId, resultData, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/staff/tests/${testId}/result`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(resultData)
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to add test results' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Hoàn thành xét nghiệm
    completeTest: async (testId, onAuthRequired) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const response = await fetch(`${API_BASE_URL}/sti-services/staff/tests/${testId}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401 && onAuthRequired) {
                onAuthRequired();
                return { success: false, message: 'Authentication required' };
            }

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to complete test' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Admin API methods for STI test management
    getAllSTITests: async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/sti-tests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Không thể tải danh sách STI test' };
        }
    },

    getSTITestById: async (testId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/sti-tests/${testId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Không thể tải chi tiết STI test' };
        }
    },

    // Admin API methods for STI services management (read-only)
    getAllSTIServices: async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/sti-services`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Không thể tải danh sách dịch vụ STI' };
        }
    },

    getAllSTIPackages: async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/sti-packages`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Không thể tải danh sách gói dịch vụ STI' };
        }
    },    // Lấy payment history theo service
    getPaymentsByService: async (serviceType, serviceId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `${API_BASE_URL}/admin/payments/by-service?serviceType=${serviceType}&serviceId=${serviceId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching payments by service:', error);
            return { success: false, message: 'Không thể tải thông tin thanh toán' };
        }
    },
};