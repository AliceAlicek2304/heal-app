import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { consultationService } from '../../services/consultationService';
import { formatDateTime, parseDate } from '../../utils/dateUtils';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import Pagination from '../common/Pagination/Pagination';
import styles from './ConsultantSchedule.module.css';

const ConsultantSchedule = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); const [actionLoading, setActionLoading] = useState({});
    const [filters, setFilters] = useState({});
    const [filteredConsultations, setFilteredConsultations] = useState([]);

    // Modal chi tiết
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const consultationsListRef = useRef(null);

    // Handle page change with smooth scroll
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        if (consultationsListRef.current) {
            consultationsListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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
    };    // Xử lý modal chi tiết
    const handleViewDetails = (consultation) => {
        setSelectedConsultation(consultation);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedConsultation(null);
    }; const handleJoinMeeting = (meetingUrl) => {
        if (meetingUrl) {
            window.open(meetingUrl, '_blank');
        }
    };    const handleCopyLink = async (meetingUrl) => {
        try {
            await navigator.clipboard.writeText(meetingUrl);
            // Hiển thị thông báo thành công
            setError(''); // Clear any existing errors
            // Tạo temporary success message
            const successMsg = document.createElement('div');
            successMsg.textContent = '✓ Đã sao chép link cuộc họp!';
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 10000;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(successMsg);
            setTimeout(() => document.body.removeChild(successMsg), 3000);
        } catch (err) {
            console.error('Không thể sao chép link:', err);
            // Fallback method for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = meetingUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                // Show success message for fallback too
                const successMsg = document.createElement('div');
                successMsg.textContent = '✓ Đã sao chép link cuộc họp!';
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 10000;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                `;
                document.body.appendChild(successMsg);
                setTimeout(() => document.body.removeChild(successMsg), 3000);
            } catch (fallbackErr) {
                setError('Không thể sao chép link. Vui lòng sao chép thủ công.');
            }
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Chưa xác định';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getActionText = (status) => {
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
    };    // Effect to apply filters when consultations or filters change
    useEffect(() => {
        const filtered = applyFilters(consultations, filters);
        setFilteredConsultations(filtered);
        setCurrentPage(0); // Reset to first page when filters change
    }, [consultations, filters]);

    // Calculate client-side pagination for filtered results
    const itemsPerPage = 10;
    const totalFilteredPages = Math.ceil(filteredConsultations.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredConsultations.slice(startIndex, endIndex);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    }; const renderActionButtons = (consultation) => {
        const isLoading = actionLoading[consultation.consultationId];
        const consultationId = consultation.consultationId;

        const detailButton = (
            <button
                onClick={() => handleViewDetails(consultation)}
                className={`${styles.actionButton} ${styles.detailButton}`}
                title="Xem chi tiết"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Chi tiết
            </button>
        );

        switch (consultation.status) {
            case 'PENDING':
                return (
                    <div className={styles.actionButtons}>
                        {detailButton}
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
                        {detailButton}
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
                return (
                    <div className={styles.actionButtons}>
                        {detailButton}
                    </div>
                );
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
        )}        {filteredConsultations.length === 0 ? (
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
            <>
                <div ref={consultationsListRef} className={styles.consultationsList}>
                    {currentItems.map((consultation) => (
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
                                )}                            {consultation.consultantName && (
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

                {/* Pagination */}
                {totalFilteredPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalFilteredPages}
                        onPageChange={handlePageChange}
                    />)}
            </>
        )}

        {/* Modal chi tiết */}
        {showDetailModal && selectedConsultation && (
            <div className={styles.modalBackdrop} onClick={handleCloseModal}>
                <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3>Chi tiết cuộc tư vấn #{selectedConsultation.consultationId}</h3>
                        <button className={styles.closeBtn} onClick={handleCloseModal}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        {/* Thông tin trạng thái */}
                        <div className={styles.modalSection}>
                            <h4>Trạng thái</h4>
                            <div className={styles.statusInfo}>
                                <span
                                    className={styles.statusBadge}
                                    style={{
                                        backgroundColor: statusColors[selectedConsultation.status],
                                        color: 'white'
                                    }}
                                >
                                    {statusLabels[selectedConsultation.status]}
                                </span>
                            </div>
                        </div>                        {/* Thông tin khách hàng */}
                        <div className={styles.modalSection}>
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Thông tin khách hàng
                            </h4>                            <div className={styles.customerInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Họ tên:</span>
                                    <span className={styles.value}>{selectedConsultation.customerName || 'Chưa cập nhật'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Email:</span>
                                    <span className={styles.value}>
                                        {selectedConsultation.customerEmail ? (
                                            <a href={`mailto:${selectedConsultation.customerEmail}`} className={styles.contactLink}>
                                                📧 {selectedConsultation.customerEmail}
                                            </a>
                                        ) : (
                                            <span className={styles.unavailable}>Chưa cập nhật</span>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Số điện thoại:</span>
                                    <span className={styles.value}>
                                        {selectedConsultation.customerPhone ? (
                                            <a href={`tel:${selectedConsultation.customerPhone}`} className={styles.contactLink}>
                                                📞 {selectedConsultation.customerPhone}
                                            </a>
                                        ) : (
                                            <span className={styles.unavailable}>Chưa cập nhật</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Thông tin cuộc tư vấn */}
                        <div className={styles.modalSection}>
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Chi tiết tư vấn
                            </h4>
                            <div className={styles.consultationInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Thời gian bắt đầu:</span>
                                    <span className={styles.value}>{formatDateTime(selectedConsultation.startTime)}</span>
                                </div>
                                {selectedConsultation.endTime && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Thời gian kết thúc:</span>
                                        <span className={styles.value}>{formatDateTime(selectedConsultation.endTime)}</span>
                                    </div>
                                )}
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Loại tư vấn:</span>
                                    <span className={styles.value}>{selectedConsultation.consultationType || 'Tư vấn trực tuyến'}</span>
                                </div>
                                {selectedConsultation.price && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Giá dịch vụ:</span>
                                        <span className={styles.value}>{formatPrice(selectedConsultation.price)}</span>
                                    </div>
                                )}
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Đặt lịch lúc:</span>
                                    <span className={styles.value}>{formatDateTime(selectedConsultation.createdAt)}</span>
                                </div>
                                {selectedConsultation.description && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Mô tả:</span>
                                        <span className={styles.value}>{selectedConsultation.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>                        {/* Link cuộc họp trực tuyến */}
                        <div className={styles.modalSection}>
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                </svg>
                                Cuộc họp trực tuyến
                            </h4>
                            <div className={styles.meetingInfo}>
                                {selectedConsultation.meetUrl ? (
                                    <>
                                        <div className={styles.meetingUrl}>
                                            <span className={styles.label}>Link tham gia:</span>
                                            <div className={styles.urlContainer}>
                                                <input
                                                    type="text"
                                                    value={selectedConsultation.meetUrl}
                                                    readOnly
                                                    className={styles.urlInput}
                                                />
                                                <button
                                                    onClick={() => handleCopyLink(selectedConsultation.meetUrl)}
                                                    className={styles.copyBtn}
                                                    title="Sao chép link"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleJoinMeeting(selectedConsultation.meetUrl)}
                                            className={styles.joinMeetingBtn}
                                            disabled={selectedConsultation.status === 'CANCELED'}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                            </svg>
                                            {selectedConsultation.status === 'CANCELED' ? 'Cuộc họp đã hủy' : 'Tham gia cuộc họp'}
                                        </button>
                                    </>
                                ) : (
                                    <div className={styles.noMeetingUrl}>
                                        <span className={styles.unavailable}>
                                            ⚠️ Link cuộc họp chưa được tạo. Sẽ có sau khi xác nhận lịch tư vấn.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            onClick={handleCloseModal}
                            className={styles.closeButton}
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

export default ConsultantSchedule;