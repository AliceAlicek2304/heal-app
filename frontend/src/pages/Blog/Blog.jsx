import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar/Navbar';
import { authService } from '../../services/authService';
import BlogCard from '../../components/blog/BlogCard/BlogCard';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Pagination from '../../components/common/Pagination/Pagination';
import './Blog.css';

const Blog = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [blogPosts, setBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(12);

    useEffect(() => {
        fetchBlogPosts();
    }, [currentPage]);

    const fetchBlogPosts = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await authService.getBlogPosts(currentPage, pageSize);

            if (response.success && response.data) {
                setBlogPosts(response.data.content || []);
                setTotalPages(response.data.totalPages || 0);
                setTotalElements(response.data.totalElements || 0);
            } else {
                setError(response.message || 'Không thể tải danh sách bài viết');
                setBlogPosts([]);
            }
        } catch (error) {
            setError('Có lỗi xảy ra khi tải dữ liệu');
            setBlogPosts([]);
            console.error('Error fetching blog posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="blog-page">
                <div className="container">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className="blog-page">
            <Navbar />
            <div className="container">
                {/* Header */}
                <div className="blog-header">
                    <div className="blog-header-content">
                        <h1 className="blog-title">Blog Y Tế</h1>
                        <p className="blog-subtitle">
                            Cập nhật những thông tin y tế mới nhất và hữu ích cho sức khỏe của bạn
                        </p>
                    </div>

                    {/* Nút tạo blog - di chuyển xuống dưới header */}
                    {user && (
                        <div className="blog-actions">
                            <button
                                className="btn btn-primary create-blog-btn"
                                onClick={handleCreateBlog}
                            >
                                <i className="fas fa-plus"></i>
                                Tạo Bài Viết
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {totalElements > 0 && (
                    <div className="blog-stats">
                        <p>Hiển thị {blogPosts.length} trong tổng số {totalElements} bài viết</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchBlogPosts} className="retry-btn">
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Blog Grid */}
                {!error && (
                    <>
                        {blogPosts.length > 0 ? (
                            <div className="blog-grid">
                                {blogPosts.map((post) => (
                                    <BlogCard
                                        key={post.id}
                                        post={post}
                                        truncateContent={truncateContent}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="no-posts">
                                <div className="no-posts-content">
                                    <h3>Chưa có bài viết nào</h3>
                                    <p>Hiện tại chưa có bài viết nào được đăng tải.</p>
                                    {user && (
                                        <button
                                            className="btn btn-primary"
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
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}

                {/* Loading overlay for page changes */}
                {loading && currentPage > 0 && (
                    <div className="loading-overlay">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Blog;