import React, { useState, useEffect } from 'react';
import { FaStar, FaEye, FaSearch, FaUser, FaCalendarAlt, FaCommentAlt } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import { ratingService } from '../../../services/ratingService';
import { formatDateTime } from '../../../utils/dateUtils';
import RatingDetailModal from './RatingDetailModal';
import Pagination from '../../common/Pagination/Pagination';
import styles from './RatingManagement.module.css';

const ITEMS_PER_PAGE = 15;

const RATING_FILTER_OPTIONS = [
    { value: '', label: 'Tất cả đánh giá' },
    { value: '5', label: '5 sao' },
    { value: '4', label: '4 sao' },
    { value: '3', label: '3 sao' },
    { value: '2', label: '2 sao' },
    { value: '1', label: '1 sao' }
];

const TARGET_TYPE_CONFIG = {
    CONSULTANT: { label: 'Tư vấn viên', color: '#6366f1' },
    STI_SERVICE: { label: 'Dịch vụ STI', color: '#10b981' },
    STI_PACKAGE: { label: 'Gói STI', color: '#f59e0b' }
};

const RatingManagement = () => {
    const [ratings, setRatings] = useState([]);
    const [filteredRatings, setFilteredRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRating, setSelectedRating] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRatingDetail, setSelectedRatingDetail] = useState(null);

    const { addToast } = useToast();

    useEffect(() => {
        loadRatings();
    }, []);

    useEffect(() => {
        filterRatings();
    }, [ratings, searchTerm, selectedRating]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredRatings.length / ITEMS_PER_PAGE));
        setCurrentPage(1);
    }, [filteredRatings]);

    const loadRatings = async () => {
        try {
            setLoading(true);
            const response = await ratingService.getAllRatingsForStaff(0, 1000); // Get all ratings

            if (response.success) {
                setRatings(response.data?.content || []);
            } else {
                addToast(response.message || 'Không thể tải danh sách đánh giá', 'error');
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            addToast('Lỗi khi tải danh sách đánh giá', 'error');
        } finally {
            setLoading(false);
        }
    }; const filterRatings = () => {
        let filtered = [...ratings];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(rating =>
                rating.userFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rating.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rating.comment?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Rating filter
        if (selectedRating) {
            filtered = filtered.filter(rating => rating.rating === parseInt(selectedRating));
        }

        // Sort by newest first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setFilteredRatings(filtered);
    };

    const getCurrentPageItems = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredRatings.slice(startIndex, endIndex);
    };

    const handleViewDetail = (rating) => {
        setSelectedRatingDetail(rating);
        setShowDetailModal(true);
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <FaStar
                key={index}
                className={`${styles.star} ${index < rating ? styles.starFilled : styles.starEmpty}`}
            />
        ));
    };

    const getTargetTypeConfig = (targetType) => {
        return TARGET_TYPE_CONFIG[targetType] || { label: targetType, color: '#6b7280' };
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải danh sách đánh giá...</p>
            </div>
        );
    }

    return (
        <div className={styles.ratingManagement}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <FaStar className={styles.titleIcon} />
                        Quản lý đánh giá
                    </h2>
                    <p className={styles.subtitle}>
                        Xem và quản lý tất cả đánh giá từ khách hàng
                    </p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{filteredRatings.length}</span>
                        <span className={styles.statLabel}>Tổng đánh giá</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên khách hàng, dịch vụ, nội dung..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className={styles.ratingFilter}
                >
                    {RATING_FILTER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Ratings Container */}
            <div className={styles.ratingsContainer}>
                {/* Table */}                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th>ID</th>
                                <th>Khách hàng</th>
                                <th>Đối tượng</th>
                                <th>Loại</th>
                                <th>Đánh giá</th>
                                <th>Bình luận</th>
                                <th>Phản hồi Staff</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {getCurrentPageItems().length === 0 ? (
                                <tr>
                                    <td colSpan="9" className={styles.emptyState}>
                                        <FaStar className={styles.emptyIcon} />
                                        <p>Không có đánh giá nào</p>
                                    </td>
                                </tr>
                            ) : (
                                getCurrentPageItems().map((rating) => {
                                    const targetConfig = getTargetTypeConfig(rating.targetType);
                                    return (
                                        <tr key={rating.ratingId}>
                                            <td className={styles.idCell}>#{rating.ratingId}</td>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <FaUser className={styles.userIcon} />
                                                    <span>{rating.userFullName}</span>
                                                </div>
                                            </td>
                                            <td className={styles.targetCell}>
                                                <span className={styles.targetName}>
                                                    {rating.targetName || `${rating.targetType} #${rating.targetId}`}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={styles.targetTypeBadge}
                                                    style={{ backgroundColor: targetConfig.color }}
                                                >
                                                    {targetConfig.label}
                                                </span>
                                            </td>
                                            <td className={styles.ratingCell}>
                                                <div className={styles.ratingDisplay}>
                                                    {renderStars(rating.rating)}
                                                    <span className={styles.ratingNumber}>
                                                        ({rating.rating}/5)
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.commentCell}>
                                                {rating.comment ? (
                                                    <div className={styles.commentPreview}>
                                                        <FaCommentAlt className={styles.commentIcon} />
                                                        <span className={styles.commentText}>
                                                            {rating.comment.length > 50
                                                                ? rating.comment.substring(0, 50) + '...'
                                                                : rating.comment
                                                            }
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={styles.noComment}>Không có</span>
                                                )}
                                            </td>
                                            <td className={styles.replyCell}>
                                                {rating.staffReply ? (
                                                    <div className={styles.replyPreview}>
                                                        <FaCommentAlt className={styles.replyIcon} />
                                                        <span className={styles.replyText}>
                                                            {rating.staffReply.length > 40
                                                                ? rating.staffReply.substring(0, 40) + '...'
                                                                : rating.staffReply
                                                            }
                                                        </span>
                                                        <div className={styles.replyInfo}>
                                                            <span>- {rating.repliedByName}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className={styles.noReply}>Chưa phản hồi</span>
                                                )}
                                            </td>
                                            <td className={styles.createdCell}>
                                                <div className={styles.dateInfo}>
                                                    <FaCalendarAlt className={styles.dateIcon} />
                                                    <span>{formatDateTime(rating.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.viewBtn}
                                                    onClick={() => handleViewDetail(rating)}
                                                    title="Xem chi tiết"
                                                >
                                                    <FaEye />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
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
            {showDetailModal && selectedRatingDetail && (
                <RatingDetailModal
                    rating={selectedRatingDetail}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedRatingDetail(null);
                    }}
                />
            )}
        </div>
    );
};

export default RatingManagement;
