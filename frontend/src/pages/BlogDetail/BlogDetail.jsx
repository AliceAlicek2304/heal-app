import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';
import { authService } from '../../services/authService';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import './BlogDetail.css';

const BlogDetail = () => {
    const { id } = useParams();
    const [blogPost, setBlogPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBlogPost();
    }, [id]);

    const fetchBlogPost = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await authService.getBlogPostById(id);

            if (response.success && response.data) {
                setBlogPost(response.data);
            } else {
                setError(response.message || 'Không thể tải nội dung bài viết');
            }
        } catch (error) {
            setError('Có lỗi xảy ra khi tải dữ liệu');
            console.error('Error fetching blog post:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="blog-detail-page">
                <Navbar />
                <div className="container">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="blog-detail-page">
                <Navbar />
                <div className="container">
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchBlogPost} className="retry-btn">
                            Thử lại
                        </button>
                        <Link to="/blog" className="back-btn">
                            Quay lại trang Blog
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!blogPost) {
        return (
            <div className="blog-detail-page">
                <Navbar />
                <div className="container">
                    <div className="not-found">
                        <h2>Không tìm thấy bài viết</h2>
                        <Link to="/blog" className="back-btn">
                            Quay lại trang Blog
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="blog-detail-page">
            <Navbar />
            <div className="container">
                {/* Breadcrumb */}
                <div className="breadcrumb">
                    <Link to="/">Trang chủ</Link> / <Link to="/blog">Blog</Link> / <span>{blogPost.title}</span>
                </div>

                {/* Blog Header */}
                <div className="blog-detail-header">
                    <h1 className="blog-detail-title">{blogPost.title}</h1>
                    <div className="blog-detail-meta">
                        <div className="blog-detail-category">
                            <span className="category-badge">{blogPost.categoryName}</span>
                        </div>
                        <div className="blog-detail-date">
                            <span className="date-icon">📅</span>
                            <span>{formatDate(blogPost.createdAt)}</span>
                            {blogPost.updatedAt && blogPost.updatedAt !== blogPost.createdAt && (
                                <span className="update-text">
                                    (Cập nhật: {formatDate(blogPost.updatedAt)})
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="blog-detail-author">
                        <img
                            src={authService.getAvatarUrl(blogPost.authorAvatar)}
                            alt={blogPost.authorName}
                            className="author-avatar"
                            onError={(e) => {
                                e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                            }}
                        />
                        <span className="author-name">Tác giả: {blogPost.authorName}</span>
                    </div>
                </div>

                {/* Featured Image */}
                <div className="blog-detail-image">
                    <img
                        src={authService.getBlogImageUrl(blogPost.thumbnailImage)}
                        alt={blogPost.title}
                        onError={(e) => {
                            e.target.src = authService.getBlogImageUrl('/img/blog/default.jpg');
                        }}
                    />
                </div>

                {/* Main Content */}
                <div className="blog-detail-content">
                    <div className="blog-main-content" dangerouslySetInnerHTML={{ __html: blogPost.content }} />
                </div>

                {/* Sections */}
                {blogPost.sections && blogPost.sections.length > 0 && (
                    <div className="blog-sections">
                        {blogPost.sections
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((section) => (
                                <div key={section.sectionId} className="blog-section">
                                    {section.sectionTitle && (
                                        <h2 className="section-title">{section.sectionTitle}</h2>
                                    )}

                                    {section.sectionImage && (
                                        <div className="section-image">
                                            <img
                                                src={authService.getBlogImageUrl(section.sectionImage)}
                                                alt={section.sectionTitle || "Section image"}
                                                onError={(e) => {
                                                    e.target.src = authService.getBlogImageUrl('/img/blog/default.jpg');
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div
                                        className="section-content"
                                        dangerouslySetInnerHTML={{ __html: section.sectionContent }}
                                    />
                                </div>
                            ))}
                    </div>
                )}

                {/* Navigation */}
                <div className="blog-detail-navigation">
                    <Link to="/blog" className="back-to-blog">
                        ← Quay lại danh sách bài viết
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;