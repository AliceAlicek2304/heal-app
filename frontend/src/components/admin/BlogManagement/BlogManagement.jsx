import React, { useState, useEffect } from 'react';
import { FaBlog, FaEye, FaSearch, FaUser, FaCalendarAlt, FaTag, FaImage } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import { blogService } from '../../../services/blogService';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatTextForDisplay } from '../../../utils/textUtils';
import BlogDetailModal from './BlogDetailModal';
import Pagination from '../../common/Pagination/Pagination';
import styles from './BlogManagement.module.css';

const ITEMS_PER_PAGE = 12;

const BlogManagement = () => {
    const [blogs, setBlogs] = useState([]);
    const [filteredBlogs, setFilteredBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);

    const { addToast } = useToast();

    useEffect(() => {
        loadBlogs();
    }, []);

    useEffect(() => {
        filterBlogs();
    }, [blogs, searchTerm]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE));
        setCurrentPage(1);
    }, [filteredBlogs]); const loadBlogs = async () => {
        try {
            setLoading(true);
            const response = await blogService.getAllBlogs({
                page: 0,
                size: 1000,
                sort: 'createdAt',
                direction: 'desc'
            });

            if (response.success) {
                setBlogs(response.data?.content || []);
            } else {
                addToast(response.message || 'Không thể tải danh sách blog', 'error');
            }
        } catch (error) {
            console.error('Error loading blogs:', error);
            addToast('Lỗi khi tải danh sách blog', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterBlogs = () => {
        let filtered = [...blogs];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(blog =>
                blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort by newest first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setFilteredBlogs(filtered);
    };

    const getCurrentPageItems = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredBlogs.slice(startIndex, endIndex);
    };

    const handleViewDetail = (blog) => {
        setSelectedBlog(blog);
        setShowDetailModal(true);
    }; const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }; const getStatusLabel = (status) => {
        switch (status) {
            case 'PROCESSING':
                return 'Đang xử lý';
            case 'CONFIRMED':
                return 'Đã duyệt';
            case 'CANCELED':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải danh sách blog...</p>
            </div>
        );
    }

    return (
        <div className={styles.blogManagement}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <FaBlog className={styles.titleIcon} />
                        Quản lý Blog
                    </h2>
                    <p className={styles.subtitle}>
                        Xem và quản lý tất cả bài viết blog
                    </p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{filteredBlogs.length}</span>
                        <span className={styles.statLabel}>Tổng bài viết</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề, nội dung, tác giả, danh mục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* Blogs Container */}
            <div className={styles.blogsContainer}>
                {getCurrentPageItems().length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaBlog className={styles.emptyIcon} />
                        <h3>Không có bài viết nào</h3>
                        <p>Hiện tại chưa có bài viết blog nào trong hệ thống.</p>
                    </div>
                ) : (
                    <div className={styles.blogsGrid}>                        {getCurrentPageItems().map((blog) => (
                        <div key={blog.id} className={styles.blogCard}>                                <div className={styles.blogImage}>
                            {blog.thumbnailImage ? (
                                <img
                                    src={`http://localhost:8080${blog.thumbnailImage}`}
                                    alt={blog.title}
                                    className={styles.thumbnail}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className={styles.noImage} style={{ display: blog.thumbnailImage ? 'none' : 'flex' }}>
                                <FaImage className={styles.noImageIcon} />
                            </div>
                        </div>

                            <div className={styles.blogContent}>                                <div className={styles.blogMeta}>
                                {blog.categoryName && (
                                    <span className={styles.category}>
                                        <FaTag className={styles.categoryIcon} />
                                        {blog.categoryName}
                                    </span>
                                )}
                                <span className={styles.date}>
                                    <FaCalendarAlt className={styles.dateIcon} />
                                    {formatDateTime(blog.createdAt)}
                                </span>
                                {blog.status && (
                                    <span className={`${styles.status} ${styles[`status${blog.status}`]}`}>
                                        {getStatusLabel(blog.status)}
                                    </span>
                                )}
                            </div>

                                <h3 className={styles.blogTitle}>
                                    {truncateText(blog.title, 80)}
                                </h3>

                                <p className={styles.blogExcerpt}>
                                    {truncateText(blog.content, 120)}
                                </p>

                                <div className={styles.blogFooter}>
                                    <div className={styles.author}>
                                        <FaUser className={styles.authorIcon} />
                                        <span>{blog.authorName || 'Admin'}</span>
                                    </div>

                                    <button
                                        className={styles.viewBtn}
                                        onClick={() => handleViewDetail(blog)}
                                        title="Xem chi tiết"
                                    >
                                        <FaEye />
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                )}
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
            {showDetailModal && selectedBlog && (
                <BlogDetailModal
                    blog={selectedBlog}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedBlog(null);
                    }}
                />
            )}
        </div>
    );
};

export default BlogManagement;
