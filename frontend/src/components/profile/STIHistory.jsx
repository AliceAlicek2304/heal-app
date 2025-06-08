import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { stiService } from '../../services/stiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import styles from './STIHistory.module.css';

// Status configuration
const STATUS_CONFIG = {
    PENDING: {
        label: 'Chờ xử lý',
        color: 'warning',
        icon: 'clock',
        description: 'Đang chờ xử lý'
    },
    CONFIRMED: {
        label: 'Đã xác nhận',
        color: 'info',
        icon: 'check-circle',
        description: 'Đã xác nhận cuộc hẹn'
    },
    SAMPLED: {
        label: 'Đã lấy mẫu',
        color: 'info',
        icon: 'vial',
        description: 'Đã lấy mẫu xét nghiệm'
    },
    RESULTED: {
        label: 'Có kết quả',
        color: 'success',
        icon: 'file-medical',
        description: 'Đã có kết quả xét nghiệm'
    },
    COMPLETED: {
        label: 'Hoàn thành',
        color: 'success',
        icon: 'check-double',
        description: 'Xét nghiệm hoàn thành'
    },
    CANCELLED: {
        label: 'Đã hủy',
        color: 'danger',
        icon: 'times-circle',
        description: 'Đã hủy cuộc hẹn'
    },
    CANCELED: {
        label: 'Đã hủy',
        color: 'danger',
        icon: 'times-circle',
        description: 'Đã hủy cuộc hẹn'
    }
};

const PAYMENT_STATUS_CONFIG = {
    PENDING: {
        label: 'Chờ thanh toán',
        color: 'warning',
        icon: 'clock'
    }, COMPLETED: {
        label: 'Đã thanh toán',
        color: 'success',
        icon: 'check-circle'
    },
    FAILED: {
        label: 'Thanh toán thất bại',
        color: 'danger',
        icon: 'times-circle'
    },
    EXPIRED: {
        label: 'Đã hết hạn',
        color: 'danger',
        icon: 'clock'
    },
    REFUNDED: {
        label: 'Đã hoàn tiền',
        color: 'info',
        icon: 'undo'
    }
};

const PAYMENT_METHOD_LABELS = {
    COD: 'Thanh toán khi nhận dịch vụ',
    QR_CODE: 'Thanh toán QR Code',
    VISA: 'Thanh toán bằng thẻ VISA',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng'
};

