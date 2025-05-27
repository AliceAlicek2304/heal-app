import React, { useState, useEffect } from 'react';
import { consultationService } from '../../services/consultationService';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import styles from './ConsultationHistory.module.css';

const STATUS_CLASS = {
    PENDING: styles.badgePending,
    CONFIRMED: styles.badgeConfirmed,
    CANCELED: styles.badgeCanceled,
    COMPLETED: styles.badgeCompleted,
    PAYMENT_PENDING: styles.badgePaymentPending,
    PAYMENT_FAILED: styles.badgePaymentFailed
};

const PAYMENT_METHOD_TEXT = {
    COD: 'Thanh toán trực tiếp',
    VISA: 'Thẻ Visa/MasterCard',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng'
};

const ConsultationHistory = () => {
    const toast = useToast();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const response = await consultationService.getMyConsultations();

            if (response.success && response.data) {
                const sortedConsultations = response.data.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setConsultations(sortedConsultations);
            } else {
                const errorMsg = response.message || 'Không thể tải lịch sử tư vấn';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error fetching consultations:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ xác nhận';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'CANCELED': return 'Đã hủy';
            case 'COMPLETED': return 'Đã hoàn thành';
            case 'PAYMENT_PENDING': return 'Chờ thanh toán';
            case 'PAYMENT_FAILED': return 'Thanh toán thất bại';
            default: return status || 'Không xác định';
        }
    };

    const handleViewDetails = (consultation) => {
        setSelectedConsultation(consultation);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedConsultation(null);
    };

    const handleModalBackdropClick = (e) => {
        if (e.target.classList.contains(styles.modalBackdrop)) {
            handleCloseModal();
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Chưa xác định';
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    const handleRetry = () => {
        toast.info('Đang tải lại dữ liệu...');
        fetchConsultations();
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải lịch sử tư vấn...</p>
            </div>
        );
    }

    return (
        <div className={styles.consultationHistory}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Lịch sử tư vấn
                    </h2>
                    <p className={styles.subtitle}>
                        Quản lý và theo dõi các lịch tư vấn bạn đã đặt
                    </p>
                </div>
                <button
                    className={styles.refreshBtn}
                    onClick={handleRetry}
                    disabled={loading}
                    title="Làm mới dữ liệu"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <polyline points="1,20 1,14 7,14"></polyline>
                        <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,4.36L23,14"></path>
                    </svg>
                </button>
            </div>

            {consultations.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <h3>Chưa có lịch tư vấn nào</h3>
                    <p>Bạn chưa đặt lịch tư vấn nào. Hãy bắt đầu đặt lịch để nhận tư vấn từ chuyên gia!</p>
                    <a href="/consultation" className={styles.createBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Đặt lịch tư vấn ngay
                    </a>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className={styles.mobileView}>
                        {consultations.map(consultation => (
                            <div key={consultation.consultationId} className={styles.consultationCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.consultantInfo}>
                                        <h3 className={styles.consultantName}>{consultation.consultantName}</h3>
                                        {consultation.consultantQualifications && (
                                            <p className={styles.qualifications}>
                                                {consultation.consultantQualifications}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`${styles.statusBadge} ${STATUS_CLASS[consultation.status] || ''}`}>
                                        {getStatusText(consultation.status)}
                                    </span>
                                </div>

                                <div className={styles.cardContent}>
                                    <div className={styles.timeInfo}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <div>
                                            <div className={styles.date}>{formatDate(consultation.startTime)}</div>
                                            <div className={styles.time}>
                                                {formatTime(consultation.startTime)} - {formatTime(consultation.endTime)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.priceInfo}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                        </svg>
                                        <div>
                                            <div className={styles.price}>{formatPrice(consultation.price)}</div>
                                            {consultation.paymentMethod && (
                                                <div className={styles.paymentMethod}>
                                                    {PAYMENT_METHOD_TEXT[consultation.paymentMethod] || consultation.paymentMethod}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.detailBtn}
                                        onClick={() => handleViewDetails(consultation)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                        Chi tiết
                                    </button>
                                    {consultation.meetUrl && consultation.status === 'CONFIRMED' && (
                                        <button
                                            className={styles.joinBtn}
                                            onClick={() => window.open(consultation.meetUrl, '_blank')}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="23,7 16,12 23,17 23,7"></polygon>
                                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                            </svg>
                                            Tham gia
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className={styles.desktopView}>
                        <div className={styles.tableContainer}>
                            <table className={styles.consultationTable}>
                                <thead>
                                    <tr>
                                        <th>Chuyên gia tư vấn</th>
                                        <th>Thời gian</th>
                                        <th>Trạng thái</th>
                                        <th>Giá</th>
                                        <th>Ngày tạo</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consultations.map(consultation => (
                                        <tr key={consultation.consultationId}>
                                            <td>
                                                <div className={styles.consultantCell}>
                                                    <strong className={styles.consultantNameTable}>
                                                        {consultation.consultantName}
                                                    </strong>
                                                    {consultation.consultantQualifications && (
                                                        <div className={styles.qualificationsTable}>
                                                            {consultation.consultantQualifications}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.timeCell}>
                                                    <div className={styles.dateTable}>{formatDate(consultation.startTime)}</div>
                                                    <div className={styles.timeTable}>
                                                        {formatTime(consultation.startTime)} - {formatTime(consultation.endTime)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${STATUS_CLASS[consultation.status] || ''}`}>
                                                    {getStatusText(consultation.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.priceCell}>
                                                    <strong className={styles.priceTable}>{formatPrice(consultation.price)}</strong>
                                                    {consultation.paymentMethod && (
                                                        <div className={styles.paymentMethodTable}>
                                                            {PAYMENT_METHOD_TEXT[consultation.paymentMethod] || consultation.paymentMethod}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.dateCell}>{formatDate(consultation.createdAt)}</span>
                                            </td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => handleViewDetails(consultation)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                        </svg>
                                                        Chi tiết
                                                    </button>
                                                    {consultation.meetUrl && consultation.status === 'CONFIRMED' && (
                                                        <button
                                                            className={styles.joinBtnTable}
                                                            onClick={() => window.open(consultation.meetUrl, '_blank')}
                                                            title="Tham gia cuộc họp"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polygon points="23,7 16,12 23,17 23,7"></polygon>
                                                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                                            </svg>
                                                            Tham gia
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modal chi tiết */}
            {showDetailModal && selectedConsultation && (
                <div className={styles.modalBackdrop} onClick={handleModalBackdropClick}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết lịch tư vấn</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={handleCloseModal}
                                aria-label="Đóng"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.detailSection}>
                                <h4>Thông tin chuyên gia</h4>
                                <div className={styles.detailRow}>
                                    <strong>Tên:</strong>
                                    <span>{selectedConsultation.consultantName}</span>
                                </div>
                                {selectedConsultation.consultantQualifications && (
                                    <div className={styles.detailRow}>
                                        <strong>Chuyên môn:</strong>
                                        <span>{selectedConsultation.consultantQualifications}</span>
                                    </div>
                                )}
                                {selectedConsultation.consultantExperience && (
                                    <div className={styles.detailRow}>
                                        <strong>Kinh nghiệm:</strong>
                                        <span>{selectedConsultation.consultantExperience}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.detailSection}>
                                <h4>Thông tin lịch hẹn</h4>
                                <div className={styles.detailRow}>
                                    <strong>Ngày:</strong>
                                    <span>{formatDate(selectedConsultation.startTime)}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <strong>Thời gian:</strong>
                                    <span>
                                        {formatTime(selectedConsultation.startTime)} - {formatTime(selectedConsultation.endTime)}
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <strong>Trạng thái:</strong>
                                    <span className={`${styles.statusBadge} ${STATUS_CLASS[selectedConsultation.status] || ''}`}>
                                        {getStatusText(selectedConsultation.status)}
                                    </span>
                                </div>
                                {selectedConsultation.meetUrl && (
                                    <div className={styles.detailRow}>
                                        <strong>Link tham gia:</strong>
                                        <a href={selectedConsultation.meetUrl} target="_blank" rel="noopener noreferrer" className={styles.meetLink}>
                                            {selectedConsultation.meetUrl}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className={styles.detailSection}>
                                <h4>Thông tin thanh toán</h4>
                                <div className={styles.detailRow}>
                                    <strong>Giá:</strong>
                                    <span>{formatPrice(selectedConsultation.price)}</span>
                                </div>
                                {selectedConsultation.paymentMethod && (
                                    <div className={styles.detailRow}>
                                        <strong>Phương thức thanh toán:</strong>
                                        <span>{PAYMENT_METHOD_TEXT[selectedConsultation.paymentMethod] || selectedConsultation.paymentMethod}</span>
                                    </div>
                                )}
                                {selectedConsultation.paymentDate && (
                                    <div className={styles.detailRow}>
                                        <strong>Ngày thanh toán:</strong>
                                        <span>{formatDateTime(selectedConsultation.paymentDate)}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.detailSection}>
                                <h4>Thông tin khác</h4>
                                <div className={styles.detailRow}>
                                    <strong>Ngày tạo:</strong>
                                    <span>{formatDateTime(selectedConsultation.createdAt)}</span>
                                </div>
                                {selectedConsultation.updatedAt && (
                                    <div className={styles.detailRow}>
                                        <strong>Cập nhật lần cuối:</strong>
                                        <span>{formatDateTime(selectedConsultation.updatedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            {selectedConsultation.meetUrl && selectedConsultation.status === 'CONFIRMED' && (
                                <button
                                    className={styles.successBtn}
                                    onClick={() => window.open(selectedConsultation.meetUrl, '_blank')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="23,7 16,12 23,17 23,7"></polygon>
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                    </svg>
                                    Tham gia cuộc họp
                                </button>
                            )}
                            <button
                                className={styles.secondaryBtn}
                                onClick={handleCloseModal}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultationHistory;