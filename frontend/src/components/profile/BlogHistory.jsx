import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { blogService } from '../../services/blogService';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import Pagination from '../common/Pagination/Pagination';
import { useToast } from '../../contexts/ToastContext';
import styles from './BlogHistory.module.css';

const BlogHistory = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [filteredPosts, setFilteredPosts] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const postsListRef = useRef(null);

    const toast = useToast();

    // Handle page change with smooth scroll
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        if (postsListRef.current) {
            postsListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const fetchMyPosts = async () => {
        setLoading(true);
        try {
            const resp = await blogService.getMyPosts({ page, size: 10 });
            if (resp.success && resp.data) {
                setPosts(resp.data.content || []);
                setTotalPages(resp.data.totalPages || 0);
            } else {
                toast.error(resp.message || 'Không thể tải bài viết');
            }
        } catch (err) {
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyPosts();
    }, [page]); const getStatusInfo = (status) => {
        switch (status) {
            case 'PROCESSING':
                return { text: 'Đang xử lý', className: styles.statusProcessing };
            case 'CONFIRMED':
                return { text: 'Đã duyệt', className: styles.statusConfirmed };
            case 'CANCELED':
                return { text: 'Đã hủy', className: styles.statusCanceled };
            default:
                return { text: status, className: styles.statusDefault };
        }
    }; const handleViewPost = (postId) => {
        window.open(`/blog/${postId}`, '_blank');
        toast.info('Đang mở bài viết trong tab mới...');
    };

    const handleEditPost = (postId) => {
        navigate(`/blog/edit/${postId}`);
    };

    const handleRetry = () => {
        toast.info('Đang tải lại dữ liệu...');
        fetchMyPosts();
    };// Filter posts based on selected filters
    const applyFilters = (postsToFilter, currentFilters) => {
        let filtered = [...postsToFilter];

        // Text search filter
        if (currentFilters.searchText) {
            const searchLower = currentFilters.searchText.toLowerCase();
            filtered = filtered.filter(post => {
                return (
                    post.title?.toLowerCase().includes(searchLower) ||
                    post.content?.toLowerCase().includes(searchLower) ||
                    post.summary?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Status filter
        if (currentFilters.status) {
            filtered = filtered.filter(post => post.status === currentFilters.status);
        }

        // Date range filter
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            filtered = filtered.filter(post => {
                let postDate;

                // Handle different date formats from backend
                const rawDate = post.publishedAt || post.createdAt;
                if (Array.isArray(rawDate)) {
                    // Array format: [year, month, day, hour, minute, second, nanosecond]
                    // Note: month is 1-based in array, but Date constructor expects 0-based
                    postDate = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
                } else if (typeof rawDate === 'string' || rawDate instanceof Date) {
                    postDate = new Date(rawDate);
                } else {
                    return false;
                }

                if (currentFilters.dateFrom) {
                    const fromDate = new Date(currentFilters.dateFrom);
                    if (postDate < fromDate) return false;
                }

                if (currentFilters.dateTo) {
                    const toDate = new Date(currentFilters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (postDate > toDate) return false;
                }

                return true;
            });
        }
        return filtered;
    };    // Effect to apply filters when posts or filters change
    useEffect(() => {
        const filtered = applyFilters(posts, filters);
        setFilteredPosts(filtered);
        setCurrentPage(0); // Reset to first page when filters change
    }, [posts, filters]);

    // Calculate client-side pagination for filtered results
    const itemsPerPage = 10;
    const totalFilteredPages = Math.ceil(filteredPosts.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredPosts.slice(startIndex, endIndex);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải lịch sử bài viết...</p>
            </div>
        );
    }

    return (
        <div className={styles.blogHistory}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        Lịch sử bài viết
                    </h2>
                    <p className={styles.subtitle}>
                        Quản lý và theo dõi các bài viết bạn đã đăng tải
                    </p>
                </div>
                <button className={styles.refreshBtn} onClick={handleRetry} title="Làm mới dữ liệu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <polyline points="1,20 1,14 7,14"></polyline>
                        <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,4.36L23,14"></path>
                    </svg>
                </button>            </div>            {/* Advanced Filter Component */}            <AdvancedFilter
                onFilterChange={handleFilterChange}
                statusOptions={[
                    { value: 'PROCESSING', label: 'Đang xử lý' },
                    { value: 'CONFIRMED', label: 'Đã duyệt' },
                    { value: 'CANCELED', label: 'Đã hủy' }
                ]}
                placeholder="Tìm kiếm theo tiêu đề, nội dung bài viết..."
                showDateFilter={true}
                showStatusFilter={true}
            />

            {posts.length > 0 && (
                <div className={styles.statsInfo}>
                    Hiển thị: {filteredPosts.length}/{posts.length} bài viết
                </div>
            )}

            {filteredPosts.length === 0 ? (
                posts.length > 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </div>
                        <h3>Không tìm thấy kết quả</h3>
                        <p>Không có bài viết nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh tiêu chí tìm kiếm.</p>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </div>
                        <h3>Chưa có bài viết nào</h3>
                        <p>Bạn chưa tạo bài viết nào. Hãy bắt đầu chia sẻ kiến thức của mình!</p>
                        <Link to="/blog/create" className={styles.createBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Tạo bài viết đầu tiên
                        </Link>
                    </div>
                )) : (
                <>
                    {/* Mobile Card View */}
                    <div ref={postsListRef} className={styles.mobileView}>
                        {currentItems.map(post => {
                            const statusInfo = getStatusInfo(post.status);
                            return (
                                <div key={post.id} className={styles.postCard}>
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.postTitle}>{post.title}</h3>
                                        <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                                            {statusInfo.text}
                                        </span>
                                    </div>
                                    {post.thumbnailImage && (
                                        <div className={styles.thumbnailWrapper}>
                                            <img
                                                src={require('../../services/blogService').blogService.getBlogImageUrl(post.thumbnailImage.replace(/^.*[\\/]/, ''))}
                                                alt={post.title}
                                                className={styles.thumbnail}
                                                onError={(e) => {
                                                    e.target.src = require('../../services/blogService').blogService.getBlogImageUrl('/img/blog/default.jpg');
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className={styles.cardMeta}>
                                        <span className={styles.postDate}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                    <div className={styles.cardActions}>
                                        {post.status !== 'CONFIRMED' && (
                                            <button
                                                className={styles.editBtn}
                                                onClick={() => handleEditPost(post.id)}
                                                title="Chỉnh sửa bài viết"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                                Sửa
                                            </button>
                                        )}
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleViewPost(post.id)}
                                            title="Xem chi tiết bài viết"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                            Xem
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table View */}
                    <div className={styles.desktopView}>
                        <div className={styles.tableContainer}>
                            <table className={styles.historyTable}>
                                <thead>
                                    <tr>
                                        <th>Tiêu đề</th>
                                        <th>Ngày tạo</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map(post => {
                                        const statusInfo = getStatusInfo(post.status);
                                        return (
                                            <tr key={post.id}>
                                                <td>
                                                    <div className={styles.titleCell}>
                                                        <span className={styles.postTitleTable}>{post.title}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={styles.dateCell}>
                                                        {formatDate(post.createdAt)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                                                        {statusInfo.text}                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        {post.status !== 'CONFIRMED' && (
                                                            <button
                                                                className={styles.editBtnTable}
                                                                onClick={() => handleEditPost(post.id)}
                                                                title="Chỉnh sửa bài viết"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                                Sửa
                                                            </button>
                                                        )}
                                                        <button
                                                            className={styles.actionBtn}
                                                            onClick={() => handleViewPost(post.id)}
                                                            title="Xem chi tiết bài viết"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                            Xem
                                                        </button>
                                                    </div>                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>                    {/* Pagination */}
                    {totalFilteredPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalFilteredPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default BlogHistory;