const STIHistory = () => {
    const { user } = useAuth();
    const toast = useToast();

    // State management
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [loadingResults, setLoadingResults] = useState(false);
    const [allServices, setAllServices] = useState([]);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [regeneratingQR, setRegeneratingQR] = useState(false);

    useEffect(() => {
        fetchAllServices();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserTests();
        }
    }, [user]);

    const fetchAllServices = async () => {
        try {
            const response = await stiService.getActiveServices();

            if (response.success && response.data) {

                setAllServices(response.data);
            } else {
                console.error(' Failed to fetch services:', response.message);
                setAllServices([]);
            }
        } catch (error) {
            console.error(' Error fetching services:', error);
            setAllServices([]);
        }
    };

    const fetchUserTests = async () => {
        try {
            setLoading(true);

            const response = await stiService.getMyTests(null, () => {
                window.location.href = '/login';
            });

            console.log('STI Tests Response:', response);

            if (response.success && response.data) {
                if (Array.isArray(response.data)) {
                    setTests(response.data);
                } else {
                    setTests([]);
                }
            } else {
                console.log('No tests found or error:', response.message);
                setTests([]);
            }
        } catch (error) {
            console.error('Error fetching user tests:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
            setTests([]);
        } finally {
            setLoading(false);
        }
    };

    //  FIX: Cải thiện getServiceInfoById để lấy đúng componentCount
    const getServiceInfoById = (serviceId) => {
        if (!serviceId || !allServices.length) {
            return {
                name: 'Dịch vụ xét nghiệm STI',
                description: 'Dịch vụ xét nghiệm STI chuyên nghiệp',
                price: null,
                componentCount: 0
            };
        }

        const service = allServices.find(s => s.serviceId === serviceId);

        if (!service) {
            console.warn(` Service with ID ${serviceId} not found in allServices`);
            return {
                name: 'Dịch vụ không tìm thấy',
                description: 'Dịch vụ xét nghiệm STI',
                price: null,
                componentCount: 0
            };
        }

        return {
            name: service.name || service.serviceName || 'Dịch vụ xét nghiệm STI',
            description: service.description || 'Dịch vụ xét nghiệm STI chuyên nghiệp',
            price: service.price,
            //  FIX: Ưu tiên componentCount từ backend, fallback về testComponents.length
            componentCount: service.componentCount || service.testComponents?.length || 0
        };
    };

    const handleViewDetails = (test) => {
        setSelectedTest(test);
        setShowDetailsModal(true);
    };

    const handleViewResults = async (test) => {
        if (!hasResults(test)) {
            toast.warning('Kết quả xét nghiệm chưa sẵn sàng');
            return;
        }

        try {
            setLoadingResults(true);
            setSelectedTest(test);

            const response = await stiService.getTestResults(test.testId, () => {
                window.location.href = '/login';
            });

            if (response.success && response.data) {
                setTestResults({
                    results: response.data,
                    testId: test.testId,
                    serviceName: getServiceInfoById(test.serviceId).name
                });
                setShowResultsModal(true);
            } else {
                toast.error(response.message || 'Không thể tải kết quả xét nghiệm');
            }
        } catch (error) {
            console.error('Error fetching test results:', error);
            toast.error('Có lỗi xảy ra khi tải kết quả');
        } finally {
            setLoadingResults(false);
        }
    };

    const handleViewPayment = async (test) => {
        try {
            setLoadingPayment(true);
            setSelectedTest(test);

            const response = await stiService.getPaymentInfo(test.testId, () => {
                window.location.href = '/login';
            });

            if (response.success && response.data) {

                //  Map API data to expected format
                const mappedPaymentInfo = {
                    ...response.data,
                    status: response.data.paymentStatus,  // Map paymentStatus → status
                    qrCodeData: response.data.qrCodeUrl,  // Map qrCodeUrl → qrCodeData
                    qrReference: response.data.qrPaymentReference  // Map qrPaymentReference → qrReference
                };
                setPaymentInfo(mappedPaymentInfo);
                setShowPaymentModal(true);
            } else {
                toast.error(response.message || 'Không thể tải thông tin thanh toán');
            }
        } catch (error) {
            console.error('Error fetching payment info:', error);
            toast.error('Có lỗi xảy ra khi tải thông tin thanh toán');
        } finally {
            setLoadingPayment(false);
        }
    };    //  Xử lý thanh toán ngay - hiển thị modal QR hoặc tạo lại QR nếu hết hạn
    const handlePayNow = async (test) => {
        // Sử dụng function kiểm tra expired đã được cải thiện
        const isExpired = isQRExpiredFromTestData(test);

        if (isExpired) {
            // QR đã hết hạn, cần tạo lại
            await handleRegenerateQR(test);
        } else {
            // QR còn hiệu lực, hiển thị modal thanh toán bình thường
            await handleViewPayment(test);
        }
    };

    const handleCheckPaymentStatus = async () => {
        if (!paymentInfo?.qrReference && !paymentInfo?.qrPaymentReference) {
            toast.error('Không tìm thấy thông tin QR để kiểm tra');
            return;
        }

        try {
            setCheckingPayment(true);

            const qrRef = paymentInfo.qrReference || paymentInfo.qrPaymentReference;
            const response = await stiService.checkQRPaymentStatus(qrRef, () => {
                window.location.href = '/login';
            });

            if (response.success) {
                // Refresh payment info
                await handleViewPayment(selectedTest); if (response.data?.status === 'COMPLETED') {
                    toast.success('Thanh toán thành công!');
                    fetchUserTests(); // Refresh danh sách tests
                } else {
                    toast.info('Chưa có thông tin thanh toán mới');
                }
            } else {
                toast.error(response.message || 'Không thể kiểm tra trạng thái thanh toán');
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            toast.error('Có lỗi xảy ra khi kiểm tra thanh toán');
        } finally {
            setCheckingPayment(false);
        }
    };

    const handleCloseDetails = () => {
        setShowDetailsModal(false);
        setSelectedTest(null);
    };

    const handleCloseResults = () => {
        setShowResultsModal(false);
        setSelectedTest(null);
        setTestResults(null);
    };

    const handleClosePayment = () => {
        setShowPaymentModal(false);
        setSelectedTest(null);
        setPaymentInfo(null);
    };

    const handleCancelTest = async (testId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy cuộc hẹn này?')) {
            return;
        }

        try {
            const response = await stiService.cancelTest(testId, () => {
                window.location.href = '/login';
            });

            if (response.success) {
                toast.success('Hủy cuộc hẹn thành công');
                fetchUserTests();
                if (showDetailsModal) {
                    handleCloseDetails();
                }
            } else {
                toast.error(response.message || 'Không thể hủy cuộc hẹn');
            }
        } catch (error) {
            console.error('Error cancelling test:', error);
            toast.error('Có lỗi xảy ra khi hủy cuộc hẹn');
        }
    };

    const isResultNormal = (result) => {
        if (!result.resultValue || !result.normalRange) return true;

        const resultLower = result.resultValue.toLowerCase();
        const normalLower = result.normalRange.toLowerCase();

        if (normalLower.includes('negative')) {
            return resultLower.includes('negative');
        }

        if (normalLower.includes('positive')) {
            return resultLower.includes('positive');
        }

        return resultLower === normalLower;
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'Chưa xác định';

        try {
            //  Fix date format - handle array format from API
            let date;
            if (Array.isArray(dateTimeString)) {
                // Format: [2025, 6, 6, 10, 47, 20, 645941000]
                const [year, month, day, hour, minute, second] = dateTimeString;
                date = new Date(year, month - 1, day, hour, minute, second); // month is 0-indexed
            } else {
                date = new Date(dateTimeString);
            }

            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Ngày không hợp lệ';
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Liên hệ';
        return `${price.toLocaleString('vi-VN')} VNĐ`;
    };

    const canCancelTest = (test) => {
        return test.status === 'PENDING' || test.status === 'CONFIRMED';
    };

    const hasResults = (test) => {
        return test.status === 'RESULTED' || test.status === 'COMPLETED';
    }; const needsPayment = (test) => {
        // Chỉ hiển thị nút thanh toán nếu test chưa bị hủy và chưa hoàn thành
        if (test.status === 'CANCELED' || test.status === 'COMPLETED') {
            return false;
        }

        // Hiển thị nút thanh toán cho QR_CODE payment với status PENDING hoặc EXPIRED
        if (test.paymentMethod === 'QR_CODE') {
            return test.paymentStatus === 'PENDING' || test.paymentStatus === 'EXPIRED';
        }
        return false;
    };    // Helper function để kiểm tra QR có hết hạn từ frontend data không
    const isQRExpiredFromTestData = (test) => {
        // Nếu không phải QR payment, không expired
        if (test.paymentMethod !== 'QR_CODE') {
            return false;
        }

        // Nếu payment status là PENDING hoặc COMPLETED, không expired
        if (test.paymentStatus === 'PENDING' || test.paymentStatus === 'COMPLETED') {
            return false;
        }

        // Nếu payment status là EXPIRED, kiểm tra thời gian thực sự
        if (test.paymentStatus === 'EXPIRED') {
            // Nếu không có thông tin thời gian, tin tưởng backend status
            if (!test.createdAt && !test.updatedAt && !test.paymentUpdatedAt && !test.paymentCreatedAt) {
                return true;
            }

            try {
                let creationTime;
                // Ưu tiên payment timestamps, sau đó test timestamps
                const timeToCheck = test.paymentUpdatedAt || test.paymentCreatedAt || test.updatedAt || test.createdAt;

                if (Array.isArray(timeToCheck)) {
                    const [year, month, day, hour, minute, second] = timeToCheck;
                    creationTime = new Date(year, month - 1, day, hour, minute, second);
                } else {
                    creationTime = new Date(timeToCheck);
                }

                if (isNaN(creationTime.getTime())) {
                    return true; // Invalid date, tin tưởng backend status
                }

                const currentTime = new Date();
                const diffInHours = (currentTime - creationTime) / (1000 * 60 * 60);

                return diffInHours >= 24; // QR expires after 24 hours
            } catch (error) {
                console.error('Error checking QR expiry from test data:', error);
                return true; // Error case, tin tưởng backend status
            }
        }

        return false; // Default case
    };// Helper function để xác định text và style của nút thanh toán
    const getPaymentButtonConfig = (test) => {
        // Kiểm tra trạng thái test trước
        if (test.status === 'CANCELED') {
            return {
                text: 'Xét nghiệm đã hủy',
                className: `${styles.btn} ${styles.btnSecondary}`,
                icon: 'times',
                disabled: true
            };
        } if (test.status === 'COMPLETED') {
            return {
                text: 'Đã hoàn thành',
                className: `${styles.btn} ${styles.btnSecondary}`,
                icon: 'check',
                disabled: true
            };
        }

        // Sử dụng function kiểm tra expired đã được cải thiện
        const isExpired = isQRExpiredFromTestData(test);

        return {
            text: isExpired ? 'Tạo QR mới' : 'Thanh toán ngay',
            className: isExpired ? `${styles.btn} ${styles.btnDanger}` : `${styles.btn} ${styles.btnWarning}`,
            icon: isExpired ? 'exclamation-triangle' : 'credit-card',
            disabled: false
        };
    };

    const getStatusConfig = (status) => {
        const normalizedStatus = status ? status.toString().toUpperCase().trim() : '';

        if (STATUS_CONFIG[normalizedStatus]) {
            return STATUS_CONFIG[normalizedStatus];
        }

        const statusVariants = {
            'CANCEL': 'CANCELLED',
            'DONE': 'COMPLETED',
            'FINISH': 'COMPLETED',
            'FINISHED': 'COMPLETED',
            'COMPLETE': 'COMPLETED',
            'APPROVE': 'CONFIRMED',
            'APPROVED': 'CONFIRMED',
            'ACCEPT': 'CONFIRMED',
            'ACCEPTED': 'CONFIRMED',
            'REJECT': 'CANCELLED',
            'REJECTED': 'CANCELLED',
            'WAITING': 'PENDING',
            'WAIT': 'PENDING'
        };

        if (statusVariants[normalizedStatus]) {
            return STATUS_CONFIG[statusVariants[normalizedStatus]];
        }

        return {
            label: status || 'Chưa xác định',
            color: 'secondary',
            icon: 'question-circle',
            description: `Trạng thái: ${status || 'Không rõ'}`
        };
    };

    const getPaymentStatusConfig = (status) => {
        return PAYMENT_STATUS_CONFIG[status] || {
            label: status || 'Chưa xác định',
            color: 'secondary',
            icon: 'question-circle'
        };
    };

    const generateQRCodeUrl = (qrData, amount = 500000) => {
        if (!qrData) return null;
        const providers = [
            // VietQR với proper encoding
            `https://api.vietqr.io/v2/generate/970422-0349079940-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(qrData)}&accountName=${encodeURIComponent('NGUYEN VAN CUONG')}`,

            // QR Server với banking info
            `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&margin=10&data=${encodeURIComponent(`Bank: MB Bank\nAccount: 0349079940\nName: NGUYEN VAN CUONG\nAmount: ${amount}\nContent: ${qrData}`)}`,

            // Simple text QR
            `https://quickchart.io/qr?size=320&text=${encodeURIComponent(qrData)}`
        ];

        return providers[0];
    }; const handleRegenerateQR = async (test = null) => {
        const targetTest = test || selectedTest;

        if (!targetTest) {
            toast.error('Không tìm thấy thông tin test');
            return;
        }

        try {
            setRegeneratingQR(true);

            // Nếu được gọi từ handlePayNow với test parameter, 
            // cần lấy paymentId từ test
            let paymentId;
            if (test) {
                // Lấy payment info để có paymentId
                const paymentResponse = await stiService.getPaymentInfo(test.testId, () => {
                    window.location.href = '/login';
                });

                if (!paymentResponse.success) {
                    toast.error('Không thể lấy thông tin thanh toán');
                    return;
                }

                paymentId = paymentResponse.data.paymentId;
            } else {
                // Gọi từ modal, sử dụng paymentInfo hiện tại
                if (!paymentInfo) {
                    toast.error('Không tìm thấy thông tin thanh toán');
                    return;
                }
                paymentId = paymentInfo.paymentId;
            }

            const response = await stiService.regenerateQRCode(paymentId, () => {
                window.location.href = '/login';
            }); if (response.success) {
                toast.success('Đã tạo lại mã QR thành công!');

                // Refresh danh sách tests trước để cập nhật trạng thái
                await fetchUserTests();

                // Lấy test object mới nhất từ danh sách đã refresh
                const refreshedTests = await stiService.getMyTests(null, () => {
                    window.location.href = '/login';
                });

                if (refreshedTests.success && refreshedTests.data) {
                    const updatedTest = refreshedTests.data.find(t => t.testId === targetTest.testId);
                    if (updatedTest) {
                        // Sử dụng test object đã được refresh để hiển thị payment modal
                        await handleViewPayment(updatedTest);
                    } else {
                        // Fallback nếu không tìm thấy test
                        await handleViewPayment(targetTest);
                    }
                } else {
                    // Fallback nếu không thể refresh
                    await handleViewPayment(targetTest);
                }
            } else {
                toast.error(response.message || 'Không thể tạo lại mã QR');
            }
        } catch (error) {
            console.error('Error regenerating QR:', error);
            toast.error('Có lỗi xảy ra khi tạo lại mã QR');
        } finally {
            setRegeneratingQR(false);
        }
    };

    // Helper function to check if QR code has expired (24 hours)
    const isQRExpired = (paymentInfo) => {
        if (!paymentInfo?.updatedAt && !paymentInfo?.qrCreatedAt && !paymentInfo?.createdAt) {
            return false; // If no creation time, assume not expired
        }

        try {
            let qrCreationTime;
            // Ưu tiên updatedAt (thời điểm regenerate gần nhất), fallback qrCreatedAt, cuối cùng createdAt
            const creationTime = paymentInfo.updatedAt || paymentInfo.qrCreatedAt || paymentInfo.createdAt;

            if (Array.isArray(creationTime)) {
                // Handle array format: [2025, 6, 6, 10, 47, 20, 645941000]
                const [year, month, day, hour, minute, second] = creationTime;
                qrCreationTime = new Date(year, month - 1, day, hour, minute, second);
            } else {
                qrCreationTime = new Date(creationTime);
            }

            const currentTime = new Date();
            const diffInHours = (currentTime - qrCreationTime) / (1000 * 60 * 60);

            return diffInHours >= 24; // QR expires after 24 hours
        } catch (error) {
            console.error('Error checking QR expiry:', error);
            return false;
        }
    };


    const generateFallbackQR = (qrData, amount = 500000) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&margin=10&data=${encodeURIComponent(`STK: 0349079940\nTen: NGUYEN VAN CUONG\nNH: MB Bank\nST: ${amount.toLocaleString()}\nND: ${qrData}`)}`;
    };

    const renderSVGIcon = (iconName) => {
        const icons = {
            'clock': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
            ),
            'check-circle': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
            ),
            'spinner': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinner}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                </svg>
            ),
            'refresh': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
            ),
            'vial': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 2v6l3 1v9a3 3 0 0 0 6 0V9l3-1V2"></path>
                    <path d="M9 5h6"></path>
                </svg>
            ),
            'file-medical': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
            ),
            'check-double': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,11 12,14 22,4"></polyline>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.91.37 4.15 1.02"></path>
                </svg>
            ),
            'times-circle': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            ),
            'credit-card': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
            ),
            'qrcode': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="5" height="5"></rect>
                    <rect x="3" y="16" width="5" height="5"></rect>
                    <rect x="16" y="3" width="5" height="5"></rect>
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
                    <path d="M21 21v.01"></path>
                    <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
                    <path d="M3 12h.01"></path>
                    <path d="M12 3h.01"></path>
                    <path d="M12 16v.01"></path>
                    <path d="M16 12h1"></path>
                    <path d="M21 12v.01"></path>
                    <path d="M12 21v-1"></path>
                </svg>
            ),
            'undo': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v6h6"></path>
                    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
                </svg>
            ),
            'info-circle': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                </svg>
            ),
            'times': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            ),
            'plus': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            ),
            'question-circle': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            ),
            'calendar-alt': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            ),
            'sticky-note': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5z"></path>
                    <polyline points="16,3 16,8 21,8"></polyline>
                </svg>
            ),
            'user-md': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                    <path d="M12 14l2-2 2 2"></path>
                </svg>
            ),
            'print': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 6,2 18,2 18,9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
            ),
            'exclamation-triangle': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            ),
            'money-bill-wave': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1v6m0 6v6m-8-8h16M4 7h16"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            )
        };
        return icons[iconName] || icons['question-circle'];
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải lịch sử xét nghiệm...</p>
            </div>
        );
    }

    return (
        <div className={styles.stiHistory}>
            <div className={styles.stiHistoryHeader}>
                <h2 className={styles.title}>
                    {renderSVGIcon('vial')}
                    Lịch sử xét nghiệm STI
                </h2>
                <p className={styles.subtitle}>Quản lý và theo dõi các cuộc hẹn xét nghiệm của bạn</p>
                {tests.length > 0 && (
                    <div className={styles.historyStats}>
                        <span className={styles.totalCount}>Tổng số: {tests.length} lần xét nghiệm</span>
                    </div>
                )}
            </div>

            {tests.length > 0 ? (
                <div className={styles.testsList}>
                    {tests.map(test => {
                        const statusConfig = getStatusConfig(test.status);
                        const serviceInfo = getServiceInfoById(test.serviceId);
                        const paymentStatusConfig = getPaymentStatusConfig(test.paymentStatus);

                        return (
                            <div key={test.testId} className={`${styles.testCard} ${styles[`status${statusConfig.color.charAt(0).toUpperCase() + statusConfig.color.slice(1)}`]}`}>
                                <div className={styles.testHeader}>
                                    <div className={styles.testInfo}>
                                        <h3>{serviceInfo.name}</h3>
                                        <div className={styles.testMeta}>
                                            <span className={styles.testId}>Mã: #{test.testId}</span>
                                            <span className={styles.testDate}>{formatDateTime(test.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.statusBadges}>
                                        <span className={`${styles.statusBadge} ${styles[`status${statusConfig.color.charAt(0).toUpperCase() + statusConfig.color.slice(1)}`]}`}>
                                            {renderSVGIcon(statusConfig.icon)}
                                            {statusConfig.label}
                                        </span>
                                        {test.paymentStatus && (
                                            <span className={`${styles.paymentBadge} ${styles[`payment${paymentStatusConfig.color.charAt(0).toUpperCase() + paymentStatusConfig.color.slice(1)}`]}`}>
                                                {renderSVGIcon(paymentStatusConfig.icon)}
                                                {paymentStatusConfig.label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.testDetails}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Thời gian hẹn:</span>
                                        <span className={styles.value}>{formatDateTime(test.appointmentDate)}</span>
                                    </div>
                                    {/*  FIX: Hiển thị số lượng xét nghiệm từ componentCount */}
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Số lượng xét nghiệm:</span>
                                        <span className={styles.value}>
                                            {serviceInfo.componentCount} xét nghiệm
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Giá dịch vụ:</span>
                                        <span className={styles.value}>{formatPrice(serviceInfo.price)}</span>
                                    </div>
                                    {test.paymentMethod && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Phương thức thanh toán:</span>
                                            <span className={styles.value}>{PAYMENT_METHOD_LABELS[test.paymentMethod] || test.paymentMethod}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.testActions}>
                                    <button
                                        className={`${styles.btn} ${styles.btnPrimary}`}
                                        onClick={() => handleViewDetails(test)}
                                    >
                                        {renderSVGIcon('info-circle')}
                                        Chi tiết
                                    </button>                                    {needsPayment(test) && (() => {
                                        const buttonConfig = getPaymentButtonConfig(test);
                                        const isExpired = isQRExpiredFromTestData(test);
                                        const isLoading = loadingPayment || regeneratingQR;

                                        return (
                                            <button
                                                className={buttonConfig.className}
                                                onClick={buttonConfig.disabled ? undefined : () => handlePayNow(test)}
                                                disabled={isLoading || buttonConfig.disabled}
                                            >
                                                {renderSVGIcon((isLoading && !buttonConfig.disabled) ? 'spinner' : buttonConfig.icon)}
                                                {isLoading && !buttonConfig.disabled ? (isExpired ? 'Đang tạo QR mới...' : 'Đang tải...') : buttonConfig.text}
                                            </button>
                                        );
                                    })()}

                                    {hasResults(test) && (
                                        <button
                                            className={`${styles.btn} ${styles.btnSuccess}`}
                                            onClick={() => handleViewResults(test)}
                                            disabled={loadingResults}
                                        >
                                            {renderSVGIcon('file-medical')}
                                            {loadingResults ? 'Đang tải...' : 'Xem kết quả'}
                                        </button>
                                    )}

                                    {canCancelTest(test) && (
                                        <button
                                            className={`${styles.btn} ${styles.btnOutlineDanger}`}
                                            onClick={() => handleCancelTest(test.testId)}
                                        >
                                            {renderSVGIcon('times')}
                                            Hủy hẹn
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        {renderSVGIcon('vial')}
                    </div>
                    <h3>Chưa có lịch sử xét nghiệm</h3>
                    <p>Bạn chưa có cuộc hẹn xét nghiệm nào. Hãy đặt lịch xét nghiệm đầu tiên!</p>
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => window.location.href = '/sti-testing'}
                    >
                        {renderSVGIcon('plus')}
                        Đặt lịch xét nghiệm
                    </button>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedTest && (
                <div className={styles.modalOverlay} onClick={handleCloseDetails}>
                    <div className={`${styles.modalContent} ${styles.detailsModal}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết xét nghiệm #{selectedTest.testId}</h3>
                            <button className={styles.modalCloseBtn} onClick={handleCloseDetails}>
                                {renderSVGIcon('times')}
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Service Information */}
                            <div className={styles.serviceInfo}>
                                <h5>Thông tin dịch vụ</h5>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Tên dịch vụ:</span>
                                        <span className={styles.infoValue}>{getServiceInfoById(selectedTest.serviceId).name}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Mô tả:</span>
                                        <span className={styles.infoValue}>{getServiceInfoById(selectedTest.serviceId).description}</span>
                                    </div>
                                    {/*  FIX: Sử dụng componentCount */}
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Số lượng xét nghiệm:</span>
                                        <span className={styles.infoValue}>
                                            {getServiceInfoById(selectedTest.serviceId).componentCount} xét nghiệm
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Giá dịch vụ:</span>
                                        <span className={styles.infoValue}>{formatPrice(getServiceInfoById(selectedTest.serviceId).price)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Details */}
                            <div className={styles.appointmentDetails}>
                                <h5>Thông tin cuộc hẹn</h5>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        {renderSVGIcon('calendar-alt')}
                                        <div>
                                            <span className={styles.label}>Thời gian đặt hẹn</span>
                                            <span className={styles.value}>{formatDateTime(selectedTest.createdAt)}</span>
                                        </div>
                                    </div>

                                    <div className={styles.detailItem}>
                                        {renderSVGIcon('calendar-alt')}
                                        <div>
                                            <span className={styles.label}>Thời gian hẹn</span>
                                            <span className={styles.value}>{formatDateTime(selectedTest.appointmentDate)}</span>
                                        </div>
                                    </div>

                                    <div className={styles.detailItem}>
                                        {renderSVGIcon('info-circle')}
                                        <div>
                                            <span className={styles.label}>Trạng thái</span>
                                            <span className={`${styles.value} ${styles.statusBadge} ${styles[`status${getStatusConfig(selectedTest.status).color.charAt(0).toUpperCase() + getStatusConfig(selectedTest.status).color.slice(1)}`]}`}>
                                                {renderSVGIcon(getStatusConfig(selectedTest.status).icon)}
                                                {getStatusConfig(selectedTest.status).label}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedTest.paymentStatus && (
                                        <div className={styles.detailItem}>
                                            {renderSVGIcon('credit-card')}
                                            <div>
                                                <span className={styles.label}>Trạng thái thanh toán</span>
                                                <span className={`${styles.value} ${styles.paymentBadge} ${styles[`payment${getPaymentStatusConfig(selectedTest.paymentStatus).color.charAt(0).toUpperCase() + getPaymentStatusConfig(selectedTest.paymentStatus).color.slice(1)}`]}`}>
                                                    {renderSVGIcon(getPaymentStatusConfig(selectedTest.paymentStatus).icon)}
                                                    {getPaymentStatusConfig(selectedTest.paymentStatus).label}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {getServiceInfoById(selectedTest.serviceId).price && (
                                        <div className={styles.detailItem}>
                                            {renderSVGIcon('money-bill-wave')}
                                            <div>
                                                <span className={styles.label}>Giá dịch vụ</span>
                                                <span className={`${styles.value} ${styles.price}`}>{formatPrice(getServiceInfoById(selectedTest.serviceId).price)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Customer Notes */}
                                {selectedTest.customerNotes && (
                                    <div className={styles.notesSection}>
                                        <h6>Ghi chú của khách hàng:</h6>
                                        <div className={styles.notesContent}>
                                            {renderSVGIcon('sticky-note')}
                                            <p>{selectedTest.customerNotes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Consultant Notes */}
                                {selectedTest.consultantNotes && (
                                    <div className={styles.notesSection}>
                                        <h6>Ghi chú của chuyên gia:</h6>
                                        <div className={styles.notesContent}>
                                            {renderSVGIcon('user-md')}
                                            <p>{selectedTest.consultantNotes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleCloseDetails}>
                                Đóng
                            </button>
                            {hasResults(selectedTest) && (
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={() => {
                                        handleCloseDetails();
                                        handleViewResults(selectedTest);
                                    }}
                                >
                                    Xem kết quả
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal với QR Code lớn */}
            {showPaymentModal && selectedTest && paymentInfo && (
                <div className={styles.modalOverlay} onClick={handleClosePayment}>
                    <div className={`${styles.modalContent} ${styles.paymentModal}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Thanh toán #{selectedTest.testId}</h3>
                            <button className={styles.modalCloseBtn} onClick={handleClosePayment}>
                                {renderSVGIcon('times')}
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.paymentDetails}>
                                <h4>
                                    {renderSVGIcon('credit-card')}
                                    Chi tiết thanh toán
                                </h4>

                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Phương thức:</span>
                                        <span className={styles.value}>
                                            {renderSVGIcon(paymentInfo.paymentMethod === 'QR_CODE' ? 'qrcode' : 'credit-card')}
                                            {PAYMENT_METHOD_LABELS[paymentInfo.paymentMethod] || paymentInfo.paymentMethod}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Trạng thái:</span>
                                        <span className={`${styles.value} ${styles.paymentBadge} ${styles[`payment${getPaymentStatusConfig(paymentInfo.status || paymentInfo.paymentStatus).color.charAt(0).toUpperCase() + getPaymentStatusConfig(paymentInfo.status || paymentInfo.paymentStatus).color.slice(1)}`]}`}>
                                            {renderSVGIcon(getPaymentStatusConfig(paymentInfo.status || paymentInfo.paymentStatus).icon)}
                                            {getPaymentStatusConfig(paymentInfo.status || paymentInfo.paymentStatus).label}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Số tiền:</span>
                                        <span className={`${styles.value} ${styles.price}`}>
                                            {formatPrice(paymentInfo.amount)}
                                        </span>
                                    </div>

                                    {paymentInfo.transactionId && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.label}>Mã giao dịch:</span>
                                            <span className={styles.value}>{paymentInfo.transactionId}</span>
                                        </div>
                                    )}

                                    {paymentInfo.paidAt && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.label}>Thời gian thanh toán:</span>
                                            <span className={styles.value}>{formatDateTime(paymentInfo.paidAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>                            {/* QR Code Section - IMPROVED ERROR HANDLING WITH EXPIRY DETECTION */}
                            {paymentInfo.paymentMethod === 'QR_CODE' &&
                                (paymentInfo.status === 'PENDING' || paymentInfo.paymentStatus === 'PENDING') && (
                                    <div className={styles.qrPaymentSection}>
                                        <div className={styles.qrHeader}>
                                            <h5>
                                                {renderSVGIcon('qrcode')}
                                                Quét mã QR để thanh toán
                                            </h5>
                                            <p>Sử dụng ứng dụng ngân hàng để quét mã QR bên dưới</p>

                                            {/* QR Expiry Warning */}
                                            {isQRExpired(paymentInfo) && (
                                                <div className={styles.qrExpiredWarning}>
                                                    {renderSVGIcon('exclamation-triangle')}
                                                    <span>Mã QR đã hết hạn (sau 24 giờ). Vui lòng tạo mã QR mới để thanh toán.</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.qrCodeContainer}>
                                            <div className={`${styles.qrCodeWrapper} ${isQRExpired(paymentInfo) ? styles.expired : ''}`}>
                                                {/*  Primary QR Code với fallback chain */}
                                                {(paymentInfo.qrCodeData || paymentInfo.qrCodeUrl) ? (
                                                    <img
                                                        src={paymentInfo.qrCodeData || paymentInfo.qrCodeUrl}
                                                        alt="QR Code thanh toán"
                                                        className={styles.qrCodeImageLarge}
                                                        onError={(e) => {
                                                            console.error('VietQR failed, trying fallback:', e.target.src);

                                                            //  Try fallback QR generator
                                                            const qrRef = paymentInfo.qrReference || paymentInfo.qrPaymentReference;
                                                            if (qrRef && !e.target.dataset.fallbackAttempted) {
                                                                e.target.dataset.fallbackAttempted = 'true';
                                                                e.target.src = generateFallbackQR(qrRef, paymentInfo.amount);
                                                            } else {
                                                                //  Show manual banking info if all QR fails
                                                                e.target.style.display = 'none';
                                                                const container = e.target.parentNode;
                                                                container.innerHTML = `
                                    <div class="${styles.qrCodePlaceholder}">
                                        <div style="font-size: 48px; margin-bottom: 15px;">🏦</div>
                                        <h6>Thông tin chuyển khoản</h6>
                                        <div class="${styles.manualBankingInfo}">
                                            <div class="${styles.bankDetail}"><strong>Ngân hàng:</strong> MB Bank</div>
                                            <div class="${styles.bankDetail}"><strong>Số TK:</strong> 0349079940</div>
                                            <div class="${styles.bankDetail}"><strong>Chủ TK:</strong> NGUYEN VAN CUONG</div>
                                            <div class="${styles.bankDetail}"><strong>Số tiền:</strong> ${formatPrice(paymentInfo.amount)}</div>
                                            <div class="${styles.bankDetail}"><strong>Nội dung:</strong> ${qrRef || 'HEALSTI' + selectedTest.testId}</div>
                                        </div>
                                        <small style="color: #666; margin-top: 10px; display: block;">
                                            QR Code không khả dụng - Vui lòng chuyển khoản thủ công
                                        </small>
                                    </div>
                                `;
                                                            }
                                                        }}
                                                        onLoad={() => {
                                                            console.log(' QR Code loaded successfully');
                                                        }}
                                                    />
                                                ) : (paymentInfo.qrReference || paymentInfo.qrPaymentReference) ? (
                                                    <img
                                                        src={generateQRCodeUrl(paymentInfo.qrReference || paymentInfo.qrPaymentReference, paymentInfo.amount)}
                                                        alt="QR Code thanh toán"
                                                        className={styles.qrCodeImageLarge}
                                                        onError={(e) => {
                                                            console.error('Generated QR failed, trying fallback');

                                                            const qrRef = paymentInfo.qrReference || paymentInfo.qrPaymentReference;
                                                            if (!e.target.dataset.fallbackAttempted) {
                                                                e.target.dataset.fallbackAttempted = 'true';
                                                                e.target.src = generateFallbackQR(qrRef, paymentInfo.amount);
                                                            } else {
                                                                // Final fallback - manual banking info
                                                                e.target.style.display = 'none';
                                                                const container = e.target.parentNode;
                                                                container.innerHTML = `
                                    <div class="${styles.qrCodePlaceholder}">
                                        <div style="font-size: 48px; margin-bottom: 15px;">💳</div>
                                        <h6>Chuyển khoản thủ công</h6>
                                        <div class="${styles.manualBankingInfo}">
                                            <div class="${styles.bankDetail}"><strong>Ngân hàng:</strong> MB Bank</div>
                                            <div class="${styles.bankDetail}"><strong>Số TK:</strong> 0349079940</div>
                                            <div class="${styles.bankDetail}"><strong>Chủ TK:</strong> NGUYEN VAN CUONG</div>
                                            <div class="${styles.bankDetail}"><strong>Số tiền:</strong> ${formatPrice(paymentInfo.amount)}</div>
                                            <div class="${styles.bankDetail}"><strong>Nội dung:</strong> ${qrRef}</div>
                                        </div>
                                        <small style="color: #666; margin-top: 10px; display: block;">
                                            <strong>Lưu ý:</strong> Nhập chính xác nội dung chuyển tiền
                                        </small>
                                    </div>
                                `;
                                                            }
                                                        }}
                                                        onLoad={() => {
                                                            console.log(' Generated QR Code loaded successfully');
                                                        }}
                                                    />
                                                ) : (
                                                    <div className={styles.qrCodePlaceholder}>
                                                        {renderSVGIcon('qrcode')}
                                                        <span>Đang tạo mã QR...</span>
                                                    </div>
                                                )}

                                                {/* Expired QR Overlay */}
                                                {isQRExpired(paymentInfo) && (
                                                    <div className={styles.qrExpiredOverlay}>
                                                        <div className={styles.expiredMessage}>
                                                            {renderSVGIcon('exclamation-triangle')}
                                                            <span>Mã QR đã hết hạn</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.qrCodeInfo}>
                                                <div className={styles.paymentAmount}>
                                                    <strong>{formatPrice(paymentInfo.amount)}</strong>
                                                </div>
                                                <div className={styles.paymentNote}>
                                                    Mã thanh toán: #{selectedTest.testId}
                                                </div>
                                                {(paymentInfo.qrReference || paymentInfo.qrPaymentReference) && (
                                                    <div className={styles.qrReference}>
                                                        Mã QR: {paymentInfo.qrReference || paymentInfo.qrPaymentReference}
                                                    </div>
                                                )}

                                                {/* QR Creation Time */}
                                                {(paymentInfo.qrCreatedAt || paymentInfo.createdAt) && (
                                                    <div className={styles.qrTimestamp}>
                                                        <small>
                                                            Tạo lúc: {formatDateTime(paymentInfo.qrCreatedAt || paymentInfo.createdAt)}
                                                            {isQRExpired(paymentInfo) && (
                                                                <span className={styles.expiredText}> (Đã hết hạn)</span>
                                                            )}
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Always show manual banking info as backup */}
                                        <div className={styles.manualPaymentBackup}>
                                            <h6>Hoặc chuyển khoản thủ công:</h6>
                                            <div className={styles.bankingDetails}>
                                                <div className={styles.bankRow}>
                                                    <span className={styles.bankLabel}>Ngân hàng:</span>
                                                    <span className={styles.bankValue}>MB Bank (Military Commercial Joint Stock Bank)</span>
                                                </div>
                                                <div className={styles.bankRow}>
                                                    <span className={styles.bankLabel}>Số tài khoản:</span>
                                                    <span className={styles.bankValue}>0349079940</span>
                                                </div>
                                                <div className={styles.bankRow}>
                                                    <span className={styles.bankLabel}>Chủ tài khoản:</span>
                                                    <span className={styles.bankValue}>NGUYEN VAN CUONG</span>
                                                </div>
                                                <div className={styles.bankRow}>
                                                    <span className={styles.bankLabel}>Số tiền:</span>
                                                    <span className={styles.bankValue}>{formatPrice(paymentInfo.amount)}</span>
                                                </div>
                                                <div className={styles.bankRow}>
                                                    <span className={styles.bankLabel}>Nội dung:</span>
                                                    <span className={`${styles.bankValue} ${styles.transferContent}`}>
                                                        {paymentInfo.qrReference || paymentInfo.qrPaymentReference || `HEALSTI${selectedTest.testId}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.transferNote}>
                                                <strong>⚠️ Quan trọng:</strong> Vui lòng nhập chính xác nội dung chuyển tiền để hệ thống tự động xác nhận thanh toán.
                                            </div>
                                        </div>

                                        {/* ...existing instructions... */}
                                        <div className={styles.qrInstructions}>
                                            <h6>Hướng dẫn thanh toán:</h6>
                                            <div className={styles.instructionTabs}>
                                                <div className={styles.instructionTab}>
                                                    <h7><strong>🎯 Cách 1: Quét QR Code</strong></h7>
                                                    <ol>
                                                        <li>Mở ứng dụng ngân hàng (MBBank, VietinBank, VCB, etc.)</li>
                                                        <li>Chọn "Quét mã QR" hoặc "QR Pay"</li>
                                                        <li>Quét mã QR phía trên</li>
                                                        <li>Kiểm tra thông tin và xác nhận</li>
                                                    </ol>
                                                </div>
                                                <div className={styles.instructionTab}>
                                                    <h7><strong>💳 Cách 2: Chuyển khoản thủ công</strong></h7>
                                                    <ol>
                                                        <li>Mở ứng dụng ngân hàng</li>
                                                        <li>Chọn "Chuyển tiền" → "Tài khoản khác"</li>
                                                        <li>Nhập thông tin tài khoản ở trên</li>
                                                        <li><strong>Quan trọng:</strong> Nhập đúng nội dung chuyển tiền</li>
                                                        <li>Xác nhận và hoàn tất giao dịch</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </div>                                        <div className={styles.qrActions}>
                                            {/* Regenerate QR Button - Prominent when expired */}
                                            {isQRExpired(paymentInfo) ? (
                                                <button
                                                    className={`${styles.btn} ${styles.btnWarning} ${styles.regenerateQRPrimary}`}
                                                    onClick={handleRegenerateQR}
                                                    disabled={regeneratingQR}
                                                >
                                                    {renderSVGIcon(regeneratingQR ? 'spinner' : 'refresh')}
                                                    {regeneratingQR ? 'Đang tạo mã QR mới...' : 'Tạo mã QR mới (Bắt buộc)'}
                                                </button>
                                            ) : (
                                                <button
                                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                                    onClick={handleRegenerateQR}
                                                    disabled={regeneratingQR}
                                                >
                                                    {renderSVGIcon(regeneratingQR ? 'spinner' : 'refresh')}
                                                    {regeneratingQR ? 'Đang tạo...' : 'Tạo mã QR mới'}
                                                </button>
                                            )}

                                            <button
                                                className={`${styles.btn} ${styles.btnPrimary}`}
                                                onClick={handleCheckPaymentStatus}
                                                disabled={checkingPayment}
                                            >
                                                {renderSVGIcon(checkingPayment ? 'spinner' : 'refresh')}
                                                {checkingPayment ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                            {/*  Payment Success Section - Fix điều kiện hiển thị */}
                            {(paymentInfo.status === 'COMPLETED' ||
                                paymentInfo.paymentStatus === 'COMPLETED') && (
                                    <div className={styles.paymentSuccessSection}>
                                        <div className={styles.successIcon}>
                                            {renderSVGIcon('check-circle')}
                                        </div>
                                        <h5>Thanh toán thành công!</h5>
                                        <p>Cảm ơn bạn đã thanh toán. Vui lòng đến phòng khám đúng giờ hẹn.</p>
                                        {paymentInfo.transactionId && (
                                            <div className={styles.transactionId}>
                                                Mã giao dịch: {paymentInfo.transactionId}
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleClosePayment}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Modal */}
            {showResultsModal && selectedTest && testResults && (
                <div className={styles.modalOverlay} onClick={handleCloseResults}>
                    <div className={`${styles.modalContent} ${styles.resultsModal}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Kết quả xét nghiệm #{selectedTest.testId}</h3>
                            <button className={styles.modalCloseBtn} onClick={handleCloseResults}>
                                {renderSVGIcon('times')}
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Patient Info */}
                            <div className={styles.resultsHeader}>
                                <div className={styles.patientInfo}>
                                    <h4>Thông tin bệnh nhân</h4>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <span>Họ tên: </span>
                                            <span className={styles.value}>{user?.fullName || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span>Ngày xét nghiệm: </span>
                                            <span className={styles.value}>{formatDateTime(selectedTest.appointmentDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Results Content */}
                            <div className={styles.resultsContent}>
                                <h4>Kết quả xét nghiệm</h4>
                                {testResults.results && testResults.results.length > 0 ? (
                                    <div className={styles.resultsTable}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Chỉ số</th>
                                                    <th>Kết quả</th>
                                                    <th>Giá trị tham chiếu</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {testResults.results.map((result, index) => (
                                                    <tr key={result.resultId || index}>
                                                        <td>{result.componentName}</td>
                                                        <td className={styles.resultValue}>
                                                            {result.resultValue}
                                                            {result.unit && <span className={styles.unit}> {result.unit}</span>}
                                                        </td>
                                                        <td>{result.normalRange || 'N/A'}</td>
                                                        <td>
                                                            <span className={`${styles.resultStatus} ${isResultNormal(result) ? styles.normal : styles.abnormal}`}>
                                                                {renderSVGIcon(isResultNormal(result) ? 'check-circle' : 'exclamation-triangle')}
                                                                {isResultNormal(result) ? 'Bình thường' : 'Bất thường'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={styles.noResults}>
                                        <p>Chưa có kết quả xét nghiệm chi tiết</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.btn} ${styles.btnOutlinePrimary}`}
                                onClick={() => window.print()}
                            >
                                {renderSVGIcon('print')}
                                In kết quả
                            </button>
                            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleCloseResults}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default STIHistory;