import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaVial, FaUser, FaCalendarAlt, FaMoneyBillWave, FaCreditCard, FaQrcode, FaFilePdf, FaFileExcel, FaTimes } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import { stiService } from '../../../services/stiService';
import { formatDateTime } from '../../../utils/dateUtils';
import STITestDetailModal from './STITestDetailModal';
import Pagination from '../../common/Pagination/Pagination';
import styles from './STITestManagement.module.css';

const ITEMS_PER_PAGE = 15;

const STATUS_CONFIG = {
    PENDING: { label: 'Chờ xử lý', className: 'statusPending', color: '#f59e0b' },
    CONFIRMED: { label: 'Đã xác nhận', className: 'statusConfirmed', color: '#10b981' },
    SAMPLED: { label: 'Đã lấy mẫu', className: 'statusSampled', color: '#3b82f6' },
    RESULTED: { label: 'Có kết quả', className: 'statusResulted', color: '#8b5cf6' },
    COMPLETED: { label: 'Hoàn thành', className: 'statusCompleted', color: '#06d6a0' },
    CANCELED: { label: 'Đã hủy', className: 'statusCanceled', color: '#ef4444' }
};

const PAYMENT_STATUS_CONFIG = {
    PENDING: { label: 'Chờ thanh toán', className: 'paymentPending', color: '#f59e0b' },
    COMPLETED: { label: 'Đã thanh toán', className: 'paymentCompleted', color: '#10b981' },
    FAILED: { label: 'Thất bại', className: 'paymentFailed', color: '#ef4444' },
    EXPIRED: { label: 'Hết hạn', className: 'paymentExpired', color: '#6b7280' },
    REFUNDED: { label: 'Đã hoàn tiền', className: 'paymentRefunded', color: '#3b82f6' }
};

const PAYMENT_METHOD_CONFIG = {
    COD: { label: 'COD', icon: FaMoneyBillWave, color: '#10b981' },
    VISA: { label: 'Thẻ', icon: FaCreditCard, color: '#1e40af' },
    QR_CODE: { label: 'QR', icon: FaQrcode, color: '#7c3aed' }
};

