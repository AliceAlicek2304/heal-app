import React, { useState, useEffect } from 'react';
import styles from './ManagerRating.module.css';
import {
    getAllRatingsForStaff, getConsultationRatingsForStaff, getSTIServiceRatingsForStaff,
    getAllRatingSummaryForStaff, getConsultationRatingSummaryForStaff, getSTIServiceRatingSummaryForStaff,
    replyToRatingAsStaff, updateStaffReply, deleteStaffReply, deleteRatingAsStaff
} from '../../services/ratingService';

const ManagerRating = () => {
    // State quản lý
    const [activeTab, setActiveTab] = useState('all');
    const [ratings, setRatings] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        sort: 'newest',
        filterRating: null,
        keyword: ''
    });    // Reply state
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [editReplyText, setEditReplyText] = useState('');

    // Modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRatingDetail, setSelectedRatingDetail] = useState(null);

    // Load dữ liệu khi component mount hoặc tab/filter thay đổi
    useEffect(() => {
        loadRatings(true); // Reset to page 0
        loadSummary();
    }, [activeTab, filters]);

    // Load ratings dựa trên tab hiện tại
    const loadRatings = async (reset = false) => {
        setLoading(true);
        try {
            const page = reset ? 0 : currentPage;
            const size = 20;
            let response;

            switch (activeTab) {
                case 'consultation':
                    response = await getConsultationRatingsForStaff(page, size, filters.sort, filters.filterRating, filters.keyword);
                    break;
                case 'sti-service':
                    response = await getSTIServiceRatingsForStaff(page, size, filters.sort, filters.filterRating, filters.keyword);
                    break;
                case 'all':
                default:
                    response = await getAllRatingsForStaff(page, size, filters.sort, filters.filterRating, filters.keyword); break;
            }            if (response && response.success && response.data) {
                const newRatings = response.data.content || [];

                if (reset) {
                    setRatings(newRatings);
                    setCurrentPage(0);
                } else {
                    setRatings(prev => [...prev, ...newRatings]);
                } setTotalPages(response.data.totalPages || 0);
                setHasMore(!response.data.last);
            } else {
                console.warn('No data received or API failed:', response);
                if (reset) {
                    setRatings([]);
                }
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            if (reset) {
                setRatings([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Load summary
    const loadSummary = async () => {
        try {
            let response;

            switch (activeTab) {
                case 'consultation':
                    response = await getConsultationRatingSummaryForStaff();
                    break;
                case 'sti-service':
                    response = await getSTIServiceRatingSummaryForStaff();
                    break;
                case 'all':
                default:
                    response = await getAllRatingSummaryForStaff();
                    break;
            }            if (response && response.success) {
                setSummary(response.data || {});
            }
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    };

    // Load more ratings (pagination)
    const loadMore = () => {
        if (hasMore && !loading) {
            setCurrentPage(prev => prev + 1);
            loadRatings(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(0);
    };    // Handle reply to rating
    const handleReply = async (ratingId) => {
        if (!replyText.trim()) return; try {
            const response = await replyToRatingAsStaff(ratingId, { staffReply: replyText });

            if (response && response.success) {
                // Update local state
                setRatings(prev => prev.map(rating =>
                    (rating.ratingId || rating.id) === ratingId
                        ? { ...rating, staffReply: response.data.staffReply }
                        : rating
                )); setReplyingToId(null);
                setReplyText('');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
        }
    };

    // Handle update reply
    const handleUpdateReply = async (ratingId) => {
        if (!editReplyText.trim()) return;

        try {
            const response = await updateStaffReply(ratingId, { staffReply: editReplyText }); if (response && response.success) {
                // Update local state
                setRatings(prev => prev.map(rating =>
                    (rating.ratingId || rating.id) === ratingId
                        ? { ...rating, staffReply: response.data.staffReply }
                        : rating
                )); setEditingReplyId(null);
                setEditReplyText('');
            }
        } catch (error) {
            console.error('Error updating reply:', error);
        }
    };

    // Handle delete reply
    const handleDeleteReply = async (ratingId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return;

        try {
            const response = await deleteStaffReply(ratingId);

            if (response && response.success) {                // Update local state
                setRatings(prev => prev.map(rating =>
                    (rating.ratingId || rating.id) === ratingId ? { ...rating, staffReply: null }
                        : rating
                ));
            }
        } catch (error) {
            console.error('Error deleting reply:', error);
        }
    };

    // Handle soft delete rating
    const handleDeleteRating = async (ratingId) => {
        if (!window.confirm('Bạn có chắc chắn muốn ẩn đánh giá này?')) return;

        try {
            const response = await deleteRatingAsStaff(ratingId);

            if (response && response.success) {                // Remove from local state
                setRatings(prev => prev.filter(rating => (rating.ratingId || rating.id) !== ratingId));
            }
        } catch (error) {
            console.error('Error hiding rating:', error);
        }
    };    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';

        // Handle array format [2025, 6, 14, 20, 15, 15, 922000000]
        if (Array.isArray(dateString)) {
            const [year, month, day, hour, minute, second] = dateString;
            const date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Handle string format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render stars
    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <span
                key={index}
                className={`${styles.star} ${index < rating ? styles.filled : ''}`}
            >
                ★
            </span>
        ));
    };

    // Get tab display name
    const getTabDisplayName = (tab) => {
        switch (tab) {
            case 'all': return 'Tất cả';
            case 'consultation': return 'Tư vấn';
            case 'sti-service': return 'Dịch vụ STI';
            default: return tab;
        }
    };

    return (
        <div className={styles.managerRating}>
            <div className={styles.header}>
                <h2>Quản lý Đánh giá</h2>
                <p>Xem và phản hồi các đánh giá từ khách hàng</p>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryCards}>
                <div className={styles.summaryCard}>
                    <h3>Tổng đánh giá</h3>
                    <div className={styles.summaryNumber}>{summary.totalRatings || 0}</div>
                </div>
                <div className={styles.summaryCard}>
                    <h3>Đánh giá trung bình</h3>
                    <div className={styles.summaryNumber}>
                        {summary.averageRating ? summary.averageRating.toFixed(1) : '0.0'}
                    </div>
                </div>                <div className={styles.summaryCard}>
                    <h3>Chưa phản hồi</h3>
                    <div className={styles.summaryNumber}>{summary.pendingReplies || 0}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {['all', 'consultation', 'sti-service'].map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {getTabDisplayName(tab)}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Sắp xếp:</label>
                    <select
                        value={filters.sort}
                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="highest">Điểm cao nhất</option>
                        <option value="lowest">Điểm thấp nhất</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Lọc theo điểm:</label>
                    <select
                        value={filters.filterRating || ''}
                        onChange={(e) => handleFilterChange('filterRating', e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">Tất cả</option>
                        <option value="5">5 sao</option>
                        <option value="4">4 sao</option>
                        <option value="3">3 sao</option>
                        <option value="2">2 sao</option>
                        <option value="1">1 sao</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Tìm kiếm:</label>
                    <input
                        type="text"
                        placeholder="Nhập từ khóa..."
                        value={filters.keyword}
                        onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    />
                </div>
            </div>

            {/* Ratings List */}
            <div className={styles.ratingsList}>
                {loading && ratings.length === 0 ? (
                    <div className={styles.loading}>Đang tải...</div>
                ) : ratings.length === 0 ? (
                    <div className={styles.noData}>Không có đánh giá nào</div>
                ) : (ratings.map(rating => (
                    <div key={rating.ratingId || rating.id} className={styles.ratingCard}>
                        <div className={styles.ratingHeader}>
                            <div className={styles.ratingInfo}>
                                <div className={styles.stars}>
                                    {renderStars(rating.rating)}
                                    <span className={styles.ratingValue}>({rating.rating}/5)</span>
                                </div>                                <div className={styles.ratingMeta}>
                                    <div className={styles.userInfo}>
                                        {rating.userAvatar && (
                                            <img
                                                src={`http://localhost:8080${rating.userAvatar}`}
                                                alt="User Avatar"
                                                className={styles.userAvatar}
                                            />
                                        )}
                                        <span className={styles.customer}>
                                            {rating.userFullName || rating.maskedUserName || 'Khách hàng'}
                                        </span>
                                    </div>
                                    <span className={styles.date}>{formatDate(rating.createdAt)}</span>
                                    <span className={styles.type}>
                                        {rating.targetType === 'CONSULTANT' ? '👩‍⚕️ Tư vấn' : '🔬 Dịch vụ STI'}
                                    </span>
                                </div>
                            </div>                            <div className={styles.ratingActions}>
                                <button
                                    className={styles.detailBtn}
                                    onClick={() => {
                                        setSelectedRatingDetail(rating);
                                        setShowDetailModal(true);
                                    }}
                                    title="Xem chi tiết"
                                >
                                    👁️
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDeleteRating(rating.ratingId || rating.id)}
                                    title="Ẩn đánh giá"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className={styles.ratingContent}>
                            <p>{rating.comment}</p>
                            {rating.targetName && (
                                <div className={styles.targetInfo}>
                                    <strong>Đối tượng:</strong> {rating.targetName}
                                </div>
                            )}
                        </div>

                        {/* Staff Reply Section */}
                        <div className={styles.replySection}>
                            {rating.staffReply ? (
                                <div className={styles.existingReply}>
                                    <div className={styles.replyHeader}>
                                        <span className={styles.replyLabel}>Phản hồi của nhân viên:</span>                                        <div className={styles.replyActions}>                                                <button onClick={() => {
                                            setEditingReplyId(rating.ratingId || rating.id);
                                            setEditReplyText(rating.staffReply || '');
                                        }}
                                            className={styles.editBtn}
                                        >
                                            ✏️
                                        </button>
                                            <button
                                                onClick={() => handleDeleteReply(rating.ratingId || rating.id)}
                                                className={styles.deleteBtn}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    {editingReplyId === (rating.ratingId || rating.id) ? (
                                        <div className={styles.editReplyForm}>
                                            <textarea
                                                value={editReplyText}
                                                onChange={(e) => setEditReplyText(e.target.value)}
                                                placeholder="Chỉnh sửa phản hồi..."
                                                rows="3"
                                            />
                                            <div className={styles.replyButtons}>                                                    <button
                                                onClick={() => handleUpdateReply(rating.ratingId || rating.id)}
                                                className={styles.saveBtn}
                                            >
                                                Lưu
                                            </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingReplyId(null);
                                                        setEditReplyText('');
                                                    }}
                                                    className={styles.cancelBtn}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (<div className={styles.replyContent}>
                                        <p>{rating.staffReply || 'Chưa có nội dung phản hồi'}</p>
                                        <div className={styles.replyMeta}>
                                            <span>{rating.repliedByName || 'Nhân viên'}</span>
                                            <span>{formatDate(rating.repliedAt)}</span>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            ) : replyingToId === (rating.ratingId || rating.id) ? (
                                <div className={styles.newReplyForm}>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Nhập phản hồi của bạn..."
                                        rows="3"
                                    />
                                    <div className={styles.replyButtons}>                                            <button
                                        onClick={() => handleReply(rating.ratingId || rating.id)}
                                        className={styles.saveBtn}
                                    >
                                        Gửi phản hồi
                                    </button>
                                        <button
                                            onClick={() => {
                                                setReplyingToId(null);
                                                setReplyText('');
                                            }}
                                            className={styles.cancelBtn}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            ) : (<button
                                onClick={() => setReplyingToId(rating.ratingId || rating.id)}
                                className={styles.replyBtn}
                            >
                                Phản hồi
                            </button>
                            )}
                        </div>
                    </div>
                ))
                )}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className={styles.loadMore}>
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className={styles.loadMoreBtn}
                    >
                        {loading ? 'Đang tải...' : 'Tải thêm'}
                    </button>                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedRatingDetail && (
                <div className={styles.modal} onClick={() => setShowDetailModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết đánh giá</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowDetailModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* User Info */}
                            <div className={styles.userSection}>
                                <h4>Thông tin người dùng</h4>
                                <div className={styles.userDetails}>
                                    {selectedRatingDetail.userAvatar && (
                                        <img
                                            src={`http://localhost:8080${selectedRatingDetail.userAvatar}`}
                                            alt="User Avatar"
                                            className={styles.modalAvatar}
                                        />
                                    )}
                                    <div>
                                        <p><strong>Tên:</strong> {selectedRatingDetail.userFullName}</p>
                                        <p><strong>ID:</strong> {selectedRatingDetail.userId}</p>
                                        <p><strong>Tên hiển thị:</strong> {selectedRatingDetail.maskedUserName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rating Info */}
                            <div className={styles.ratingSection}>
                                <h4>Thông tin đánh giá</h4>
                                <div className={styles.ratingDetails}>
                                    <p><strong>Điểm đánh giá:</strong> {selectedRatingDetail.rating}/5 ⭐</p>
                                    <p><strong>Loại:</strong> {selectedRatingDetail.targetType === 'CONSULTANT' ? 'Tư vấn' : 'Dịch vụ STI'}</p>
                                    <p><strong>Ngày tạo:</strong> {formatDate(selectedRatingDetail.createdAt)}</p>
                                    <p><strong>Bình luận:</strong></p>
                                    <div className={styles.commentBox}>
                                        {selectedRatingDetail.comment}
                                    </div>
                                </div>
                            </div>

                            {/* Service/Consultation Info */}
                            {selectedRatingDetail.targetType === 'STI_SERVICE' && selectedRatingDetail.stiTestId && (
                                <div className={styles.serviceSection}>
                                    <h4>Thông tin dịch vụ STI</h4>
                                    <div className={styles.serviceDetails}>
                                        <p><strong>ID Test:</strong> {selectedRatingDetail.stiTestId}</p>
                                        <p><strong>Target ID:</strong> {selectedRatingDetail.targetId}</p>
                                    </div>
                                </div>
                            )}

                            {selectedRatingDetail.targetType === 'CONSULTANT' && selectedRatingDetail.consultationId && (
                                <div className={styles.serviceSection}>
                                    <h4>Thông tin tư vấn</h4>
                                    <div className={styles.serviceDetails}>
                                        <p><strong>ID Consultation:</strong> {selectedRatingDetail.consultationId}</p>
                                        <p><strong>Target ID:</strong> {selectedRatingDetail.targetId}</p>
                                    </div>
                                </div>
                            )}

                            {/* Reply Info */}
                            {selectedRatingDetail.staffReply && (
                                <div className={styles.replySection}>
                                    <h4>Phản hồi của nhân viên</h4>
                                    <div className={styles.replyDetails}>
                                        <p><strong>Người phản hồi:</strong> {selectedRatingDetail.repliedByName}</p>
                                        <p><strong>Ngày phản hồi:</strong> {formatDate(selectedRatingDetail.repliedAt)}</p>
                                        <div className={styles.replyContent}>
                                            {selectedRatingDetail.staffReply}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerRating;
