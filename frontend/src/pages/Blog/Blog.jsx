import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import { blogService } from '../../services/blogService';
import BlogCard from '../../components/blog/BlogCard/BlogCard';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Pagination from '../../components/common/Pagination/Pagination';
import styles from './Blog.module.css';

const Blog = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [blogPosts, setBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0); const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(12);

    // Ref for smooth scroll targeting
    const blogGridRef = useRef(null);

    useEffect(() => {
        fetchBlogPosts();
    }, [currentPage]); const fetchBlogPosts = async () => {
        try {
            setLoading(true);

            // Use blogService.getBlogPosts for public blog listing
            const response = await blogService.getBlogPosts(currentPage, pageSize);

            if (response.success && response.data) {
                setBlogPosts(response.data.content || []);
                setTotalPages(response.data.totalPages || 0);
                setTotalElements(response.data.totalElements || 0);
            } else {
                toast.error(response.message || 'Không thể tải danh sách bài viết');
                setBlogPosts([]);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
            setBlogPosts([]);
            console.error('Error fetching blog posts:', error);
        } finally {
            setLoading(false);
        }
    }; const handlePageChange = (page) => {
        setCurrentPage(page);

        // Smooth scroll to blog grid with fallback
        if (blogGridRef.current) {
            blogGridRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // Fallback to scroll to top if ref is not available
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleCreateBlog = () => {
        navigate('/blog/create');
    };

    const truncateContent = (content, maxLength = 150) => {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    };

    if (loading && currentPage === 0) {
        return (
            <div className={styles.blogPage}>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.blogPage}>
            <Navbar />
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.blogHeader}>
                    <div className={styles.blogHeaderContent}>
                        <h1 className={styles.blogTitle}>Blog Y Tế</h1>
                        <p className={styles.blogSubtitle}>
                            Cập nhật những thông tin y tế mới nhất và hữu ích cho sức khỏe của bạn
                        </p>
                    </div>

                    {/* Create blog button */}
                    {user && (
                        <div className={styles.blogActions}>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleCreateBlog}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Tạo Bài Viết
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {totalElements > 0 && (
                    <div className={styles.blogStats}>
                        <p>Hiển thị {blogPosts.length} trong tổng số {totalElements} bài viết</p>
                    </div>
                )}                {/* Blog Grid */}
                {blogPosts.length > 0 ? (
                    <div ref={blogGridRef} className={styles.blogGrid}>
                        {blogPosts.map((post) => (
                            <BlogCard
                                key={post.id}
                                post={post}
                                truncateContent={truncateContent}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.noPosts}>
                        <div className={styles.noPostsContent}>
                            <div className={styles.emptyIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                            </div>
                            <h3>Chưa có bài viết nào</h3>
                            <p>Hiện tại chưa có bài viết nào được đăng tải.</p>
                            {user && (
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleCreateBlog}
                                >
                                    Tạo bài viết đầu tiên
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className={styles.paginationContainer}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

                {/* Loading overlay for page changes */}
                {loading && currentPage > 0 && (
                    <div className={styles.loadingOverlay}>
                        <LoadingSpinner />
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Blog;