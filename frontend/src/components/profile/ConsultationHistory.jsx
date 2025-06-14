import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { consultationService } from '../../services/consultationService';
import { ratingService } from '../../services/ratingService';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, formatDate, formatTime, parseDate } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import Pagination from '../common/Pagination/Pagination';
import RatingModal from '../common/RatingModal/RatingModal';
import RatingDetailModal from '../common/RatingDetailModal/RatingDetailModal';
import styles from './ConsultationHistory.module.css';

const STATUS_CLASS = {
    PENDING: styles.badgePending,
    CONFIRMED: styles.badgeConfirmed,
    CANCELED: styles.badgeCanceled,
    COMPLETED: styles.badgeCompleted
};

const ConsultationHistory = () => {
    const { user } = useAuth();
    const toast = useToast(); const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [currentRating, setCurrentRating] = useState(null);
    const [showCurrentRating, setShowCurrentRating] = useState(false);
    const [filters, setFilters] = useState({});
    const [filteredConsultations, setFilteredConsultations] = useState([]);
    const [consultationRatings, setConsultationRatings] = useState({}); // Track rating status for each consultation

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
    }; useEffect(() => {
        if (user) {
            fetchConsultations();
        }
    }, [user]); const fetchConsultations = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await consultationService.getMyConsultations();
            if (response.success && response.data) {
                const sortedConsultations = response.data.sort((a, b) => {
                    const dateA = parseDate(b.createdAt);
                    const dateB = parseDate(a.createdAt);
                    if (!dateA || !dateB) return 0;
                    return dateB.getTime() - dateA.getTime();
                });
                setConsultations(sortedConsultations);

                // Load rating status for completed consultations
                await loadRatingStatuses(sortedConsultations);
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

    // Load rating status for consultations
    const loadRatingStatuses = async (consultations) => {
        const ratingsMap = {};

        // Only check rating status for completed consultations
        const completedConsultations = consultations.filter(c => c.status === 'COMPLETED');

        await Promise.all(
            completedConsultations.map(async (consultation) => {
                try {
                    const response = await ratingService.checkEligibility('consultant', consultation.consultantId, consultation.consultationId);
                    if (response.success) {
                        ratingsMap[consultation.consultationId] = {
                            canRate: response.data.canRate,
                            hasRated: response.data.hasRated,
                            existingRating: response.data.existingRating
                        };
                    }
                } catch (error) {
                    console.error(`Error checking rating eligibility for consultation ${consultation.consultationId}:`, error);
                    // Default to allowing rating if there's an error
                    ratingsMap[consultation.consultationId] = {
                        canRate: true,
                        hasRated: false,
                        existingRating: null
                    };
                }
            })
        );

        setConsultationRatings(ratingsMap);
    }; const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ xác nhận';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'CANCELED': return 'Đã hủy';
            case 'COMPLETED': return 'Đã hoàn thành';
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
    }; const handleRetry = () => {
        toast.info('Đang tải lại dữ liệu...');
        fetchConsultations();
    };    // Helper function để kiểm tra consultation có thể được đánh giá không
    const canRateConsultation = (consultation) => {
        return consultation.status === 'COMPLETED';
    };

    // Get rating button text and style
    const getRatingButtonInfo = (consultation) => {
        const ratingStatus = consultationRatings[consultation.consultationId];

        if (!ratingStatus) {
            return {
                text: 'Đánh giá',
                icon: 'star',
                className: styles.rateBtn
            };
        }

        if (ratingStatus.hasRated) {
            return {
                text: 'Xem đánh giá',
                icon: 'star-filled',
                className: styles.viewRatingBtn
            };
        }

        return {
            text: 'Đánh giá',
            icon: 'star',
            className: styles.rateBtn
        };
    };// Handler để mở rating modal hoặc hiển thị rating hiện có
    const handleRateConsultant = async (consultation) => {
        setSelectedConsultation(consultation);

        try {
            // Kiểm tra rating eligibility trước
            const eligibilityResponse = await ratingService.checkEligibility('consultant', consultation.consultantId, consultation.consultationId);

            if (!eligibilityResponse.success) {
                toast.error(eligibilityResponse.message || 'Không thể kiểm tra điều kiện đánh giá');
                return;
            }

            const { canRate, hasRated, existingRating } = eligibilityResponse.data;

            if (hasRated && existingRating) {
                // Đã có rating, hiển thị rating hiện có
                setCurrentRating(existingRating);
                setShowCurrentRating(true);
                return;
            } else if (!canRate) {
                toast.warning('Bạn cần hoàn thành consultation trước khi đánh giá');
                return;
            }

            // Chưa có rating và đủ điều kiện, hiển thị form rating
            setShowRatingModal(true);
        } catch (error) {
            console.error('Lỗi khi kiểm tra rating:', error);
            toast.error('Có lỗi xảy ra khi kiểm tra điều kiện đánh giá');
        }
    };// Handler để đóng rating modal
    const handleCloseRatingModal = () => {
        setShowRatingModal(false);
        setSelectedConsultation(null);
        setCurrentRating(null); // Clear current rating when closing
    };

    // Handler để đóng modal hiển thị rating hiện có
    const handleCloseCurrentRating = () => {
        setShowCurrentRating(false);
        setCurrentRating(null);
        setSelectedConsultation(null);
    };    // Handler khi rating được submit thành công
    const handleRatingSubmitted = async (updatedRating) => {
        const isEdit = currentRating && currentRating.ratingId;
        const message = isEdit ? 'Đã cập nhật đánh giá thành công!' : 'Cảm ơn bạn đã đánh giá consultant!';
        toast.success(message);
        handleCloseRatingModal();
        
        // Refresh rating status for this consultation  
        if (selectedConsultation) {
            await loadRatingStatuses([selectedConsultation]);
        }
    };

    // Handler để chỉnh sửa rating
    const handleEditRating = (rating) => {
        setShowCurrentRating(false);
        setCurrentRating(rating); // Keep the rating data for editing
        // Open rating modal with existing data for editing
        setShowRatingModal(true);
    };

    // Handler để xóa rating
    const handleDeleteRating = async (rating) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) {
            return;
        }

        try {
            const response = await ratingService.deleteRating(rating.ratingId);
            if (response.success) {
                toast.success('Đã xóa đánh giá thành công!');
                setShowCurrentRating(false);
                setCurrentRating(null);
                
                // Refresh rating status for this consultation
                if (selectedConsultation) {
                    await loadRatingStatuses([selectedConsultation]);
                }
                setSelectedConsultation(null);
            } else {
                toast.error(response.message || 'Không thể xóa đánh giá');
            }
        } catch (error) {
            console.error('Lỗi khi xóa rating:', error);
            toast.error('Có lỗi xảy ra khi xóa đánh giá');
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
                    consultation.consultantName?.toLowerCase().includes(searchLower) ||
                    consultation.customerName?.toLowerCase().includes(searchLower) ||
                    consultation.customerNotes?.toLowerCase().includes(searchLower) ||
                    consultation.consultantNotes?.toLowerCase().includes(searchLower)
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
                const consultationDate = parseDate(consultation.consultationTime || consultation.createdAt);
                if (!consultationDate) return false;

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
                </button>            </div>            {/* Advanced Filter Component */}
            <AdvancedFilter
                onFilterChange={handleFilterChange}
                statusOptions={[
                    { value: 'PENDING', label: 'Chờ xác nhận' },
                    { value: 'CONFIRMED', label: 'Đã xác nhận' },
                    { value: 'COMPLETED', label: 'Hoàn thành' },
                    { value: 'CANCELED', label: 'Đã hủy' }
                ]}
                placeholder="Tìm kiếm theo mã tư vấn, bác sĩ, ghi chú..."
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
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h3>Không tìm thấy kết quả</h3>
                        <p>Không có cuộc tư vấn nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh tiêu chí tìm kiếm.</p>
                    </div>
                ) : (
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
                )) : (
                <>
                    {/* Mobile Card View */}
                    <div ref={consultationsListRef} className={styles.mobileView}>
                        {currentItems.map(consultation => (
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
                                </div>                                <div className={styles.cardContent}>
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
                                </div>                                <div className={styles.cardActions}>
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
                                    )}                                    {canRateConsultation(consultation) && (
                                        <button
                                            className={getRatingButtonInfo(consultation).className}
                                            onClick={() => handleRateConsultant(consultation)}
                                            title={getRatingButtonInfo(consultation).text}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                                            </svg>
                                            {getRatingButtonInfo(consultation).text}
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
                                        <th>Ngày tạo</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map(consultation => (
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
                                                    )}                                                    {canRateConsultation(consultation) && (
                                                        <button
                                                            className={
                                                                getRatingButtonInfo(consultation).className === styles.viewRatingBtn 
                                                                    ? styles.viewRatingBtnTable 
                                                                    : styles.rateBtnTable
                                                            }
                                                            onClick={() => handleRateConsultant(consultation)}
                                                            title={getRatingButtonInfo(consultation).text}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                                                            </svg>
                                                            {getRatingButtonInfo(consultation).text}
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

                    {/* Pagination */}
                    {totalFilteredPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalFilteredPages}
                            onPageChange={handlePageChange}
                        />
                    )}
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
                                    </div>)}
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
                </div>)}            {/* Rating Modal */}
            {showRatingModal && selectedConsultation && (
                <RatingModal
                    isOpen={showRatingModal}
                    onClose={handleCloseRatingModal}
                    targetType="consultant"
                    targetId={selectedConsultation.consultantId}
                    targetName={selectedConsultation.consultantName}
                    consultationId={selectedConsultation.consultationId}
                    existingRating={currentRating}
                    onSuccess={handleRatingSubmitted}
                />
            )}

            {/* Rating Detail Modal */}
            {showCurrentRating && currentRating && selectedConsultation && (
                <RatingDetailModal
                    isOpen={showCurrentRating}
                    onClose={handleCloseCurrentRating}
                    rating={currentRating}
                    targetType="consultant"
                    targetName={selectedConsultation.consultantName}
                    currentUserId={user?.id}
                    onEdit={handleEditRating}
                    onDelete={handleDeleteRating}
                />
            )}
        </div>
    );
};

export default ConsultationHistory;