const STITestManagement = () => {
    const [tests, setTests] = useState([]);
    const [filteredTests, setFilteredTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);

    const { addToast } = useToast();

    useEffect(() => {
        loadTests();
    }, []);

    useEffect(() => {
        filterTests();
    }, [tests, searchTerm, selectedStatus, selectedPaymentStatus]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredTests.length / ITEMS_PER_PAGE));
    }, [filteredTests]);

    const loadTests = async () => {
        setLoading(true);
        try {
            const response = await stiService.getAllSTITests();
            if (response.success) {
                setTests(response.data || []);
            } else {
                addToast(response.message || 'Không thể tải danh sách STI test', 'error');
                setTests([]);
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
            setTests([]);
        } finally {
            setLoading(false);
        }
    };

    const filterTests = () => {
        if (!Array.isArray(tests)) {
            setFilteredTests([]);
            return;
        }

        let filtered = [...tests];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(test =>
                test.testId?.toString().includes(term) ||
                test.customerName?.toLowerCase().includes(term) ||
                test.serviceName?.toLowerCase().includes(term) ||
                test.packageName?.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (selectedStatus) {
            filtered = filtered.filter(test => test.status === selectedStatus);
        }

        // Payment status filter
        if (selectedPaymentStatus) {
            filtered = filtered.filter(test => test.paymentStatus === selectedPaymentStatus);
        }

        // Sort by newest first
        filtered.sort((a, b) => {
            const aDate = new Date(a.createdAt || 0);
            const bDate = new Date(b.createdAt || 0);
            return bDate.getTime() - aDate.getTime();
        });

        setFilteredTests(filtered);
        setCurrentPage(1);
    };

    const getCurrentPageItems = () => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredTests.slice(start, end);
    };

    const handleViewDetail = async (test) => {
        if (!test || !test.testId) {
            addToast('Dữ liệu STI test không hợp lệ', 'error');
            return;
        }

        try {
            const response = await stiService.getSTITestById(test.testId);
            if (response.success) {
                setSelectedTest(response.data);
                setShowDetailModal(true);
            } else {
                addToast(response.message || 'Không thể tải chi tiết STI test', 'error');
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi tải chi tiết STI test', 'error');
        }
    };

    const handleCancelTest = async (test) => {
        if (!test || !test.testId) {
            addToast('Dữ liệu STI test không hợp lệ', 'error');
            return;
        }

        // Kiểm tra trạng thái có thể hủy
        if (test.status !== 'PENDING' && test.status !== 'CONFIRMED') {
            addToast('Chỉ có thể hủy test ở trạng thái Chờ xử lý hoặc Đã xác nhận', 'error');
            return;
        }

        const confirmCancel = window.confirm(
            `Bạn có chắc chắn muốn hủy test #${test.testId} của khách hàng ${test.customerName}?\n\n` +
            `Dịch vụ: ${test.packageName || test.serviceName}\n` +
            `Ngày hẹn: ${formatDateTime(test.appointmentDate)}\n` +
            `Giá: ${formatPrice(test.totalPrice)}\n\n` +
            `Hệ thống sẽ tự động xử lý hoàn tiền nếu cần thiết.`
        );

        if (!confirmCancel) return;

        try {
            setLoading(true);
            const response = await stiService.cancelTest(test.testId);
            
            if (response.success) {
                addToast(response.message || 'Hủy test thành công', 'success');
                // Refresh danh sách tests
                await loadAllTests();
            } else {
                addToast(response.message || 'Không thể hủy test', 'error');
            }
        } catch (error) {
            console.error('Cancel test error:', error);
            addToast('Có lỗi xảy ra khi hủy test', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || { label: status, className: 'statusDefault', color: '#6b7280' };
    };

    const getPaymentStatusConfig = (status) => {
        return PAYMENT_STATUS_CONFIG[status] || { label: status, className: 'paymentDefault', color: '#6b7280' };
    };

    const getPaymentMethodConfig = (method) => {
        return PAYMENT_METHOD_CONFIG[method] || { label: method || 'N/A', icon: FaMoneyBillWave, color: '#6b7280' };
    };

    const formatPrice = (price) => {
        if (!price) return '0 VNĐ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải danh sách STI test...</p>
            </div>
        );
    }
    return (
        <div className={styles.testManagement}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <FaVial className={styles.titleIcon} />
                        Quản lý STI Test
                    </h2>
                    <p className={styles.subtitle}>
                        Xem và theo dõi tất cả các STI test đã được đặt trong hệ thống
                    </p>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>{filteredTests.length}</span>
                            <span className={styles.statLabel}>Tổng số test</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo ID, tên khách hàng, dịch vụ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={styles.statusFilter}
                >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
                <select
                    value={selectedPaymentStatus}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                    className={styles.paymentFilter}
                >
                    <option value="">Tất cả thanh toán</option>
                    {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
            </div>

            {/* Tests Container */}
            <div className={styles.testsContainer}>
                {/* Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th>ID</th>
                                <th>Khách hàng</th>
                                <th>Dịch vụ/Package</th>
                                <th>Ngày hẹn</th>
                                <th>Giá</th>
                                <th>Trạng thái</th>
                                <th>Thanh toán</th>
                                <th>Phương thức TT</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {getCurrentPageItems().length === 0 ? (
                                <tr>
                                    <td colSpan="10" className={styles.emptyState}>
                                        <FaVial className={styles.emptyIcon} />
                                        <p>Không có STI test nào</p>
                                    </td>
                                </tr>
                            ) : (
                                getCurrentPageItems().map((test) => {
                                    const statusConfig = getStatusConfig(test.status);
                                    const paymentConfig = getPaymentStatusConfig(test.paymentStatus);
                                    const paymentMethodConfig = getPaymentMethodConfig(test.paymentMethod);
                                    const MethodIcon = paymentMethodConfig.icon;
                                    return (
                                        <tr key={test.testId}>
                                            <td className={styles.idCell}>#{test.testId}</td>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <FaUser className={styles.userIcon} />
                                                    <span>{test.customerName}</span>
                                                </div>
                                            </td>
                                            <td className={styles.serviceCell}>
                                                <div className={styles.serviceInfo}>
                                                    <span className={styles.serviceName}>
                                                        {test.packageName || test.serviceName}
                                                    </span>
                                                    <span className={styles.serviceType}>
                                                        {test.packageName ? 'Package' : 'Service'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.dateCell}>
                                                {test.appointmentDate ? (
                                                    <div className={styles.appointmentInfo}>
                                                        <FaCalendarAlt className={styles.dateIcon} />
                                                        <span>{formatDateTime(test.appointmentDate)}</span>
                                                    </div>
                                                ) : (
                                                    'Chưa có lịch hẹn'
                                                )}
                                            </td>
                                            <td className={styles.priceCell}>
                                                <div className={styles.priceInfo}>
                                                    <FaMoneyBillWave className={styles.priceIcon} />
                                                    <span>{formatPrice(test.totalPrice)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`${styles.statusBadge} ${styles[statusConfig.className]}`}
                                                    style={{ backgroundColor: statusConfig.color }}
                                                >
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`${styles.paymentBadge} ${styles[paymentConfig.className]}`}
                                                    style={{ backgroundColor: paymentConfig.color }}
                                                >
                                                    {paymentConfig.label}
                                                </span>
                                            </td>
                                            <td className={styles.paymentMethodCell}>
                                                {test.paymentMethod ? (
                                                    <div className={styles.paymentMethodInfo}>
                                                        <MethodIcon
                                                            className={styles.paymentMethodIcon}
                                                            style={{ color: paymentMethodConfig.color }}
                                                        />
                                                        <span>{paymentMethodConfig.label}</span>
                                                    </div>
                                                ) : (
                                                    <span className={styles.noPaymentMethod}>N/A</span>
                                                )}
                                            </td>
                                            <td className={styles.createdCell}>
                                                {formatDateTime(test.createdAt)}
                                            </td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.viewBtn}
                                                        onClick={() => handleViewDetail(test)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    {(test.status === 'PENDING' || test.status === 'CONFIRMED') && (
                                                        <button
                                                            className={styles.cancelBtn}
                                                            onClick={() => handleCancelTest(test)}
                                                            title="Hủy test"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }))}
                        </tbody>
                    </table>
                </div>
                {/* End Tests Container */}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedTest && (
                <STITestDetailModal
                    test={selectedTest}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedTest(null);
                    }}
                />
            )}
        </div>
    );
};

export default STITestManagement;
