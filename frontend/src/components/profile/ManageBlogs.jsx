import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import { formatTextForDisplay } from '../../utils/textUtils';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import Pagination from '../common/Pagination/Pagination';
import Modal from '../ui/Modal';
import { blogService } from '../../services/blogService';
import styles from './ManageBlogs.module.css';

const STATUS_CONFIG = {
    PROCESSING: {
        label: 'Đang xử lý',
        className: styles.statusProcessing,
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
        )
    },
    CONFIRMED: {
        label: 'Đã duyệt',
        className: styles.statusConfirmed,
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        )
    },
    CANCELED: {
        label: 'Đã hủy',
        className: styles.statusCanceled,
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        )
    }
};

const ManageBlogs = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [filteredBlogs, setFilteredBlogs] = useState([]);    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;
    const blogsListRef = useRef(null);

    const isStaff = user?.role === 'STAFF';
    const isAdmin = user?.role === 'ADMIN';

    // Handle page change with smooth scroll
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        if (blogsListRef.current) {
            blogsListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (isStaff || isAdmin) {
            fetchBlogs();
        }
    }, [currentPage, isStaff, isAdmin]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                size: pageSize,
                sort: 'createdAt',
                direction: 'DESC'
            };

            const response = await blogService.getAllBlogs(params);

            if (response.success && response.data) {
                const blogsData = response.data.content || [];
                setBlogs(blogsData);
                setTotalPages(response.data.totalPages || 0);
                setTotalElements(response.data.totalElements || 0);
            } else {
                toast.error(response.message || 'Không thể tải danh sách blog');
                setBlogs([]);
                setTotalPages(0);
                setTotalElements(0);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
            setBlogs([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    // Filter blogs based on selected filters
    const applyFilters = (blogsToFilter, currentFilters) => {
        let filtered = [...blogsToFilter];

        // Text search filter
        if (currentFilters.searchText) {
            const searchLower = currentFilters.searchText.toLowerCase();
            filtered = filtered.filter(blog => {
                return (
                    blog.id?.toString().includes(searchLower) ||
                    blog.title?.toLowerCase().includes(searchLower) ||
                    blog.content?.toLowerCase().includes(searchLower) ||
                    blog.authorName?.toLowerCase().includes(searchLower) ||
                    blog.categoryName?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Status filter
        if (currentFilters.status) {
            filtered = filtered.filter(blog => blog.status === currentFilters.status);
        }

        // Date range filter
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            filtered = filtered.filter(blog => {
                let blogDate;

                // Handle different date formats from backend
                const rawDate = blog.createdAt;
                if (Array.isArray(rawDate)) {
                    // Array format: [year, month, day, hour, minute, second, nanosecond]
                    // Note: month is 1-based in array, but Date constructor expects 0-based
                    blogDate = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
                } else if (typeof rawDate === 'string' || rawDate instanceof Date) {
                    blogDate = new Date(rawDate);
                } else {
                    return false;
                }

                if (currentFilters.dateFrom) {
                    const fromDate = new Date(currentFilters.dateFrom);
                    if (blogDate < fromDate) return false;
                }

                if (currentFilters.dateTo) {
                    const toDate = new Date(currentFilters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (blogDate > toDate) return false;
                }

                return true;
            });
        }

        return filtered;
    };    // Effect to apply filters when blogs or filters change
    useEffect(() => {
        const filtered = applyFilters(blogs, filters);
        setFilteredBlogs(filtered);
        setCurrentPage(0); // Reset to first page when filters change
    }, [blogs, filters]);

    // Calculate client-side pagination for filtered results
    const itemsPerPage = 10;
    const totalFilteredPages = Math.ceil(filteredBlogs.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredBlogs.slice(startIndex, endIndex);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleUpdateStatus = async () => {
        if (!selectedBlog || !newStatus) return;

        if (newStatus === 'CANCELED' && !rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setActionLoading(true);
            const response = await blogService.updateBlogStatus(selectedBlog.id, {
                status: newStatus,
                rejectionReason: newStatus === 'CANCELED' ? rejectionReason : null
            });

            if (response.success) {
                toast.success('Cập nhật trạng thái thành công');
                setShowStatusModal(false);
                setSelectedBlog(null);
                setNewStatus('');
                setRejectionReason('');
                fetchBlogs();
            } else {
                toast.error(response.message || 'Không thể cập nhật trạng thái');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBlog = async () => {
        if (!selectedBlog) return;

        try {
            setActionLoading(true);
            const response = await blogService.deleteBlog(selectedBlog.id);

            if (response.success) {
                toast.success('Xóa blog thành công');
                setShowDeleteModal(false);
                setSelectedBlog(null);
                fetchBlogs();
            } else {
                toast.error(response.message || 'Không thể xóa blog');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi xóa blog');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetail = (blog) => {
        setSelectedBlog(blog);
        setShowDetailModal(true);
    };

    const handleOpenStatusModal = (blog) => {
        setSelectedBlog(blog);
        setNewStatus('');
        setRejectionReason('');
        setShowStatusModal(true);
    };

    const handleOpenDeleteModal = (blog) => {
        setSelectedBlog(blog);
        setShowDeleteModal(true);
    };

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || {
            label: status,
            className: styles.statusDefault,
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            )
        };
    };

    const handleRetry = () => {
        toast.info('Đang tải lại dữ liệu...');
        fetchBlogs();
    };

    const handleModalBackdropClick = (e, closeModal) => {
        if (e.target.classList.contains(styles.modalBackdrop)) {
            closeModal();
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải danh sách blog...</p>
            </div>
        );
    }

    if (!isStaff && !isAdmin) {
        return (
            <div className={styles.accessDenied}>
                <h3>Truy cập bị từ chối</h3>
                <p>Bạn không có quyền truy cập trang này.</p>
            </div>
        );
    }

    return (
        <div className={styles.manageBlogs}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                        </svg>
                        Quản lý Blog
                    </h2>
                    <p className={styles.subtitle}>
                        Duyệt và quản lý các bài viết blog từ người dùng
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
                </button>
            </div>

            {/* Advanced Filter Component */}
            <AdvancedFilter
                onFilterChange={handleFilterChange}
                statusOptions={Object.keys(STATUS_CONFIG).map(key => ({
                    value: key,
                    label: STATUS_CONFIG[key].label
                }))}
                placeholder="Tìm kiếm theo tiêu đề, nội dung, tác giả, danh mục..."
                showDateFilter={true}
                showStatusFilter={true}
            />

            {blogs.length > 0 && (
                <div className={styles.statsInfo}>
                    Hiển thị: {filteredBlogs.length}/{blogs.length} blog
                </div>
            )}            {/* Content */}
            <div className={styles.content}>
                {filteredBlogs.length > 0 ? (
                    <>
                        {/* Mobile Card View */}
                        <div ref={blogsListRef} className={styles.mobileView}>
                            {currentItems.map(blog => {
                                const statusConfig = getStatusConfig(blog.status);
                                return (
                                    <div key={blog.id} className={styles.blogCard}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.blogInfo}>
                                                <h3 className={styles.blogTitle}>
                                                    {blog.title}
                                                </h3>
                                                <div className={styles.blogMeta}>
                                                    <span className={styles.authorName}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                        {blog.authorName}
                                                    </span>
                                                    <span className={styles.categoryName}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                                        </svg>
                                                        {blog.categoryName}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`${styles.statusBadge} ${statusConfig.className}`}>
                                                {statusConfig.icon}
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <span className={styles.dateInfo}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                {formatDate(blog.createdAt)}
                                            </span>

                                            <div className={styles.cardActions}>
                                                {blog.status === 'PROCESSING' && (
                                                    <button
                                                        className={styles.approveBtn}
                                                        onClick={() => handleOpenStatusModal(blog)}
                                                        title="Duyệt blog"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="20,6 9,17 4,12"></polyline>
                                                        </svg>
                                                        Duyệt
                                                    </button>
                                                )}

                                                <button
                                                    className={styles.viewBtn}
                                                    onClick={() => handleViewDetail(blog)}
                                                    title="Xem chi tiết"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                    Xem
                                                </button>

                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleOpenDeleteModal(blog)}
                                                    title="Xóa blog"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3,6 5,6 21,6"></polyline>
                                                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className={styles.desktopView}>
                            <div className={styles.tableContainer}>
                                <table className={styles.blogsTable}>
                                    <thead>
                                        <tr>
                                            <th>Tiêu đề</th>
                                            <th>Tác giả</th>
                                            <th>Danh mục</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày tạo</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map(blog => {
                                            const statusConfig = getStatusConfig(blog.status);
                                            return (
                                                <tr key={blog.id}>
                                                    <td className={styles.titleCell}>
                                                        <div className={styles.titleContainer}>
                                                            {blog.title.length > 60
                                                                ? blog.title.substring(0, 60) + '...'
                                                                : blog.title
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className={styles.authorCell}>
                                                        <div className={styles.authorInfo}>
                                                            <span className={styles.authorNameTable}>
                                                                {blog.authorName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className={styles.categoryCell}>
                                                        <span className={styles.categoryTag}>
                                                            {blog.categoryName}
                                                        </span>
                                                    </td>
                                                    <td className={styles.statusCell}>
                                                        <span className={`${styles.statusBadge} ${statusConfig.className}`}>
                                                            {statusConfig.icon}
                                                            {statusConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className={styles.dateCell}>
                                                        {formatDate(blog.createdAt)}
                                                    </td>
                                                    <td className={styles.actionsCell}>
                                                        <div className={styles.actionButtons}>
                                                            {blog.status === 'PROCESSING' && (
                                                                <button
                                                                    className={styles.actionBtn}
                                                                    onClick={() => handleOpenStatusModal(blog)}
                                                                    title="Duyệt blog"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="20,6 9,17 4,12"></polyline>
                                                                    </svg>
                                                                    Duyệt
                                                                </button>
                                                            )}

                                                            <button
                                                                className={`${styles.actionBtn} ${styles.infoBtn}`}
                                                                onClick={() => handleViewDetail(blog)}
                                                                title="Xem chi tiết"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                </svg>
                                                                Xem
                                                            </button>

                                                            <button
                                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                                onClick={() => handleOpenDeleteModal(blog)}
                                                                title="Xóa blog"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3,6 5,6 21,6"></polyline>
                                                                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                                </svg>
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10,9 9,9 8,9"></polyline>
                            </svg>
                        </div>
                        <h3>Không có blog nào</h3>
                        <p>
                            {blogs.length === 0
                                ? 'Chưa có blog nào được tạo.'
                                : 'Không có blog nào phù hợp với bộ lọc hiện tại.'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedBlog && (
                <div className={styles.modalBackdrop} onClick={(e) => handleModalBackdropClick(e, () => setShowDetailModal(false))}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết blog #{selectedBlog.id}</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowDetailModal(false)}
                                aria-label="Đóng"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>                        <div className={styles.modalBody}>
                            {/* Blog Header with Thumbnail */}
                            {selectedBlog.thumbnailImage && (
                                <div className={styles.blogHeader}>
                                    <div className={styles.thumbnailContainer}>
                                        <img
                                            src={`http://localhost:8080${selectedBlog.thumbnailImage}`}
                                            alt={selectedBlog.title}
                                            className={styles.thumbnail}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div className={styles.noImage} style={{ display: 'none' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21,15 16,10 5,21"></polyline>
                                            </svg>
                                            <span>Không có hình ảnh</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.detailSection}>
                                <h4>Thông tin blog</h4>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Tiêu đề:</span>
                                        <span className={styles.value}>{selectedBlog.title}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Tác giả:</span>
                                        <span className={styles.value}>{selectedBlog.authorName}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Danh mục:</span>
                                        <span className={styles.value}>{selectedBlog.categoryName}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Trạng thái:</span>
                                        <span className={`${styles.statusBadge} ${getStatusConfig(selectedBlog.status).className}`}>
                                            {getStatusConfig(selectedBlog.status).icon}
                                            {getStatusConfig(selectedBlog.status).label}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Ngày tạo:</span>
                                        <span className={styles.value}>{formatDateTime(selectedBlog.createdAt)}</span>
                                    </div>
                                    {selectedBlog.updatedAt && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.label}>Ngày cập nhật:</span>
                                            <span className={styles.value}>{formatDateTime(selectedBlog.updatedAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.contentSection}>
                                <h4>Nội dung chính</h4>
                                <div className={styles.blogContent}>
                                    <div
                                        className={styles.contentText}
                                        dangerouslySetInnerHTML={{ __html: formatTextForDisplay(selectedBlog.content) }}
                                    />
                                </div>
                            </div>

                            {/* Blog Sections */}
                            {selectedBlog.sections && selectedBlog.sections.length > 0 && (
                                <div className={styles.sectionsSection}>
                                    <h4>Các phần bổ sung</h4>
                                    <div className={styles.sectionsContainer}>
                                        {selectedBlog.sections.map((section, index) => (
                                            <div key={`section-${index}`} className={styles.blogSection}>
                                                {section.sectionTitle && (
                                                    <h5 className={styles.sectionSubtitle}>
                                                        {section.sectionTitle}
                                                    </h5>
                                                )}

                                                {(section.sectionImageUrl || section.sectionImage) && (
                                                    <div className={styles.sectionImageContainer}>
                                                        <img
                                                            src={section.sectionImageUrl || section.sectionImage}
                                                            alt={section.sectionTitle || `Section ${index + 1}`}
                                                            className={styles.sectionImage}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className={styles.noImage} style={{ display: 'none' }}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                                <polyline points="21,15 16,10 5,21"></polyline>
                                                            </svg>
                                                            <span>Không có hình ảnh</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {section.sectionContent && (
                                                    <div
                                                        className={styles.sectionContent}
                                                        dangerouslySetInnerHTML={{ __html: formatTextForDisplay(section.sectionContent) }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedBlog.rejectionReason && (
                                <div className={styles.rejectionSection}>
                                    <h4>Lý do từ chối</h4>
                                    <div className={styles.rejectionReason}>
                                        {selectedBlog.rejectionReason}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            {selectedBlog.status === 'PROCESSING' && (
                                <button
                                    className={`${styles.modalBtn} ${styles.successBtn}`}
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleOpenStatusModal(selectedBlog);
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                    Duyệt blog
                                </button>
                            )}
                            <button
                                className={`${styles.modalBtn} ${styles.secondaryBtn}`}
                                onClick={() => setShowDetailModal(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && selectedBlog && (
                <div className={styles.modalBackdrop} onClick={(e) => handleModalBackdropClick(e, () => setShowStatusModal(false))}>
                    <div className={`${styles.modal} ${styles.statusModal}`}>
                        <div className={styles.modalHeader}>
                            <h3>Cập nhật trạng thái blog</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowStatusModal(false)}
                                aria-label="Đóng"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.blogSummary}>
                                <h4>Blog: {selectedBlog.title}</h4>
                                <div className={styles.blogMeta}>
                                    <span>Tác giả: <strong>{selectedBlog.authorName}</strong></span>
                                    <span>Danh mục: <strong>{selectedBlog.categoryName}</strong></span>
                                </div>
                            </div>

                            <div className={styles.statusForm}>
                                <h4>Chọn trạng thái mới:</h4>
                                <div className={styles.statusOptions}>
                                    <label className={styles.radioOption}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="CONFIRMED"
                                            checked={newStatus === 'CONFIRMED'}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                        />
                                        <span className={styles.radioLabel}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            Duyệt blog
                                        </span>
                                    </label>
                                    <label className={styles.radioOption}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="CANCELED"
                                            checked={newStatus === 'CANCELED'}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                        />
                                        <span className={styles.radioLabel}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                            </svg>
                                            Từ chối blog
                                        </span>
                                    </label>
                                </div>

                                {newStatus === 'CANCELED' && (
                                    <div className={styles.rejectionReasonForm}>
                                        <label>Lý do từ chối:</label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Nhập lý do từ chối blog..."
                                            rows="4"
                                            className={styles.rejectionTextarea}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.modalBtn} ${styles.successBtn}`}
                                onClick={handleUpdateStatus}
                                disabled={actionLoading || !newStatus || (newStatus === 'CANCELED' && !rejectionReason.trim())}
                            >
                                {actionLoading ? (
                                    <>
                                        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                        </svg>
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20,6 9,17 4,12"></polyline>
                                        </svg>
                                        Cập nhật trạng thái
                                    </>
                                )}
                            </button>
                            <button
                                className={`${styles.modalBtn} ${styles.secondaryBtn}`}
                                onClick={() => setShowStatusModal(false)}
                                disabled={actionLoading}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedBlog && (
                <div className={styles.modalBackdrop} onClick={(e) => handleModalBackdropClick(e, () => setShowDeleteModal(false))}>
                    <div className={`${styles.modal} ${styles.deleteModal}`}>
                        <div className={styles.modalHeader}>
                            <h3>Xác nhận xóa blog</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowDeleteModal(false)}
                                aria-label="Đóng"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.deleteWarning}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <h4>Bạn có chắc chắn muốn xóa blog này?</h4>
                                <p>
                                    <strong>"{selectedBlog.title}"</strong><br />
                                    Hành động này không thể hoàn tác.
                                </p>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.modalBtn} ${styles.dangerBtn}`}
                                onClick={handleDeleteBlog}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <>
                                        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                        </svg>
                                        Đang xóa...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3,6 5,6 21,6"></polyline>
                                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                        </svg>
                                        Xóa blog
                                    </>
                                )}
                            </button>
                            <button
                                className={`${styles.modalBtn} ${styles.secondaryBtn}`}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={actionLoading}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageBlogs;
