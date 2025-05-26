import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { stiService } from '../../services/stiService';
import './STIHistory.css';

const STATUS_COLORS = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'danger'
};

const STATUS_LABELS = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 5; // 5 tests per page

    useEffect(() => {
        if (user) {
            fetchUserTests();
        }
    }, [user, currentPage]);

    const fetchUserTests = async () => {
        try {
            setLoading(true);
            // Modify stiService.getMyTests to accept pagination parameters
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
                    // Response is paginated
                    setTests(response.data.content || []);
                    setTotalPages(response.data.totalPages || 0);
                    setTotalElements(response.data.totalElements || 0);
                } else {
                    // Response is not paginated (backward compatibility)
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

    const handleViewDetails = (test) => {
        setSelectedTest(test);
        setShowDetailsModal(true);
    };

    const handleCloseDetails = () => {
        setShowDetailsModal(false);
        setSelectedTest(null);
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
                fetchUserTests(); // Refresh list
            } else {
                toast.error(response.message || 'Không thể hủy cuộc hẹn');
            }
        } catch (error) {
            console.error('Error cancelling test:', error);
            toast.error('Có lỗi xảy ra khi hủy cuộc hẹn');
        }
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

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        // Previous button
        if (currentPage > 0) {
            pages.push(
                <button
                    key="prev"
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    <i className="fas fa-chevron-left"></i>
                </button>
            );
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i + 1}
                </button>
            );
        }

        // Next button
        if (currentPage < totalPages - 1) {
            pages.push(
                <button
                    key="next"
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    <i className="fas fa-chevron-right"></i>
                </button>
            );
        }

        return (
            <div className="pagination-container">
                <div className="pagination-info">
                    Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} kết quả
                </div>
                <div className="pagination">
                    {pages}
                </div>
            </div>
        );
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="sti-history">
            <div className="sti-history-header">
                <h2>Lịch sử xét nghiệm STI</h2>
                <p>Quản lý và theo dõi các cuộc hẹn xét nghiệm của bạn</p>
                {totalElements > 0 && (
                    <div className="history-stats">
                        <span className="total-count">Tổng số: {totalElements} lần xét nghiệm</span>
                    </div>
                )}
            </div>

            {tests.length > 0 ? (
                <>
                    <div className="tests-list">
                        {tests.map(test => (
                            <div key={test.testId} className="test-card">
                                <div className="test-header">
                                    <div className="test-info">
                                        <h3>{test.service?.name || 'Dịch vụ xét nghiệm STI'}</h3>
                                        <span className={`status-badge ${STATUS_COLORS[test.status]}`}>
                                            {STATUS_LABELS[test.status] || test.status}
                                        </span>
                                    </div>
                                    <div className="test-id">
                                        Mã: #{test.testId}
                                    </div>
                                </div>

                                <div className="test-content">
                                    <div className="test-details">
                                        <div className="detail-row">
                                            <span className="label">Thời gian hẹn:</span>
                                            <span className="value">{formatDateTime(test.appointmentDate)}</span>
                                        </div>

                                        <div className="detail-row">
                                            <span className="label">Phương thức thanh toán:</span>
                                            <span className="value">
                                                {PAYMENT_LABELS[test.paymentMethod] || test.paymentMethod}
                                            </span>
                                        </div>

                                        {test.service?.price && (
                                            <div className="detail-row">
                                                <span className="label">Giá dịch vụ:</span>
                                                <span className="value price">{formatPrice(test.service.price)}</span>
                                            </div>
                                        )}

                                        {test.customerNotes && (
                                            <div className="detail-row">
                                                <span className="label">Ghi chú:</span>
                                                <span className="value">{test.customerNotes}</span>
                                            </div>
                                        )}

                                        <div className="detail-row">
                                            <span className="label">Ngày tạo:</span>
                                            <span className="value">{formatDateTime(test.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="test-actions">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => handleViewDetails(test)}
                                    >
                                        <i className="fas fa-eye"></i>
                                        Xem chi tiết
                                    </button>

                                    {canCancelTest(test) && (
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={() => handleCancelTest(test.testId)}
                                        >
                                            <i className="fas fa-times"></i>
                                            Hủy cuộc hẹn
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {renderPagination()}
                </>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <i className="fas fa-vial"></i>
                    </div>
                    <h3>Chưa có lịch sử xét nghiệm</h3>
                    <p>Bạn chưa có cuộc hẹn xét nghiệm nào. Hãy đặt lịch xét nghiệm đầu tiên!</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.href = '/sti-testing'}
                    >
                        <i className="fas fa-plus"></i>
                        Đặt lịch xét nghiệm
                    </button>
                </div>
            )}

            {/* Test Details Modal - keeping existing modal code */}
            {showDetailsModal && selectedTest && (
                <div className="modal-overlay" onClick={handleCloseDetails}>
                    <div className="modal-content test-details-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Modal content remains the same */}
                        <div className="modal-header">
                            <h3>Chi tiết cuộc hẹn #{selectedTest.testId}</h3>
                            <button className="modal-close-btn" onClick={handleCloseDetails}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Keep existing modal body content */}
                        </div>

                        <div className="modal-footer">
                            {canCancelTest(selectedTest) && (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                        handleCancelTest(selectedTest.testId);
                                        handleCloseDetails();
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                    Hủy cuộc hẹn
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={handleCloseDetails}>
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