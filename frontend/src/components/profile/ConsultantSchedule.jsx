import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { consultationService } from '../../services/consultationService';
import { formatDateTime, parseDate } from '../../utils/dateUtils';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import styles from './ConsultantSchedule.module.css';

const ConsultantSchedule = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState({});
    const [filters, setFilters] = useState({});
    const [filteredConsultations, setFilteredConsultations] = useState([]);

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
    }; const getActionText = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'xác nhận';
            case 'COMPLETED': return 'hoàn thành';
            case 'CANCELED': return 'hủy';
            default: return 'cập nhật';
        }
    };

    // Filter consultations based on selected filters
    const applyFilters = (consultationsToFilter, currentFilters) => {
        let filtered = [...consultationsToFilter];

        // Text search filter
        if (currentFilters.searchText) {
            const searchLower = currentFilters.searchText.toLowerCase();
            filtered = filtered.filter(consultation => {
                return (
                    consultation.consultationId?.toString().includes(searchLower) ||
                    consultation.customerName?.toLowerCase().includes(searchLower) ||
                    consultation.customerId?.toString().includes(searchLower) ||
                    consultation.consultationType?.toLowerCase().includes(searchLower) ||
                    consultation.description?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Status filter
        if (currentFilters.status) {
            filtered = filtered.filter(consultation => consultation.status === currentFilters.status);
        }

        // Date range filter
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            filtered = filtered.filter(consultation => {
                let consultationDate;

                // Handle different date formats from backend
                const rawDate = consultation.startTime || consultation.createdAt;
                if (Array.isArray(rawDate)) {
                    // Array format: [year, month, day, hour, minute, second, nanosecond]
                    // Note: month is 1-based in array, but Date constructor expects 0-based
                    consultationDate = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
                } else if (typeof rawDate === 'string' || rawDate instanceof Date) {
                    consultationDate = new Date(rawDate);
                } else {
                    console.warn('Unknown date format:', rawDate);
                    return false;
                }

                if (currentFilters.dateFrom) {
                    const fromDate = new Date(currentFilters.dateFrom);
                    if (consultationDate < fromDate) return false;
                }

                if (currentFilters.dateTo) {
                    const toDate = new Date(currentFilters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (consultationDate > toDate) return false;
                }

                return true;
            });
        }

        return filtered;
    };

    // Effect to apply filters when consultations or filters change
    useEffect(() => {
        const filtered = applyFilters(consultations, filters);
        setFilteredConsultations(filtered);
    }, [consultations, filters]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
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

    return (<div className={styles.container}>
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

        {/* Advanced Filter Component */}
        <AdvancedFilter
            onFilterChange={handleFilterChange}
            statusOptions={[
                { value: 'PENDING', label: 'Chờ xác nhận' },
                { value: 'CONFIRMED', label: 'Đã xác nhận' },
                { value: 'COMPLETED', label: 'Đã hoàn thành' },
                { value: 'CANCELED', label: 'Đã hủy' }
            ]}
            placeholder="Tìm kiếm theo ID, tên khách hàng, loại tư vấn, mô tả..."
            showDateFilter={true}
            showStatusFilter={true}
        />

        {consultations.length > 0 && (
            <div className={styles.statsInfo}>
                Hiển thị: {filteredConsultations.length}/{consultations.length} cuộc tư vấn
            </div>
        )}

        {filteredConsultations.length === 0 ? (
            consultations.length > 0 ? (
                <div className={styles.emptyState}>
                    <p>Không có cuộc tư vấn nào phù hợp với bộ lọc</p>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p>Chưa có lịch tư vấn nào được phân công</p>
                </div>
            )
        ) : (
            <div className={styles.consultationsList}>
                {filteredConsultations.map((consultation) => (
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