import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { consultationService } from '../../services/consultationService';
import { formatDateTime } from '../../utils/dateUtils';
import styles from './ConsultantSchedule.module.css';

const ConsultantSchedule = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState({});

    const statusLabels = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'COMPLETED': 'Đã hoàn thành',
        'CANCELED': 'Đã hủy'
    };

    const statusColors = {
        'PENDING': '#ffa500',
        'CONFIRMED': '#007bff',
        'COMPLETED': '#28a745',
        'CANCELED': '#dc3545'
    };

    useEffect(() => {
        loadConsultations();
    }, []);

    const handleAuthRequired = () => {
        logout();
        navigate('/login');
    };

    const loadConsultations = async () => {
        try {
            setLoading(true);
            const response = await consultationService.getConsultantSchedule(handleAuthRequired);

            if (response.success === false) {
                setError(response.message || 'Không thể tải lịch tư vấn');
                return;
            }

            // Backend trả về data trong response.data
            const consultationsData = response.data || response;

            // Sắp xếp theo thời gian mới nhất
            const sortedConsultations = consultationsData.sort((a, b) =>
                new Date(b.startTime) - new Date(a.startTime)
            );

            setConsultations(sortedConsultations);
            setError('');
        } catch (error) {
            setError('Có lỗi xảy ra khi tải lịch tư vấn');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (consultationId, newStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [consultationId]: true }));

            const response = await consultationService.updateConsultationStatus(
                consultationId,
                newStatus,
                handleAuthRequired
            );

            if (response.success !== false) {
                // Cập nhật local state
                setConsultations(prev => prev.map(consultation =>
                    consultation.consultationId === consultationId
                        ? { ...consultation, status: newStatus }
                        : consultation
                ));
                setError('');
            } else {
                setError(response.message || `Không thể ${getActionText(newStatus)} lịch tư vấn`);
            }
        } catch (error) {
            setError(`Có lỗi xảy ra khi ${getActionText(newStatus)} lịch tư vấn`);
        } finally {
            setActionLoading(prev => ({ ...prev, [consultationId]: false }));
        }
    };

    const getActionText = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'xác nhận';
            case 'COMPLETED': return 'hoàn thành';
            case 'CANCELED': return 'hủy';
            default: return 'cập nhật';
        }
    };

    const renderActionButtons = (consultation) => {
        const isLoading = actionLoading[consultation.consultationId];
        const consultationId = consultation.consultationId;

        switch (consultation.status) {
            case 'PENDING':
                return (
                    <div className={styles.actionButtons}>
                        <button
                            onClick={() => handleUpdateStatus(consultationId, 'CONFIRMED')}
                            disabled={isLoading}
                            className={`${styles.actionButton} ${styles.confirmButton}`}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(consultationId, 'CANCELED')}
                            disabled={isLoading}
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Hủy'}
                        </button>
                    </div>
                );

            case 'CONFIRMED':
                return (
                    <div className={styles.actionButtons}>
                        <button
                            onClick={() => handleUpdateStatus(consultationId, 'COMPLETED')}
                            disabled={isLoading}
                            className={`${styles.actionButton} ${styles.completeButton}`}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Hoàn thành'}
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(consultationId, 'CANCELED')}
                            disabled={isLoading}
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Hủy'}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Đang tải lịch tư vấn...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Lịch tư vấn của tôi</h2>
                <button
                    onClick={loadConsultations}
                    className={styles.refreshButton}
                    disabled={loading}
                >
                    Làm mới
                </button>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {consultations.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Chưa có lịch tư vấn nào được phân công</p>
                </div>
            ) : (
                <div className={styles.consultationsList}>
                    {consultations.map((consultation) => (
                        <div key={consultation.consultationId} className={styles.consultationCard}>
                            <div className={styles.consultationHeader}>
                                <div className={styles.patientInfo}>
                                    <h3>{consultation.customerName || 'Khách hàng'}</h3>
                                    <p className={styles.contactInfo}>
                                        ID khách hàng: {consultation.customerId}
                                    </p>
                                </div>

                                <div className={styles.statusBadge}>
                                    <span
                                        className={styles.status}
                                        style={{
                                            backgroundColor: statusColors[consultation.status],
                                            color: 'white'
                                        }}
                                    >
                                        {statusLabels[consultation.status]}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.consultationDetails}>
                                <div className={styles.detailRow}>
                                    <strong>Thời gian:</strong> {formatDateTime(consultation.startTime)}
                                </div>

                                {consultation.endTime && (
                                    <div className={styles.detailRow}>
                                        <strong>Kết thúc:</strong> {formatDateTime(consultation.endTime)}
                                    </div>
                                )}

                                {consultation.consultationType && (
                                    <div className={styles.detailRow}>
                                        <strong>Loại tư vấn:</strong> {consultation.consultationType}
                                    </div>
                                )}

                                {consultation.description && (
                                    <div className={styles.detailRow}>
                                        <strong>Mô tả:</strong>
                                        <p className={styles.description}>{consultation.description}</p>
                                    </div>
                                )}

                                {consultation.createdAt && (
                                    <div className={styles.detailRow}>
                                        <strong>Đặt lịch lúc:</strong> {formatDateTime(consultation.createdAt)}
                                    </div>
                                )}

                                {consultation.consultantName && (
                                    <div className={styles.detailRow}>
                                        <strong>Chuyên gia:</strong> {consultation.consultantName}
                                    </div>
                                )}
                            </div>

                            <div className={styles.consultationActions}>
                                {renderActionButtons(consultation)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConsultantSchedule;