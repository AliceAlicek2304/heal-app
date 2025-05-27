import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { stiService } from '../../services/stiService';
import styles from './STIHistory.module.css';

const STATUS_CONFIG = {
    PENDING: {
        label: 'Chờ xác nhận',
        color: 'warning',
        icon: 'clock',
        description: 'Đang chờ xác nhận từ phòng khám'
    },
    CONFIRMED: {
        label: 'Đã xác nhận',
        color: 'info',
        icon: 'check-circle',
        description: 'Đã xác nhận lịch hẹn'
    },
    IN_PROGRESS: {
        label: 'Đang thực hiện',
        color: 'primary',
        icon: 'spinner',
        description: 'Đang tiến hành xét nghiệm'
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

const PAYMENT_LABELS = {
    COD: 'Thanh toán khi nhận dịch vụ',
    VISA: 'Thanh toán bằng thẻ VISA',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng'
};

const STIHistory = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [loadingResults, setLoadingResults] = useState(false);
    const [allServices, setAllServices] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 5;

    useEffect(() => {
        fetchAllServices();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserTests();
        }
    }, [user, currentPage]);

    const fetchAllServices = async () => {
        try {
            const response = await stiService.getActiveServices();
            if (response.success && response.data) {
                setAllServices(response.data);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchUserTests = async () => {
        try {
            setLoading(true);
            const response = await stiService.getMyTests(
                {
                    page: currentPage,
                    size: pageSize
                },
                () => {
                    window.location.href = '/login';
                }
            );

            if (response.success) {
                if (response.data.content) {
                    setTests(response.data.content || []);
                    setTotalPages(response.data.totalPages || 0);
                    setTotalElements(response.data.totalElements || 0);
                } else {
                    setTests(response.data || []);
                    setTotalPages(1);
                    setTotalElements(response.data?.length || 0);
                }
            } else {
                toast.error(response.message || 'Không thể tải lịch sử xét nghiệm');
            }
        } catch (error) {
            console.error('Error fetching user tests:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // Helper function để tìm service info bằng serviceId
    const getServiceInfoById = (serviceId) => {
        if (!serviceId || !allServices.length) {
            return {
                name: 'Dịch vụ xét nghiệm STI',
                description: 'Dịch vụ xét nghiệm STI chuyên nghiệp',
                price: null,
                testComponents: []
            };
        }

        const service = allServices.find(s => s.serviceId === serviceId);

        return {
            name: service?.name || 'Dịch vụ xét nghiệm STI',
            description: service?.description || 'Dịch vụ xét nghiệm STI chuyên nghiệp',
            price: service?.price,
            testComponents: service?.testComponents || []
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
                setTestResults(response.data);
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

    const handleCloseDetails = () => {
        setShowDetailsModal(false);
        setSelectedTest(null);
    };

    const handleCloseResults = () => {
        setShowResultsModal(false);
        setSelectedTest(null);
        setTestResults(null);
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

    // Helper function để xác định kết quả có bình thường không
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
            const date = new Date(dateTimeString);
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
            'WAIT': 'PENDING',
            'PROGRESS': 'IN_PROGRESS',
            'ONGOING': 'IN_PROGRESS',
            'ACTIVE': 'IN_PROGRESS'
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

    const handlePageChange = (page) => {
        setCurrentPage(page);
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
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
            'credit-card': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
            ),
            'money-bill-wave': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1v6m0 6v6m-8-8h16M4 7h16"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            ),
            'sticky-note': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5z"></path>
                    <polyline points="16,3 16,8 21,8"></polyline>
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
            'chevron-left': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
            ),
            'chevron-right': (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"></polyline>
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
            )
        };
        return icons[iconName] || icons['question-circle'];
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        if (currentPage > 0) {
            pages.push(
                <button
                    key="prev"
                    className={styles.paginationBtn}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    {renderSVGIcon('chevron-left')}
                </button>
            );
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={`${styles.paginationBtn} ${i === currentPage ? styles.active : ''}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i + 1}
                </button>
            );
        }

        if (currentPage < totalPages - 1) {
            pages.push(
                <button
                    key="next"
                    className={styles.paginationBtn}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    {renderSVGIcon('chevron-right')}
                </button>
            );
        }

        return (
            <div className={styles.paginationContainer}>
                <div className={styles.paginationInfo}>
                    Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} kết quả
                </div>
                <div className={styles.pagination}>
                    {pages}
                </div>
            </div>
        );
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
                {totalElements > 0 && (
                    <div className={styles.historyStats}>
                        <span className={styles.totalCount}>Tổng số: {totalElements} lần xét nghiệm</span>
                    </div>
                )}
            </div>

            {tests.length > 0 ? (
                <>
                    <div className={styles.testsList}>
                        {tests.map(test => {
                            const statusConfig = getStatusConfig(test.status);
                            const serviceInfo = getServiceInfoById(test.serviceId);
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
                                        <div className={`${styles.statusBadge} ${styles[`status${statusConfig.color.charAt(0).toUpperCase() + statusConfig.color.slice(1)}`]}`}>
                                            {renderSVGIcon(statusConfig.icon)}
                                            <span>{statusConfig.label}</span>
                                        </div>
                                    </div>

                                    <div className={styles.testContent}>
                                        <div className={styles.statusDescription}>
                                            <p>{statusConfig.description}</p>
                                        </div>

                                        <div className={styles.testDetailsGrid}>
                                            <div className={styles.detailItem}>
                                                {renderSVGIcon('calendar-alt')}
                                                <div>
                                                    <span className={styles.label}>Thời gian hẹn</span>
                                                    <span className={styles.value}>{formatDateTime(test.appointmentDate)}</span>
                                                </div>
                                            </div>

                                            <div className={styles.detailItem}>
                                                {renderSVGIcon('credit-card')}
                                                <div>
                                                    <span className={styles.label}>Thanh toán</span>
                                                    <span className={styles.value}>{PAYMENT_LABELS[test.paymentMethod] || test.paymentMethod}</span>
                                                </div>
                                            </div>

                                            {serviceInfo.price && (
                                                <div className={styles.detailItem}>
                                                    {renderSVGIcon('money-bill-wave')}
                                                    <div>
                                                        <span className={styles.label}>Giá dịch vụ</span>
                                                        <span className={`${styles.value} ${styles.price}`}>{formatPrice(serviceInfo.price)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {test.customerNotes && (
                                                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                                                    {renderSVGIcon('sticky-note')}
                                                    <div>
                                                        <span className={styles.label}>Ghi chú</span>
                                                        <span className={styles.value}>{test.customerNotes}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.testActions}>
                                        <button
                                            className={`${styles.btn} ${styles.btnOutlinePrimary}`}
                                            onClick={() => handleViewDetails(test)}
                                        >
                                            {renderSVGIcon('info-circle')}
                                            Chi tiết
                                        </button>

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

                    {renderPagination()}
                </>
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

            {/* Test Details Modal */}
            {showDetailsModal && selectedTest && (
                <div className={styles.modalOverlay} onClick={handleCloseDetails}>
                    <div className={`${styles.modalContent} ${styles.testDetailsModal}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết cuộc hẹn #{selectedTest.testId}</h3>
                            <button className={styles.modalCloseBtn} onClick={handleCloseDetails}>
                                {renderSVGIcon('times')}
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.serviceInfo}>
                                {(() => {
                                    const serviceInfo = getServiceInfoById(selectedTest.serviceId);
                                    return (
                                        <>
                                            <h4>{serviceInfo.name}</h4>
                                            <p>{serviceInfo.description}</p>

                                            {serviceInfo.testComponents.length > 0 && (
                                                <div className={styles.testComponents}>
                                                    <h5>Các xét nghiệm bao gồm:</h5>
                                                    <ul>
                                                        {serviceInfo.testComponents.map((component, index) => (
                                                            <li key={component.componentId || index}>
                                                                {component.testName}
                                                                {component.referenceRange && (
                                                                    <span className={styles.referenceRange}> ({component.referenceRange})</span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            <div className={styles.appointmentDetails}>
                                <h5>Thông tin cuộc hẹn</h5>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Trạng thái:</span>
                                        <span className={`${styles.value} ${styles.statusBadge} ${styles[`status${getStatusConfig(selectedTest.status).color.charAt(0).toUpperCase() + getStatusConfig(selectedTest.status).color.slice(1)}`]}`}>
                                            {renderSVGIcon(getStatusConfig(selectedTest.status).icon)}
                                            {getStatusConfig(selectedTest.status).label}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Thời gian hẹn:</span>
                                        <span className={styles.value}>{formatDateTime(selectedTest.appointmentDate)}</span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Phương thức thanh toán:</span>
                                        <span className={styles.value}>
                                            {PAYMENT_LABELS[selectedTest.paymentMethod] || selectedTest.paymentMethod}
                                        </span>
                                    </div>

                                    {(() => {
                                        const serviceInfo = getServiceInfoById(selectedTest.serviceId);
                                        return serviceInfo.price && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.label}>Giá dịch vụ:</span>
                                                <span className={`${styles.value} ${styles.price}`}>{formatPrice(serviceInfo.price)}</span>
                                            </div>
                                        );
                                    })()}

                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Ngày tạo:</span>
                                        <span className={styles.value}>{formatDateTime(selectedTest.createdAt)}</span>
                                    </div>

                                    {selectedTest.updatedAt && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.label}>Cập nhật lần cuối:</span>
                                            <span className={styles.value}>{formatDateTime(selectedTest.updatedAt)}</span>
                                        </div>
                                    )}
                                </div>

                                {selectedTest.customerNotes && (
                                    <div className={styles.notesSection}>
                                        <h6>Ghi chú của khách hàng:</h6>
                                        <p>{selectedTest.customerNotes}</p>
                                    </div>
                                )}

                                {selectedTest.adminNotes && (
                                    <div className={styles.notesSection}>
                                        <h6>Ghi chú từ phòng khám:</h6>
                                        <p>{selectedTest.adminNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            {hasResults(selectedTest) && (
                                <button
                                    className={`${styles.btn} ${styles.btnSuccess}`}
                                    onClick={() => {
                                        handleCloseDetails();
                                        handleViewResults(selectedTest);
                                    }}
                                >
                                    {renderSVGIcon('file-medical')}
                                    Xem kết quả
                                </button>
                            )}
                            {canCancelTest(selectedTest) && (
                                <button
                                    className={`${styles.btn} ${styles.btnDanger}`}
                                    onClick={() => handleCancelTest(selectedTest.testId)}
                                >
                                    {renderSVGIcon('times')}
                                    Hủy cuộc hẹn
                                </button>
                            )}
                            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleCloseDetails}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Results Modal */}
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
                            <div className={styles.resultsHeader}>
                                <div className={styles.patientInfo}>
                                    <h4>Thông tin bệnh nhân</h4>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Họ tên: <span className={styles.value}>{user?.fullName}</span></span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Mã xét nghiệm: <span className={styles.value}>#{selectedTest.testId}</span></span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Dịch vụ: <span className={styles.value}>{getServiceInfoById(selectedTest.serviceId).name}</span></span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Ngày lấy mẫu: <span className={styles.value}>{formatDateTime(selectedTest.appointmentDate)}</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.resultsContent}>
                                <h4>Kết quả chi tiết</h4>

                                {testResults && testResults.length > 0 ? (
                                    <div className={styles.resultsTable}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Tên xét nghiệm</th>
                                                    <th>Kết quả</th>
                                                    <th>Giá trị tham chiếu</th>
                                                    <th>Đơn vị</th>
                                                    <th>Trạng thái</th>
                                                    <th>Người đánh giá</th>
                                                    <th>Thời gian đánh giá</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {testResults.map((result, index) => {
                                                    const isNormal = isResultNormal(result);
                                                    return (
                                                        <tr key={result.resultId || index} className={isNormal ? styles.normal : styles.abnormal}>
                                                            <td className={styles.testName}>{result.componentName}</td>
                                                            <td className={styles.testResult}>
                                                                <span className={`${styles.resultValue} ${isNormal ? styles.normal : styles.abnormal}`}>
                                                                    {result.resultValue}
                                                                </span>
                                                            </td>
                                                            <td className={styles.referenceRange}>{result.normalRange}</td>
                                                            <td className={styles.unit}>{result.unit || '-'}</td>
                                                            <td className={styles.testStatus}>
                                                                <span className={`${styles.statusIndicator} ${isNormal ? styles.normal : styles.abnormal}`}>
                                                                    {renderSVGIcon(isNormal ? 'check-circle' : 'exclamation-triangle')}
                                                                    {isNormal ? 'Bình thường' : 'Bất thường'}
                                                                </span>
                                                            </td>
                                                            <td className={styles.reviewer}>
                                                                <div className={styles.reviewerInfo}>
                                                                    <span className={styles.reviewerName}>{result.reviewerName}</span>
                                                                    <small className={styles.reviewerId}>ID: {result.reviewedBy}</small>
                                                                </div>
                                                            </td>
                                                            <td className={styles.reviewTime}>
                                                                {formatDateTime(result.reviewedAt)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={styles.noResults}>
                                        <p>Chưa có kết quả chi tiết</p>
                                    </div>
                                )}

                                {testResults && testResults.length > 0 && (
                                    <>
                                        {/* Results Statistics */}
                                        <div className={styles.resultsStatistics}>
                                            <div className={styles.statsGrid}>
                                                <div className={`${styles.statItem} ${styles.normal}`}>
                                                    <div className={styles.statIcon}>
                                                        {renderSVGIcon('check-circle')}
                                                    </div>
                                                    <div className={styles.statInfo}>
                                                        <span className={styles.statNumber}>{testResults.filter(r => isResultNormal(r)).length}</span>
                                                        <span className={styles.statLabel}>Kết quả bình thường</span>
                                                    </div>
                                                </div>
                                                <div className={`${styles.statItem} ${styles.abnormal}`}>
                                                    <div className={styles.statIcon}>
                                                        {renderSVGIcon('exclamation-triangle')}
                                                    </div>
                                                    <div className={styles.statInfo}>
                                                        <span className={styles.statNumber}>{testResults.filter(r => !isResultNormal(r)).length}</span>
                                                        <span className={styles.statLabel}>Kết quả bất thường</span>
                                                    </div>
                                                </div>
                                                <div className={`${styles.statItem} ${styles.total}`}>
                                                    <div className={styles.statIcon}>
                                                        {renderSVGIcon('vial')}
                                                    </div>
                                                    <div className={styles.statInfo}>
                                                        <span className={styles.statNumber}>{testResults.length}</span>
                                                        <span className={styles.statLabel}>Tổng số xét nghiệm</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Overall Result */}
                                        <div className={styles.overallResult}>
                                            <h5>Kết luận tổng quát</h5>
                                            <div className={`${styles.resultSummary} ${testResults.every(r => isResultNormal(r)) ? styles.normal : styles.abnormal}`}>
                                                {renderSVGIcon(testResults.every(r => isResultNormal(r)) ? 'check-circle' : 'exclamation-triangle')}
                                                <span>
                                                    {testResults.every(r => isResultNormal(r))
                                                        ? 'Tất cả các chỉ số đều bình thường - Không phát hiện dấu hiệu nhiễm STI'
                                                        : 'Có một số chỉ số bất thường được phát hiện, vui lòng tham khảo ý kiến bác sĩ chuyên khoa'}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className={styles.doctorNotes}>
                                    <h5>Lời khuyên từ chuyên gia</h5>
                                    <div className={styles.adviceContent}>
                                        {selectedTest?.consultantNotes ? (
                                            <div className={`${styles.advice} ${styles.consultantNotes}`}>
                                                {renderSVGIcon('user-md')}
                                                <div>
                                                    <h6>Nhận xét từ bác sĩ</h6>
                                                    <div className={styles.consultantNoteContent}>
                                                        {selectedTest.consultantNotes.split('\n').map((line, index) => (
                                                            <p key={index}>{line}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`${styles.advice} ${styles.noNotes}`}>
                                                {renderSVGIcon('clock')}
                                                <div>
                                                    <h6>Chưa có nhận xét</h6>
                                                    <p>Chuyên gia chưa nhận xét về kết quả xét nghiệm này. Vui lòng kiên nhẫn chờ đợi hoặc liên hệ với phòng khám để biết thêm chi tiết.</p>
                                                    {testResults && !testResults.every(r => isResultNormal(r)) && (
                                                        <div className={styles.actionNote}>
                                                            <strong>Lưu ý:</strong> Do có một số kết quả bất thường, bạn nên liên hệ với phòng khám để được tư vấn sớm nhất.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={() => window.print()}
                            >
                                {renderSVGIcon('print')}
                                In kết quả
                            </button>
                            {testResults && !testResults.every(r => isResultNormal(r)) && (
                                <button
                                    className={`${styles.btn} ${styles.btnWarning}`}
                                    onClick={() => window.location.href = '/consultation'}
                                >
                                    {renderSVGIcon('user-md')}
                                    Đặt lịch tư vấn
                                </button>
                            )}
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