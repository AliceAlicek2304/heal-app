import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../../services/blogService';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import styles from './BlogHistory.module.css';

const BlogHistory = () => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

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
    }, [page]);

    const getStatusInfo = (status) => {
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
    };

    const handleViewPost = (postId) => {
        window.open(`/blog/${postId}`, '_blank');
        toast.info('Đang mở bài viết trong tab mới...');
    };

    const handleRetry = () => {
        toast.info('Đang tải lại dữ liệu...');
        fetchMyPosts();
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
                </button>
            </div>

            {posts.length === 0 ? (
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
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className={styles.mobileView}>
                        {posts.map(post => {
                            const statusInfo = getStatusInfo(post.status);
                            return (
                                <div key={post.id} className={styles.postCard}>
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.postTitle}>{post.title}</h3>
                                        <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                                            {statusInfo.text}
                                        </span>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.postDate}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                    <div className={styles.cardActions}>
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
                                    {posts.map(post => {
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
                                                        {statusInfo.text}
                                                    </span>
                                                </td>
                                                <td>
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
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(0)}
                                disabled={page === 0}
                                title="Trang đầu"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="11,17 6,12 11,7"></polyline>
                                    <polyline points="18,17 13,12 18,7"></polyline>
                                </svg>
                            </button>

                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0}
                                title="Trang trước"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15,18 9,12 15,6"></polyline>
                                </svg>
                            </button>

                            <div className={styles.pageNumbers}>
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i;
                                    } else if (page < 3) {
                                        pageNum = i;
                                    } else if (page >= totalPages - 3) {
                                        pageNum = totalPages - 5 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`${styles.pageNum} ${pageNum === page ? styles.active : ''}`}
                                            onClick={() => setPage(pageNum)}
                                        >
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                disabled={page === totalPages - 1}
                                title="Trang sau"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9,18 15,12 9,6"></polyline>
                                </svg>
                            </button>

                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(totalPages - 1)}
                                disabled={page === totalPages - 1}
                                title="Trang cuối"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="13,17 18,12 13,7"></polyline>
                                    <polyline points="6,17 11,12 6,7"></polyline>
                                </svg>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BlogHistory;