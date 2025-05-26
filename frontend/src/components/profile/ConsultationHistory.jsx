import React, { useState, useEffect } from 'react';
import { consultationService } from '../../services/consultationService';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import './ConsultationHistory.css';

const STATUS_CLASS = {
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    CANCELED: 'badge-canceled',
    COMPLETED: 'badge-completed',
    PAYMENT_PENDING: 'badge-payment-pending',
    PAYMENT_FAILED: 'badge-payment-failed'
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
    const [error, setError] = useState('');
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await consultationService.getMyConsultations();

            if (response.success && response.data) {
                // Sắp xếp theo thời gian tạo mới nhất
                const sortedConsultations = response.data.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setConsultations(sortedConsultations);
            } else {
                const errorMsg = response.message || 'Không thể tải lịch sử tư vấn';
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error fetching consultations:', error);
            const errorMsg = 'Có lỗi xảy ra khi tải dữ liệu';
            setError(errorMsg);
            toast.error(errorMsg);
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
        if (e.target.classList.contains('modal-backdrop')) {
            handleCloseModal();
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Chưa xác định';
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    const handleRetry = () => {
        setError('');
        fetchConsultations();
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="consultation-history">
            <div className="history-header">
                <h2>Lịch sử tư vấn</h2>
                <button
                    className="consultation-refresh-btn"
                    onClick={fetchConsultations}
                    disabled={loading}
                >
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={handleRetry} className="retry-btn">
                        Thử lại
                    </button>
                </div>
            )}

            {!error && consultations.length === 0 ? (
                <div className="empty-state">
                    <h3>Chưa có lịch tư vấn nào</h3>
                    <p>Bạn chưa đặt lịch tư vấn nào. Hãy bắt đầu đặt lịch để nhận tư vấn từ chuyên gia!</p>
                    <a href="/consultation" className="consultation-primary-btn">
                        Đặt lịch tư vấn ngay
                    </a>
                </div>
            ) : !error && (
                <>
                    <table className="consultation-table">
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
                                        <div className="consultant-info">
                                            <strong>{consultation.consultantName}</strong>
                                            {consultation.consultantQualifications && (
                                                <div className="qualifications">
                                                    {consultation.consultantQualifications}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="time-info">
                                            <div className="date">{formatDate(consultation.startTime)}</div>
                                            <div className="time">
                                                {formatTime(consultation.startTime)} - {formatTime(consultation.endTime)}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${STATUS_CLASS[consultation.status] || ''}`}>
                                            {getStatusText(consultation.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="price-info">
                                            <strong>{formatPrice(consultation.price)}</strong>
                                            {consultation.paymentMethod && (
                                                <div className="payment-method">
                                                    {PAYMENT_METHOD_TEXT[consultation.paymentMethod] || consultation.paymentMethod}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{formatDate(consultation.createdAt)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="consultation-detail-btn"
                                                onClick={() => handleViewDetails(consultation)}
                                                title="Xem chi tiết"
                                            >
                                                <i className="fas fa-eye"></i>
                                                Chi tiết
                                            </button>
                                            {consultation.meetUrl && consultation.status === 'CONFIRMED' && (
                                                <button
                                                    className="consultation-join-btn"
                                                    onClick={() => window.open(consultation.meetUrl, '_blank')}
                                                    title="Tham gia cuộc họp"
                                                >
                                                    <i className="fas fa-video"></i>
                                                    Tham gia
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Modal chi tiết */}
            {showDetailModal && selectedConsultation && (
                <div className="modal-backdrop" onClick={handleModalBackdropClick}>
                    <div className="consultation-detail-modal">
                        <div className="modal-header">
                            <h3>Chi tiết lịch tư vấn</h3>
                            <button
                                className="close-btn"
                                onClick={handleCloseModal}
                                aria-label="Đóng"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>Thông tin chuyên gia</h4>
                                <div className="detail-row">
                                    <strong>Tên:</strong>
                                    <span>{selectedConsultation.consultantName}</span>
                                </div>
                                {selectedConsultation.consultantQualifications && (
                                    <div className="detail-row">
                                        <strong>Chuyên môn:</strong>
                                        <span>{selectedConsultation.consultantQualifications}</span>
                                    </div>
                                )}
                                {selectedConsultation.consultantExperience && (
                                    <div className="detail-row">
                                        <strong>Kinh nghiệm:</strong>
                                        <span>{selectedConsultation.consultantExperience}</span>
                                    </div>
                                )}
                            </div>

                            <div className="detail-section">
                                <h4>Thông tin lịch hẹn</h4>
                                <div className="detail-row">
                                    <strong>Ngày:</strong>
                                    <span>{formatDate(selectedConsultation.startTime)}</span>
                                </div>
                                <div className="detail-row">
                                    <strong>Thời gian:</strong>
                                    <span>
                                        {formatTime(selectedConsultation.startTime)} - {formatTime(selectedConsultation.endTime)}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <strong>Trạng thái:</strong>
                                    <span className={`badge ${STATUS_CLASS[selectedConsultation.status] || ''}`}>
                                        {getStatusText(selectedConsultation.status)}
                                    </span>
                                </div>
                                {selectedConsultation.meetUrl && (
                                    <div className="detail-row">
                                        <strong>Link tham gia:</strong>
                                        <a href={selectedConsultation.meetUrl} target="_blank" rel="noopener noreferrer">
                                            {selectedConsultation.meetUrl}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="detail-section">
                                <h4>Thông tin thanh toán</h4>
                                <div className="detail-row">
                                    <strong>Giá:</strong>
                                    <span>{formatPrice(selectedConsultation.price)}</span>
                                </div>
                                {selectedConsultation.paymentMethod && (
                                    <div className="detail-row">
                                        <strong>Phương thức thanh toán:</strong>
                                        <span>{PAYMENT_METHOD_TEXT[selectedConsultation.paymentMethod] || selectedConsultation.paymentMethod}</span>
                                    </div>
                                )}
                                {selectedConsultation.paymentDate && (
                                    <div className="detail-row">
                                        <strong>Ngày thanh toán:</strong>
                                        <span>{formatDateTime(selectedConsultation.paymentDate)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="detail-section">
                                <h4>Thông tin khác</h4>
                                <div className="detail-row">
                                    <strong>Ngày tạo:</strong>
                                    <span>{formatDateTime(selectedConsultation.createdAt)}</span>
                                </div>
                                {selectedConsultation.updatedAt && (
                                    <div className="detail-row">
                                        <strong>Cập nhật lần cuối:</strong>
                                        <span>{formatDateTime(selectedConsultation.updatedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            {selectedConsultation.meetUrl && selectedConsultation.status === 'CONFIRMED' && (
                                <button
                                    className="consultation-success-btn"
                                    onClick={() => window.open(selectedConsultation.meetUrl, '_blank')}
                                >
                                    <i className="fas fa-video"></i>
                                    Tham gia cuộc họp
                                </button>
                            )}
                            <button
                                className="consultation-secondary-btn"
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