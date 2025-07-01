import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import { stiService } from '../../services/stiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import Pagination from '../common/Pagination/Pagination';
import { exportSTIResultToPDF, exportSTIResultToExcel } from '../../utils/exportUtils';
import styles from './ManageSTITests.module.css';

const ManageSTITests = () => {
    const { user } = useAuth();
    const toast = useToast();

    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedTest, setSelectedTest] = useState(null); const [showModal, setShowModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [testResults, setTestResults] = useState([]);
    const [showResultModal, setShowResultModal] = useState(false);
    const [showViewResultModal, setShowViewResultModal] = useState(false); const [selectedTestResults, setSelectedTestResults] = useState(null);
    const [filters, setFilters] = useState({});
    const [filteredTests, setFilteredTests] = useState([]);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12); // Items per page (constant)

    // Ref for scrolling to tests list
    const testsListRef = useRef(null);

    useEffect(() => {
        loadTests();
    }, [activeTab]);

    const loadTests = async () => {
        try {
            setLoading(true);
            let response;

            switch (activeTab) {
                case 'pending':
                    response = await stiService.getPendingTests(() => {
                        toast.error('Phiên đăng nhập hết hạn');
                    });
                    break;
                case 'confirmed':
                    response = await stiService.getConfirmedTests(() => {
                        toast.error('Phiên đăng nhập hết hạn');
                    });
                    break;
                case 'my-tests':
                    response = await stiService.getStaffTests(() => {
                        toast.error('Phiên đăng nhập hết hạn');
                    });
                    break;
                default:
                    response = await stiService.getPendingTests(() => {
                        toast.error('Phiên đăng nhập hết hạn');
                    });
            }

            // Sắp xếp theo testId giảm dần (mới nhất lên đầu)
            const sortedTests = response.success && response.data
                ? response.data.sort((a, b) => {
                    // Sắp xếp theo testId trước, nếu không có thì theo createdAt
                    if (a.testId && b.testId) {
                        return b.testId - a.testId;
                    }
                    // Fallback: sắp xếp theo createdAt
                    if (a.createdAt && b.createdAt) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return 0;
                })
                : [];

            setTests(sortedTests);
        } catch (error) {
            console.error('Error loading tests:', error);
            toast.error('Không thể tải danh sách xét nghiệm');
            setTests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (testId, newStatus, additionalData = {}) => {
        try {
            setUpdating(true);
            let response;

            const onAuthRequired = () => {
                toast.error('Phiên đăng nhập hết hạn');
            };

            switch (newStatus) {
                case 'CONFIRMED':
                    response = await stiService.confirmTest(testId, onAuthRequired);
                    break;
                case 'SAMPLED':
                    response = await stiService.sampleTest(testId, onAuthRequired);
                    break;
                case 'RESULTED':
                    response = await stiService.addTestResults(testId, additionalData, onAuthRequired);
                    break;
                case 'COMPLETED':
                    response = await stiService.completeTest(testId, onAuthRequired);
                    break;
                default:
                    throw new Error('Invalid status');
            }

            if (response.success) {
                toast.success(`Cập nhật trạng thái thành công`);
                setShowModal(false);
                setShowResultModal(false);
                setSelectedTest(null);
                loadTests();
            } else {
                // Xử lý lỗi thanh toán chưa hoàn thành
                let errorMessage = response.message || 'Cập nhật thất bại';

                if (response.message && response.message.includes('payment not completed')) {
                    errorMessage = 'Không thể xác nhận xét nghiệm: Khách hàng chưa thanh toán hoặc thanh toán chưa được xác nhận. Vui lòng kiểm tra lại trạng thái thanh toán.';
                } else if (response.message && response.message.includes('payment')) {
                    errorMessage = 'Có lỗi xảy ra với thanh toán. Vui lòng kiểm tra lại thông tin thanh toán của khách hàng.';
                } else if (response.message && response.message.includes('Test results are required')) {
                    errorMessage = 'Vui lòng nhập ít nhất một kết quả xét nghiệm để chuyển sang trạng thái có kết quả.';
                } else if (response.message && response.message.includes('test results could not be saved')) {
                    errorMessage = 'Một số kết quả xét nghiệm không thể lưu. Vui lòng kiểm tra và thử lại.';
                } else if (response.message && response.message.includes('all test results must be filled')) {
                    errorMessage = 'Không thể hoàn thành xét nghiệm: Tất cả kết quả xét nghiệm phải được nhập đầy đủ trước khi đánh dấu hoàn thành.';
                }

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error updating test:', error);
            toast.error('Có lỗi xảy ra khi cập nhật');
        } finally {
            setUpdating(false);
        }
    };

    const handleViewDetails = (test) => {
        setSelectedTest(test);
        setShowModal(true);
    };

    const handleAddResults = async (test) => {
        setSelectedTest(test);

        // Xử lý khác nhau cho test lẻ và test package
        if (test.packageId) {
            // Đây là test package - load components từ tất cả services trong package
            await loadTestComponentsForPackage(test.packageId);
        } else if (test.serviceId) {
            // Đây là test lẻ - load components từ service
            await loadTestComponents(test.serviceId);
        } else {
            toast.error('Không thể xác định loại test');
            return;
        }

        // Nếu test đã ở trạng thái RESULTED, load kết quả hiện tại để cập nhật
        if (test.status === 'RESULTED') {
            try {
                const response = await stiService.getTestResults(test.testId, () => {
                    toast.error('Phiên đăng nhập hết hạn');
                });

                if (response.success && response.data) {
                    const existingResults = response.data;
                    setTestResults(prevResults =>
                        prevResults.map(component => {
                            const existingResult = existingResults.find(result =>
                                result.componentId === component.componentId
                            );
                            return existingResult ? {
                                ...component,
                                resultValue: existingResult.resultValue || '',
                                referenceRange: component.referenceRange || existingResult.referenceRange || '',
                                unit: existingResult.unit || component.unit || ''
                            } : component;
                        })
                    );
                }
            } catch (error) {
                console.error('Error loading existing test results:', error);
                // Continue without existing results if there's an error
            }
        }

        setShowResultModal(true);
    };

    const handleViewResults = async (test) => {
        try {
            setSelectedTest(test);
            const response = await stiService.getTestResults(test.testId, () => {
                toast.error('Phiên đăng nhập hết hạn');
            });

            if (response.success && response.data) {
                // If test is from a package and backend doesn't provide service info, enhance data
                if (test.packageId && Array.isArray(response.data)) {
                    try {
                        // Enhance test results with service info if not already present
                        const enhancedResults = [...response.data];

                        // If package details are available, get component to service mapping
                        const packageResponse = await import('../../services/stiPackageService')
                            .then(module => module.default.getPackageById(test.packageId));

                        if (packageResponse.success && packageResponse.data.services) {
                            // Create a mapping of componentId to serviceId and serviceName
                            const componentServiceMap = {};

                            // For each service in the package, load its components
                            for (const service of packageResponse.data.services) {
                                const serviceDetails = await stiService.getServiceDetails(service.serviceId);

                                if (serviceDetails.success && serviceDetails.data.testComponents) {
                                    serviceDetails.data.testComponents.forEach(comp => {
                                        componentServiceMap[comp.componentId] = {
                                            serviceId: service.serviceId,
                                            serviceName: service.name || service.serviceName
                                        };
                                    });
                                }
                            }

                            // Map service info to each test result
                            enhancedResults.forEach(result => {
                                const componentId = result.componentId;
                                const serviceInfo = componentServiceMap[componentId];

                                if (serviceInfo) {
                                    result.serviceId = serviceInfo.serviceId;
                                    result.serviceName = serviceInfo.serviceName;
                                }
                            });
                        }

                        // Use enhanced results
                        setSelectedTestResults(enhancedResults);
                    } catch (error) {
                        console.error('Error enhancing test results with service info:', error);
                        // Fall back to original results if enhancement fails
                        setSelectedTestResults(response.data);
                    }
                } else {
                    // Use original results for non-package tests
                    setSelectedTestResults(response.data);
                }

                setShowViewResultModal(true);
            } else {
                toast.error(response.message || 'Không thể tải kết quả xét nghiệm');
            }
        } catch (error) {
            console.error('Error fetching test results:', error);
            toast.error('Có lỗi xảy ra khi tải kết quả');
        }
    };

    const loadTestComponents = async (serviceId) => {
        try {
            const response = await stiService.getServiceDetails(serviceId);
            if (response.success && response.data.testComponents) {
                const initialResults = response.data.testComponents.map(component => ({
                    componentId: component.componentId,
                    componentName: component.testName,
                    resultValue: '',
                    referenceRange: component.referenceRange || '',
                    unit: component.unit || ''
                }));
                setTestResults(initialResults);
            } else {
                toast.error('Không thể tải thông tin các thành phần xét nghiệm');
                console.error('Failed to load test components:', response);
            }
        } catch (error) {
            console.error('Error loading test components:', error);
            toast.error('Không thể tải thông tin xét nghiệm');
        }
    };

    const loadTestComponentsForPackage = async (packageId) => {
        try {
            const { default: stiPackageService } = await import('../../services/stiPackageService');
            const response = await stiPackageService.getPackageById(packageId);
            if (response.success && response.data.services) {
                const allComponents = [];
                for (const service of response.data.services) {
                    try {
                        const serviceDetails = await stiService.getServiceDetails(service.serviceId);
                        if (serviceDetails.success && serviceDetails.data.testComponents) {
                            serviceDetails.data.testComponents.forEach(component => {
                                const existingComponent = allComponents.find(c => c.componentId === component.componentId);
                                if (!existingComponent) {
                                    allComponents.push({
                                        componentId: component.componentId,
                                        componentName: component.testName,
                                        resultValue: '',
                                        referenceRange: component.referenceRange || '',
                                        unit: component.unit || '',
                                        serviceName: service.name || service.serviceName,
                                        serviceId: service.serviceId
                                    });
                                } else {
                                    console.warn(`Duplicate componentId ${component.componentId} found, skipping...`);
                                }
                            });
                        }
                    } catch (serviceError) {
                        console.error(`Error loading components for service ${service.serviceId}:`, serviceError);
                        toast.error(`Không thể tải thành phần của dịch vụ ${service.name}`);
                    }
                }
                if (allComponents.length > 0) {
                    setTestResults(allComponents);
                } else {
                    toast.error('Gói xét nghiệm không có thành phần nào');
                }
            } else {
                toast.error('Không thể tải thông tin gói xét nghiệm');
                console.error('Failed to load package components:', response);
            }
        } catch (error) {
            console.error('Error loading package components:', error);
            toast.error('Không thể tải thông tin gói xét nghiệm');
        }
    };

    const handleResultChange = (index, field, value) => {
        setTestResults(prev => prev.map((result, i) =>
            i === index ? { ...result, [field]: value } : result
        ));
    };

    const handleSubmitResults = () => {
        const validResults = testResults.filter(result => result.resultValue.trim() !== '');
        if (validResults.length === 0) {
            toast.error('Vui lòng nhập ít nhất một kết quả');
            return;
        }
        const resultData = {
            status: 'RESULTED',
            results: validResults.map(result => ({
                componentId: result.componentId,
                resultValue: result.resultValue
            }))
        };
        handleStatusUpdate(selectedTest.testId, 'RESULTED', resultData);
    };

    // Export functions for STI test results
    const handleExportToPDF = async () => {
        if (!selectedTest || !selectedTestResults) {
            toast.error('Không có dữ liệu để xuất báo cáo');
            return;
        }

        try {
            setExportingPDF(true);

            // Prepare data for export
            const exportData = {
                test: selectedTest,
                results: selectedTestResults,
                customerInfo: {
                    name: selectedTest.customerName,
                    email: selectedTest.customerEmail,
                    phone: selectedTest.customerPhone,
                    id: selectedTest.customerId
                },
                testInfo: {
                    id: selectedTest.testId,
                    serviceName: selectedTest.serviceName,
                    serviceDescription: selectedTest.serviceDescription,
                    appointmentDate: selectedTest.appointmentDate,
                    resultDate: selectedTest.resultDate,
                    staffName: selectedTest.staffName,
                    consultantNotes: selectedTest.consultantNotes
                }
            };

            await exportSTIResultToPDF(exportData);
            toast.success('Xuất báo cáo PDF thành công!');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error('Có lỗi xảy ra khi xuất PDF');
        } finally {
            setExportingPDF(false);
        }
    };

    const handleExportToExcel = async () => {
        if (!selectedTest || !selectedTestResults) {
            toast.error('Không có dữ liệu để xuất báo cáo');
            return;
        }

        try {
            setExportingExcel(true);

            // Prepare data for export
            const exportData = {
                test: selectedTest,
                results: selectedTestResults,
                customerInfo: {
                    name: selectedTest.customerName,
                    email: selectedTest.customerEmail,
                    phone: selectedTest.customerPhone,
                    id: selectedTest.customerId
                },
                testInfo: {
                    id: selectedTest.testId,
                    serviceName: selectedTest.serviceName,
                    serviceDescription: selectedTest.serviceDescription,
                    appointmentDate: selectedTest.appointmentDate,
                    resultDate: selectedTest.resultDate,
                    staffName: selectedTest.staffName,
                    consultantNotes: selectedTest.consultantNotes
                }
            };

            await exportSTIResultToExcel(exportData);
            toast.success('Xuất báo cáo Excel thành công!');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            toast.error('Có lỗi xảy ra khi xuất Excel');
        } finally {
            setExportingExcel(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'PENDING': '#ffa500',
            'CONFIRMED': '#007bff',
            'SAMPLED': '#17a2b8',
            'RESULTED': '#28a745',
            'COMPLETED': '#6f42c1',
            'CANCELED': '#dc3545'
        };
        return colors[status] || '#6c757d';
    };

    const getStatusText = (status) => {
        const texts = {
            'PENDING': 'Chờ xác nhận',
            'CONFIRMED': 'Đã xác nhận',
            'SAMPLED': 'Đã lấy mẫu',
            'RESULTED': 'Có kết quả',
            'COMPLETED': 'Hoàn thành',
            'CANCELED': 'Đã hủy'
        };
        return texts[status] || status;
    };

    const getPaymentMethodText = (method) => {
        const methods = {
            'VISA': 'Thẻ VISA',
            'QR': 'Thanh toán QR',
            'COD': 'Thanh toán khi nhận dịch vụ'
        };
        return methods[method] || method || 'Chưa xác định';
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'VISA':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                );
            case 'QR':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="5" height="5"></rect>
                        <rect x="16" y="3" width="5" height="5"></rect>
                        <rect x="3" y="16" width="5" height="5"></rect>
                        <line x1="21" y1="15" x2="21" y2="18"></line>
                        <line x1="21" y1="21" x2="21" y2="21.01"></line>
                    </svg>
                );
            case 'COD':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                    </svg>
                );
            default:
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                );
        }
    };

    const getPaymentStatusText = (status) => {
        const statuses = {
            'PENDING': 'Chờ thanh toán',
            'COMPLETED': 'Đã thanh toán',
            'FAILED': 'Thất bại',
            'CANCELLED': 'Đã hủy',
            'REFUNDED': 'Đã hoàn tiền'
        };
        return statuses[status] || status || 'Chưa xác định';
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            'PENDING': '#ffa500',
            'COMPLETED': '#28a745',
            'FAILED': '#dc3545',
            'CANCELLED': '#6c757d',
            'REFUNDED': '#17a2b8'
        };
        return colors[status] || '#6c757d';
    };

    const shouldShowPaymentWarning = (test) => {
        return test.status === 'PENDING' &&
            test.paymentStatus === 'PENDING' &&
            (test.paymentMethod === 'QR' || test.paymentMethod === 'VISA');
    };

    const getPaymentWarningMessage = (test) => {
        if (test.paymentMethod === 'QR') {
            return 'Khách hàng chưa thanh toán qua mã QR. Vui lòng liên hệ khách hàng hoặc chờ thanh toán hoàn tất trước khi xác nhận.';
        } else if (test.paymentMethod === 'VISA') {
            return 'Thanh toán qua thẻ VISA chưa được xác nhận. Vui lòng kiểm tra lại trạng thái thanh toán.';
        }
        return 'Thanh toán chưa hoàn tất. Vui lòng kiểm tra lại trước khi xác nhận xét nghiệm.';
    };

    // Thêm hàm xác nhận thủ công thanh toán QR
    const handleManualConfirmQR = async (test) => {
        try {
            setUpdating(true);
            const token = localStorage.getItem('authToken');
            if (!token) {
                toast.error('Bạn cần đăng nhập lại');
                return;
            }
            if (!test.qrPaymentReference) {
                toast.error('Không tìm thấy mã QR để xác nhận');
                return;
            }
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/payments/qr/${test.qrPaymentReference}/simulate-success`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            if (response.ok && data.success) {
                toast.success('Đã xác nhận thanh toán QR thành công!');
                loadTests();
            } else {
                toast.error(data.message || 'Xác nhận thanh toán thất bại');
            }
        } catch (error) {
            toast.error('Có lỗi khi xác nhận thanh toán QR');
        } finally {
            setUpdating(false);
        }
    };

    const renderActionButtons = (test) => {
        const status = test.status;
        const isQR = test.paymentMethod === 'QR_CODE' || test.paymentMethod === 'QR';
        const canManualConfirmQR = status === 'PENDING' && isQR && test.paymentStatus === 'PENDING' && test.qrPaymentReference;
        return (
            <div className={styles.actionButtons}>
                <button
                    onClick={() => handleViewDetails(test)}
                    className={`${styles.actionBtn} ${styles.viewBtn}`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Chi tiết
                </button>

                {status === 'PENDING' && (
                    <button
                        onClick={() => handleStatusUpdate(test.testId, 'CONFIRMED')}
                        className={`${styles.actionBtn} ${styles.confirmBtn}`}
                        disabled={updating}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        Xác nhận
                    </button>
                )}

                {status === 'CONFIRMED' && (
                    <button
                        onClick={() => handleStatusUpdate(test.testId, 'SAMPLED')}
                        className={`${styles.actionBtn} ${styles.sampleBtn}`}
                        disabled={updating}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path>
                            <rect x="9" y="7" width="6" height="6" rx="1"></rect>
                        </svg>
                        Lấy mẫu
                    </button>
                )}

                {status === 'SAMPLED' && (
                    <button
                        onClick={() => handleAddResults(test)}
                        className={`${styles.actionBtn} ${styles.resultBtn}`}
                        disabled={updating}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        Nhập kết quả
                    </button>
                )}                {status === 'RESULTED' && (
                    <>
                        <button
                            onClick={() => handleAddResults(test)}
                            className={`${styles.actionBtn} ${styles.resultBtn}`}
                            disabled={updating}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            Cập nhật kết quả
                        </button>
                        <button
                            onClick={() => handleViewResults(test)}
                            className={`${styles.actionBtn} ${styles.viewResultBtn}`}
                            disabled={updating}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            Xem kết quả
                        </button>
                        <button
                            onClick={() => handleStatusUpdate(test.testId, 'COMPLETED')}
                            className={`${styles.actionBtn} ${styles.completeBtn}`}
                            disabled={updating}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Hoàn thành
                        </button>
                    </>
                )}

                {status === 'COMPLETED' && (
                    <button
                        onClick={() => handleViewResults(test)}
                        className={`${styles.actionBtn} ${styles.viewResultBtn}`}
                        disabled={updating}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        Xem kết quả
                    </button>
                )}

                {canManualConfirmQR && (
                    <button
                        onClick={() => handleManualConfirmQR(test)}
                        className={`${styles.actionBtn} ${styles.confirmBtn}`}
                        disabled={updating}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="5" height="5"></rect>
                            <rect x="16" y="3" width="5" height="5"></rect>
                            <rect x="3" y="16" width="5" height="5"></rect>
                            <line x1="21" y1="15" x2="21" y2="18"></line>
                            <line x1="21" y1="21" x2="21" y2="21.01"></line>
                        </svg>
                        Xác nhận đã thanh toán QR
                    </button>
                )}
            </div>
        );
    };

    // Filter tests based on selected filters
    const applyFilters = (testsToFilter, currentFilters) => {
        let filtered = [...testsToFilter];

        // Text search filter
        if (currentFilters.searchText) {
            const searchLower = currentFilters.searchText.toLowerCase();
            filtered = filtered.filter(test => {
                return (
                    test.testId?.toString().includes(searchLower) ||
                    test.serviceName?.toLowerCase().includes(searchLower) ||
                    test.customerName?.toLowerCase().includes(searchLower) ||
                    test.customerEmail?.toLowerCase().includes(searchLower) ||
                    test.customerPhone?.includes(searchLower) ||
                    test.customerNotes?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Status filter
        if (currentFilters.status) {
            filtered = filtered.filter(test => test.status === currentFilters.status);
        }        // Date range filter
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            filtered = filtered.filter(test => {
                let testDate;

                // Handle different date formats from backend
                const rawDate = test.appointmentDate || test.createdAt;
                if (Array.isArray(rawDate)) {
                    // Array format: [year, month, day, hour, minute, second, nanosecond]
                    // Note: month is 1-based in array, but Date constructor expects 0-based
                    testDate = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
                } else if (typeof rawDate === 'string' || rawDate instanceof Date) {
                    testDate = new Date(rawDate);
                } else {
                    console.warn('Unknown date format:', rawDate);
                    return false;
                }

                if (currentFilters.dateFrom) {
                    const fromDate = new Date(currentFilters.dateFrom);
                    if (testDate < fromDate) return false;
                }

                if (currentFilters.dateTo) {
                    const toDate = new Date(currentFilters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (testDate > toDate) return false;
                }

                return true;
            });
        }

        return filtered;
    };    // Effect to apply filters when tests or filters change
    useEffect(() => {
        const filtered = applyFilters(tests, filters);
        setFilteredTests(filtered);
        // Reset to first page when filters change
        setCurrentPage(1);
    }, [tests, filters]);

    // Reset to first page when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);

        // Scroll to tests list when changing pages
        if (testsListRef.current) {
            testsListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // Fallback: scroll to top of page
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={styles.manageTests}>
            <div className={styles.header}>
                <h2>Quản lý STI Tests</h2>
                <button
                    onClick={loadTests}
                    className={styles.refreshBtn}
                    disabled={loading}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <polyline points="1,20 1,14 7,14"></polyline>
                        <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,4.36L23,14"></path>
                    </svg>
                    Làm mới
                </button>
            </div>

            <div className={styles.tabs}>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={activeTab === 'pending' ? styles.activeTab : styles.tab}
                >
                    Chờ xác nhận
                </button>
                <button
                    onClick={() => setActiveTab('confirmed')}
                    className={activeTab === 'confirmed' ? styles.activeTab : styles.tab}
                >
                    Đã xác nhận
                </button>
                <button
                    onClick={() => setActiveTab('my-tests')}
                    className={activeTab === 'my-tests' ? styles.activeTab : styles.tab}
                >
                    Của tôi
                </button>            </div>

            {/* Advanced Filter Component */}
            <AdvancedFilter
                onFilterChange={handleFilterChange}
                statusOptions={[
                    { value: 'PENDING', label: 'Chờ xác nhận' },
                    { value: 'CONFIRMED', label: 'Đã xác nhận' },
                    { value: 'SAMPLED', label: 'Đã lấy mẫu' },
                    { value: 'RESULTED', label: 'Có kết quả' },
                    { value: 'COMPLETED', label: 'Hoàn thành' },
                    { value: 'CANCELED', label: 'Đã hủy' }
                ]}
                placeholder="Tìm kiếm theo mã test, tên khách hàng, email, SĐT..."
                showDateFilter={true}
                showStatusFilter={true}
            />            {/* Calculate pagination data */}
            {(() => {
                const indexOfLastItem = currentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentItems = filteredTests.slice(indexOfFirstItem, indexOfLastItem);
                const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

                return (
                    <>
                        {tests.length > 0 && (
                            <div className={styles.statsInfo}>
                                Hiển thị: {Math.min(indexOfFirstItem + 1, filteredTests.length)}-{Math.min(indexOfLastItem, filteredTests.length)}
                                trong tổng số {filteredTests.length}/{tests.length} xét nghiệm
                            </div>
                        )}

                        {loading ? (
                            <div className={styles.loadingContainer}>
                                <LoadingSpinner />
                                <p>Đang tải danh sách xét nghiệm...</p>
                            </div>
                        ) : filteredTests.length === 0 ? (
                            tests.length > 0 ? (
                                <div className={styles.emptyState}>
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path>
                                        <rect x="9" y="7" width="6" height="6" rx="1"></rect>
                                        <path d="M12 1v6"></path>
                                    </svg>
                                    <h3>Không tìm thấy kết quả</h3>
                                    <p>Không có xét nghiệm nào phù hợp với bộ lọc hiện tại.</p>
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path>
                                        <rect x="9" y="7" width="6" height="6" rx="1"></rect>
                                        <path d="M12 1v6"></path>
                                    </svg>
                                    <h3>Không có xét nghiệm nào</h3>
                                    <p>Hiện tại không có xét nghiệm nào trong danh mục này.</p>
                                </div>
                            )
                        ) : (
                            <>
                                <div ref={testsListRef} className={styles.testsGrid}>
                                    {currentItems.map((test) => (
                                        <div key={test.testId} className={styles.testCard}>
                                            <div className={styles.cardHeader}>
                                                <div className={styles.testInfo}>
                                                    <h3>#{test.testId}</h3>
                                                    <p className={styles.serviceName}>{test.serviceName}</p>
                                                </div>
                                                <div
                                                    className={styles.statusBadge}
                                                    style={{ backgroundColor: getStatusColor(test.status) }}
                                                >
                                                    {getStatusText(test.status)}
                                                </div>
                                            </div>

                                            <div className={styles.cardBody}>
                                                <div className={styles.customerInfo}>
                                                    <p><strong>Khách hàng:</strong> {test.customerName}</p>
                                                    <p><strong>Email:</strong> {test.customerEmail}</p>
                                                    <p><strong>SĐT:</strong> {test.customerPhone}</p>
                                                </div>

                                                <div className={styles.appointmentInfo}>
                                                    <p><strong>Ngày hẹn:</strong> {formatDateTime(test.appointmentDate)}</p>
                                                    <p><strong>Giá:</strong> {test.totalPrice?.toLocaleString()} VNĐ</p>
                                                    <p><strong>Ngày tạo:</strong> {formatDateTime(test.createdAt)}</p>
                                                    <p>
                                                        <strong>Thanh toán:</strong>
                                                        <span className={styles.inlinePaymentMethod}>
                                                            {getPaymentMethodText(test.paymentMethod)}
                                                        </span>
                                                        <span
                                                            className={styles.inlinePaymentStatus}
                                                            style={{ color: getPaymentStatusColor(test.paymentStatus) }}
                                                        >
                                                            ({getPaymentStatusText(test.paymentStatus)})
                                                        </span>
                                                    </p>
                                                </div>

                                                {test.customerNotes && (
                                                    <div className={styles.notes}>
                                                        <p><strong>Ghi chú:</strong> {test.customerNotes}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.cardFooter}>
                                                {renderActionButtons(test)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Component */}
                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                )}
                            </>
                        )}
                    </>
                );
            })()}

            {/* Detail Modal */}
            {showModal && selectedTest && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết xét nghiệm #{selectedTest.testId}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className={styles.closeBtn}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.detailSection}>
                                <h4>Thông tin khách hàng</h4>
                                <div className={styles.detailGrid}>
                                    <div><strong>Tên:</strong> {selectedTest.customerName}</div>
                                    <div><strong>Email:</strong> {selectedTest.customerEmail}</div>
                                    <div><strong>SĐT:</strong> {selectedTest.customerPhone}</div>
                                    <div><strong>ID khách hàng:</strong> {selectedTest.customerId}</div>
                                </div>
                            </div>

                            <div className={styles.detailSection}>
                                <h4>Thông tin dịch vụ</h4>
                                <div className={styles.detailGrid}>
                                    <div><strong>Dịch vụ:</strong> {selectedTest.serviceName}</div>
                                    <div><strong>Mô tả:</strong> {selectedTest.serviceDescription}</div>
                                    <div><strong>Giá:</strong> {selectedTest.totalPrice?.toLocaleString()} VNĐ</div>
                                    <div>
                                        <strong>Trạng thái:</strong>
                                        <span
                                            className={styles.statusText}
                                            style={{ color: getStatusColor(selectedTest.status) }}
                                        >
                                            {getStatusText(selectedTest.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>                            <div className={styles.detailSection}>
                                <h4>Thông tin lịch hẹn</h4>
                                <div className={styles.detailGrid}>
                                    <div><strong>Ngày hẹn:</strong> {formatDateTime(selectedTest.appointmentDate)}</div>
                                    <div><strong>Ngày tạo:</strong> {formatDateTime(selectedTest.createdAt)}</div>
                                    <div><strong>Cập nhật:</strong> {formatDateTime(selectedTest.updatedAt)}</div>
                                    {selectedTest.resultDate && (
                                        <div><strong>Ngày có kết quả:</strong> {formatDateTime(selectedTest.resultDate)}</div>
                                    )}
                                </div>
                            </div>                            <div className={styles.detailSection}>
                                <h4>Thông tin thanh toán</h4>
                                {shouldShowPaymentWarning(selectedTest) && (
                                    <div className={styles.paymentWarning}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                            <line x1="12" y1="9" x2="12" y2="13"></line>
                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        <span>{getPaymentWarningMessage(selectedTest)}</span>
                                    </div>
                                )}
                                <div className={styles.detailGrid}>
                                    <div>
                                        <strong>Phương thức:</strong>
                                        <span className={styles.paymentMethod}>
                                            {getPaymentMethodIcon(selectedTest.paymentMethod)}
                                            {getPaymentMethodText(selectedTest.paymentMethod)}
                                        </span>
                                    </div>
                                    <div>
                                        <strong>Trạng thái:</strong>
                                        <span
                                            className={styles.paymentStatus}
                                            style={{ color: getPaymentStatusColor(selectedTest.paymentStatus) }}
                                        >
                                            {getPaymentStatusText(selectedTest.paymentStatus)}
                                        </span>
                                    </div>
                                    {selectedTest.paidAt && (
                                        <div><strong>Ngày thanh toán:</strong> {formatDateTime(selectedTest.paidAt)}</div>
                                    )}
                                    {selectedTest.paymentTransactionId && (
                                        <div><strong>Mã giao dịch:</strong> {selectedTest.paymentTransactionId}</div>
                                    )}
                                    {selectedTest.qrPaymentReference && (
                                        <div><strong>Mã QR:</strong> {selectedTest.qrPaymentReference}</div>
                                    )}
                                    {selectedTest.qrExpiresAt && (
                                        <div><strong>QR hết hạn:</strong> {formatDateTime(selectedTest.qrExpiresAt)}</div>
                                    )}
                                </div>
                            </div>

                            {selectedTest.customerNotes && (
                                <div className={styles.detailSection}>
                                    <h4>Ghi chú của khách hàng</h4>
                                    <p>{selectedTest.customerNotes}</p>
                                </div>
                            )}

                            {selectedTest.staffName && (
                                <div className={styles.detailSection}>
                                    <h4>Thông tin nhân viên</h4>
                                    <p><strong>Nhân viên phụ trách:</strong> {selectedTest.staffName}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {showResultModal && selectedTest && (
                <div className={styles.modalOverlay} onClick={() => setShowResultModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Nhập kết quả xét nghiệm #{selectedTest.testId}</h3>
                            <button
                                onClick={() => setShowResultModal(false)}
                                className={styles.closeBtn}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>                        <div className={styles.modalBody}>
                            <div className={styles.resultForm}>
                                <h4>Kết quả các thành phần xét nghiệm</h4>                                {selectedTest.packageId ? (
                                    // Hiển thị theo group service cho package test
                                    (() => {
                                        const groupedByService = testResults.reduce((acc, result, index) => {
                                            const serviceKey = result.serviceId || 'unknown';
                                            if (!acc[serviceKey]) {
                                                acc[serviceKey] = {
                                                    serviceName: result.serviceName || 'Dịch vụ không xác định',
                                                    components: []
                                                };
                                            }
                                            // Thêm originalIndex để tracking
                                            acc[serviceKey].components.push({
                                                ...result,
                                                originalIndex: index
                                            });
                                            return acc;
                                        }, {});

                                        return Object.entries(groupedByService).map(([serviceId, serviceGroup]) => (
                                            <div key={serviceId} className={styles.serviceGroup}>
                                                <h5 className={styles.serviceGroupTitle}>
                                                    📋 {serviceGroup.serviceName}
                                                </h5>
                                                {serviceGroup.components.map((result) => (
                                                    <div key={`${serviceId}-${result.componentId}`} className={styles.resultItem}>
                                                        <h6>{result.componentName}</h6>
                                                        <div className={styles.resultInputs}>
                                                            <div className={styles.inputGroup}>
                                                                <label>Kết quả</label>
                                                                <input
                                                                    type="text"
                                                                    value={result.resultValue}
                                                                    onChange={(e) => handleResultChange(result.originalIndex, 'resultValue', e.target.value)}
                                                                    placeholder="Nhập kết quả..."
                                                                />
                                                            </div>
                                                            <div className={styles.inputGroup}>
                                                                <label>Khoảng bình thường</label>
                                                                <input
                                                                    type="text"
                                                                    value={result.referenceRange}
                                                                    readOnly
                                                                    disabled
                                                                    placeholder="Khoảng bình thường..."
                                                                />
                                                            </div>
                                                            <div className={styles.inputGroup}>
                                                                <label>Đơn vị</label>
                                                                <input
                                                                    type="text"
                                                                    value={result.unit}
                                                                    readOnly
                                                                    disabled
                                                                    placeholder="Đơn vị..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ));
                                    })()
                                ) : (
                                    // Hiển thị bình thường cho test lẻ
                                    testResults.map((result, index) => (
                                        <div key={result.componentId} className={styles.resultItem}>
                                            <h5>{result.componentName}</h5>
                                            <div className={styles.resultInputs}>
                                                <div className={styles.inputGroup}>
                                                    <label>Kết quả</label>
                                                    <input
                                                        type="text"
                                                        value={result.resultValue}
                                                        onChange={(e) => handleResultChange(index, 'resultValue', e.target.value)}
                                                        placeholder="Nhập kết quả..."
                                                    />
                                                </div>
                                                <div className={styles.inputGroup}>
                                                    <label>Khoảng bình thường</label>
                                                    <input
                                                        type="text"
                                                        value={result.referenceRange}
                                                        readOnly
                                                        disabled
                                                        placeholder="Khoảng bình thường..."
                                                    />
                                                </div>
                                                <div className={styles.inputGroup}>
                                                    <label>Đơn vị</label>
                                                    <input
                                                        type="text"
                                                        value={result.unit}
                                                        readOnly
                                                        disabled
                                                        placeholder="Đơn vị..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )))}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                onClick={() => setShowResultModal(false)}
                                className={styles.cancelBtn}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmitResults}
                                className={styles.submitBtn}
                                disabled={updating}
                            >
                                {updating ? 'Đang lưu...' : 'Lưu kết quả'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Results Modal */}
            {showViewResultModal && selectedTestResults && (
                <div className={styles.modalOverlay} onClick={() => setShowViewResultModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Kết quả xét nghiệm #{selectedTestResults.testId}</h3>
                            <button
                                onClick={() => setShowViewResultModal(false)}
                                className={styles.closeBtn}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.resultDisplay}>
                                <div className={styles.testInfo}>
                                    <h4>Thông tin xét nghiệm</h4>
                                    <div className={styles.infoGrid}>
                                        <div><strong>Mã xét nghiệm:</strong> {selectedTestResults.testId || selectedTest.testId}</div>
                                        <div><strong>Loại xét nghiệm:</strong> {selectedTest.serviceName}</div>
                                        {selectedTest.customerName && (
                                            <div><strong>Khách hàng:</strong> {selectedTest.customerName}</div>
                                        )}
                                        {selectedTest.staffName && (
                                            <div><strong>Nhân viên thực hiện:</strong> {selectedTest.staffName}</div>
                                        )}
                                        {selectedTest.resultDate && (
                                            <div><strong>Ngày có kết quả:</strong> {formatDateTime(selectedTest.resultDate)}</div>
                                        )}
                                    </div>
                                </div>                                <div className={styles.resultsSection}>
                                    <h4>Chi tiết kết quả</h4>
                                    {selectedTestResults && selectedTestResults.length > 0 ? (
                                        (() => {
                                            // Group by serviceId for package tests
                                            if (selectedTest.packageId) {
                                                const groupedByService = selectedTestResults.reduce((acc, result) => {
                                                    const serviceId = result.serviceId || result.sourceServiceId || 'unknown';
                                                    const serviceName = result.serviceName || 'Dịch vụ không xác định';

                                                    if (!acc[serviceId]) {
                                                        acc[serviceId] = {
                                                            serviceName: serviceName,
                                                            results: []
                                                        };
                                                    }

                                                    acc[serviceId].results.push(result);
                                                    return acc;
                                                }, {});

                                                return Object.entries(groupedByService).map(([serviceId, group]) => (
                                                    <div key={serviceId} className={styles.serviceGroup}>
                                                        <h5 className={styles.serviceGroupTitle}>📋 {group.serviceName}</h5>
                                                        <div className={styles.resultsTable}>
                                                            <div className={styles.tableHeader}>
                                                                <div>Thành phần</div>
                                                                <div>Kết quả</div>
                                                                <div>Khoảng bình thường</div>
                                                                <div>Đơn vị</div>
                                                                <div>Nhân viên xét nghiệm</div>
                                                                <div>Ngày xét nghiệm</div>
                                                            </div>
                                                            {group.results.map((result, index) => (
                                                                <div key={result.resultId || `${serviceId}-${index}`} className={styles.tableRow}>
                                                                    <div className={styles.componentName}>
                                                                        {result.componentName || result.testName}
                                                                    </div>
                                                                    <div className={styles.resultValue}>
                                                                        {result.resultValue}
                                                                    </div>
                                                                    <div className={styles.normalRange}>
                                                                        {result.normalRange || result.referenceRange || 'N/A'}
                                                                    </div>
                                                                    <div className={styles.unit}>
                                                                        {result.unit || 'N/A'}
                                                                    </div>
                                                                    <div className={styles.reviewerName}>
                                                                        {result.reviewerName || 'N/A'}
                                                                    </div>
                                                                    <div className={styles.reviewedAt}>
                                                                        {result.reviewedAt ? formatDate(result.reviewedAt) : 'N/A'}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            } else {
                                                // For single service tests, keep original behavior
                                                return (
                                                    <div className={styles.resultsTable}>
                                                        <div className={styles.tableHeader}>
                                                            <div>Thành phần</div>
                                                            <div>Kết quả</div>
                                                            <div>Khoảng bình thường</div>
                                                            <div>Đơn vị</div>
                                                            <div>Nhân viên xét nghiệm</div>
                                                            <div>Ngày xét nghiệm</div>
                                                        </div>
                                                        {selectedTestResults.map((result, index) => (
                                                            <div key={result.resultId || index} className={styles.tableRow}>
                                                                <div className={styles.componentName}>
                                                                    {result.componentName || result.testName}
                                                                </div>
                                                                <div className={styles.resultValue}>
                                                                    {result.resultValue}
                                                                </div>
                                                                <div className={styles.normalRange}>
                                                                    {result.normalRange || result.referenceRange || 'N/A'}
                                                                </div>
                                                                <div className={styles.unit}>
                                                                    {result.unit || 'N/A'}
                                                                </div>
                                                                <div className={styles.reviewerName}>
                                                                    {result.reviewerName || 'N/A'}
                                                                </div>
                                                                <div className={styles.reviewedAt}>
                                                                    {result.reviewedAt ? formatDate(result.reviewedAt) : 'N/A'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                        })()
                                    ) : (
                                        <p className={styles.noResults}>Chưa có kết quả xét nghiệm</p>
                                    )}
                                </div>

                                {selectedTest.consultantNotes && (
                                    <div className={styles.notesSection}>
                                        <h4>Ghi chú của bác sĩ</h4>
                                        <p>{selectedTest.consultantNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>                        <div className={styles.modalFooter}>
                            <button
                                onClick={() => setShowViewResultModal(false)}
                                className={styles.closeModalBtn}
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleExportToPDF}
                                className={styles.exportBtn}
                                disabled={exportingPDF}
                            >
                                {exportingPDF ? (
                                    <>
                                        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                                        </svg>
                                        Đang xuất...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14,2 14,8 20,8"></polyline>
                                        </svg>
                                        Xuất PDF
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleExportToExcel}
                                className={styles.exportBtn}
                                disabled={exportingExcel}
                            >
                                {exportingExcel ? (
                                    <>
                                        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                                        </svg>
                                        Đang xuất...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <rect x="7" y="7" width="3" height="3"></rect>
                                            <rect x="14" y="7" width="3" height="3"></rect>
                                            <rect x="7" y="14" width="3" height="3"></rect>
                                            <rect x="14" y="14" width="3" height="3"></rect>
                                        </svg>
                                        Xuất Excel
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSTITests;
