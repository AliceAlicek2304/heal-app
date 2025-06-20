import React, { useState, useEffect } from 'react';
import { stiService } from '../../../services/stiService';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import RatingBadge from '../../common/RatingBadge/RatingBadge';
import RatingQuickView from '../../common/RatingQuickView/RatingQuickView';
import styles from './STIServiceCard.module.css';

const STIServiceCard = ({ service, onBookTest, onAuthRequired, autoOpenDetails = false, onDetailsOpened }) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [detailedService, setDetailedService] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshRating, setRefreshRating] = useState(0); // Add refresh trigger

    // Auto-open details modal if requested
    useEffect(() => {
        if (autoOpenDetails && service) {
            handleViewDetails();
        }
    }, [autoOpenDetails, service]);

    // Using the original simple booking approach
    const handleBookClick = () => {
        onBookTest(service);
    };    // Book from modal using the same simple approach
    const handleBookFromModal = () => {
        handleCloseModal();
        onBookTest(detailedService || service);
    }; const handleRatingClick = () => {
        setShowRatingModal(true);
    };

    const getStatusColor = (status) => {
        // Handle boolean values
        if (typeof status === 'boolean') {
            return status ? 'success' : 'danger';
        }

        // Handle string values
        if (typeof status === 'string') {
            switch (status.toLowerCase()) {
                case 'active':
                case 'true':
                    return 'success';
                case 'inactive':
                case 'false':
                    return 'danger';
                default:
                    return 'secondary';
            }
        }

        // Default fallback
        return 'secondary';
    };

    const getStatusText = (isActive) => {
        // Handle both boolean and string values
        if (typeof isActive === 'boolean') {
            return isActive ? 'Hoạt động' : 'Tạm ngưng';
        }

        if (typeof isActive === 'string') {
            const lower = isActive.toLowerCase();
            if (lower === 'active' || lower === 'true') {
                return 'Hoạt động';
            }
            return 'Tạm ngưng';
        }

        return 'Không xác định';
    };

    const isServiceActive = (status) => {
        if (typeof status === 'boolean') {
            return status;
        }

        if (typeof status === 'string') {
            const lower = status.toLowerCase();
            return lower === 'active' || lower === 'true';
        }

        return false;
    };

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const handleViewDetails = async () => {
        try {
            setShowDetailsModal(true);
            setLoading(true);
            setError(null);

            // Notify parent that details modal was opened
            if (onDetailsOpened) {
                onDetailsOpened();
            }

            // Fetch detailed service info
            const response = await stiService.getServiceDetails(service.serviceId);

            if (response.success) {
                // Ensure we have all necessary data by combining with original service data
                const combinedData = {
                    ...service,
                    ...response.data,
                    serviceId: response.data.serviceId || service.serviceId,
                    isActive: response.data.isActive !== undefined ? response.data.isActive : service.isActive
                };
                setDetailedService(combinedData);
            } else {
                setError(response.message || 'Không thể tải chi tiết dịch vụ');
            }
        } catch (error) {
            console.error('Error fetching service details:', error);
            setError('Đã xảy ra lỗi khi tải chi tiết dịch vụ');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowDetailsModal(false);        // Wait for animation to finish before clearing data
        setTimeout(() => {
            setDetailedService(null);
            setError(null);
        }, 300);
    }; const handleRatingSuccess = () => {
        setShowRatingModal(false);
        // Trigger refresh of rating data
        setRefreshRating(prev => prev + 1);
    };

    return (
        <>
            <div className={styles.stiServiceCard}>
                <div className={styles.serviceHeader}>
                    <div className={styles.serviceTitle}>
                        <h3 title={service.name || service.serviceName}>
                            {truncateText(service.name || service.serviceName, 40)}
                        </h3>
                        <span className={`${styles.statusBadge} ${styles[getStatusColor(service.isActive)]}`}>
                            {getStatusText(service.isActive)}
                        </span>
                    </div>
                </div>

                <div className={styles.serviceContent}>
                    <div className={styles.serviceDescription}>
                        <p title={service.description}>
                            {truncateText(service.description || 'Dịch vụ xét nghiệm STI chuyên nghiệp', 80)}
                        </p>
                    </div>

                    {service.testComponents && service.testComponents.length > 0 && (
                        <div className={styles.serviceComponents}>
                            <h4>Các xét nghiệm bao gồm:</h4>
                            <ul>
                                {service.testComponents.slice(0, 3).map((component, index) => (
                                    <li key={component.componentId || index} title={component.testName}>
                                        {truncateText(component.testName, 35)}
                                        {component.referenceRange && (
                                            <span className={styles.referenceRange} title={component.referenceRange}>
                                                {' (' + truncateText(component.referenceRange, 15) + ')'}
                                            </span>
                                        )}
                                    </li>
                                ))}
                                {service.testComponents.length > 3 && (
                                    <li className={styles.moreItems}>
                                        và {service.testComponents.length - 3} xét nghiệm khác...
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    <div className={styles.serviceDetails}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Số lượng xét nghiệm:</span>
                            <span className={styles.value}>
                                {service.componentCount || service.testComponents?.length || 0} xét nghiệm
                            </span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Thời gian lấy mẫu:</span>
                            <span className={styles.value}>15-30 phút</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Thời gian có kết quả:</span>
                            <span className={styles.value}>1-3 ngày làm việc</span>
                        </div>                    </div>                    {/* Rating Section */}
                    <div className={styles.ratingSection}>
                        <RatingBadge
                            targetType="sti_service"
                            targetId={service.serviceId}
                            onClick={handleRatingClick}
                            size="small"
                            showCount={true}
                            refreshTrigger={refreshRating}
                        />
                    </div>

                    <div className={styles.servicePrice}>
                        <div className={styles.priceInfo}>
                            <span className={styles.priceLabel}>Giá dịch vụ:</span>
                            <span className={styles.priceValue}>
                                {service.price ?
                                    `${service.price.toLocaleString('vi-VN')} VNĐ` :
                                    'Liên hệ'
                                }
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.serviceActions}>
                    <div className={styles.actionButtons}>
                        <button
                            className={styles.btnDetails}
                            onClick={handleViewDetails}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            Chi tiết
                        </button>
                        <button
                            className={`${styles.btnBook} ${isServiceActive(service.isActive) ? styles.btnPrimary : styles.btnDisabled}`}
                            onClick={handleBookClick}
                            disabled={!isServiceActive(service.isActive)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            {isServiceActive(service.isActive) ? 'Đặt lịch xét nghiệm' : 'Tạm ngưng dịch vụ'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Service Details Modal */}
            {showDetailsModal && (
                <div className={styles.modalBackdrop} onClick={handleCloseModal}>
                    <div className={styles.detailsModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết dịch vụ xét nghiệm</h3>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {loading ? (
                                <div className={styles.loadingContainer}>
                                    <LoadingSpinner />
                                </div>
                            ) : error ? (
                                <div className={styles.errorContainer}>
                                    <div className={styles.errorIcon}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                    </div>
                                    <p className={styles.errorMessage}>{error}</p>
                                    <button className={styles.retryBtn} onClick={handleViewDetails}>
                                        Thử lại
                                    </button>
                                </div>
                            ) : detailedService && (
                                <>
                                    <div className={styles.modalSection}>
                                        <h4 className={styles.sectionTitle}>{detailedService.name || detailedService.serviceName}</h4>
                                        <div className={styles.serviceBadge}>
                                            <span className={`${styles.statusBadge} ${styles[getStatusColor(detailedService.isActive)]}`}>
                                                {getStatusText(detailedService.isActive)}
                                            </span>
                                            <span className={styles.priceBadge}>
                                                {detailedService.price ? `${detailedService.price.toLocaleString('vi-VN')} VNĐ` : 'Liên hệ'}
                                            </span>
                                        </div>
                                        <p className={styles.serviceDescription}>{detailedService.description}</p>
                                    </div>

                                    <div className={styles.modalSection}>
                                        <h4 className={styles.sectionTitle}>Thông tin dịch vụ</h4>
                                        <div className={styles.serviceInfo}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Số lượng xét nghiệm:</span>
                                                <span className={styles.infoValue}>
                                                    {detailedService.componentCount ||
                                                        detailedService.testComponents?.length || 0} xét nghiệm
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Thời gian lấy mẫu:</span>
                                                <span className={styles.infoValue}>15-30 phút</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Thời gian có kết quả:</span>
                                                <span className={styles.infoValue}>1-3 ngày làm việc</span>
                                            </div>
                                        </div>
                                    </div>

                                    {detailedService.testComponents && detailedService.testComponents.length > 0 && (
                                        <div className={styles.modalSection}>
                                            <h4 className={styles.sectionTitle}>
                                                Danh sách xét nghiệm ({detailedService.testComponents.length})
                                            </h4>                                            <div className={styles.componentsList}>
                                                <table className={styles.componentsTable}>
                                                    <thead>
                                                        <tr>
                                                            <th>STT</th>
                                                            <th>Tên xét nghiệm</th>
                                                            <th>Giá trị tham chiếu</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailedService.testComponents.map((component, index) => (
                                                            <tr key={component.componentId || index}>
                                                                <td>{index + 1}</td>
                                                                <td>{component.testName}</td>
                                                                <td>{component.referenceRange || 'N/A'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.btnSecondary} onClick={handleCloseModal}>
                                Đóng
                            </button>
                            {detailedService && isServiceActive(detailedService.isActive) && (
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleBookFromModal}
                                >
                                    Đặt lịch xét nghiệm
                                </button>
                            )}
                        </div>                    </div>
                </div>
            )}            {/* Rating Quick View Modal */}
            {showRatingModal && (
                <RatingQuickView
                    targetType="sti_service"
                    targetId={service.serviceId}
                    targetName={service.name || service.serviceName}
                    onClose={() => setShowRatingModal(false)}
                    onRefresh={handleRatingSuccess}
                    refreshTrigger={refreshRating}
                />
            )}
        </>
    );
};

export default STIServiceCard;