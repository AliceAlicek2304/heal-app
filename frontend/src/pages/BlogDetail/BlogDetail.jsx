import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/dateUtils';
import { formatTextForDisplay } from '../../utils/textUtils';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import { authService } from '../../services/authService';
import { blogService } from '../../services/blogService';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './BlogDetail.module.css';

const BlogDetail = () => {
    const { id } = useParams();
    const toast = useToast();
    const [blogPost, setBlogPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlogPost();
    }, [id]); const fetchBlogPost = async () => {
        try {
            setLoading(true);

            const response = await blogService.getBlogPostById(id);

            if (response.success && response.data) {
                setBlogPost(response.data);
            } else {
                toast.error(response.message || 'Không thể tải nội dung bài viết');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
            console.error('Error fetching blog post:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.blogDetailPage}>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!blogPost) {
        return (
            <div className={styles.blogDetailPage}>
                <Navbar />
                <div className={styles.container}>
                    <div className={styles.notFound}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h2>Không tìm thấy bài viết</h2>
                        <p>Bài viết này không tồn tại hoặc đã bị xóa.</p>
                        <Link to="/blog" className={styles.btnOutlinePrimary}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Quay lại trang Blog
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.blogDetailPage}>
            <Navbar />
            <div className={styles.container}>
                {/* Breadcrumb */}
                <div className={styles.breadcrumb}>
                    <Link to="/">Trang chủ</Link>
                    <span className={styles.separator}>/</span>
                    <Link to="/blog">Blog</Link>
                    <span className={styles.separator}>/</span>
                    <span className={styles.currentPage}>{blogPost.title}</span>
                </div>

                {/* Blog Header */}
                <div className={styles.blogDetailHeader}>
                    <h1 className={styles.blogDetailTitle}>{blogPost.title}</h1>
                    <div className={styles.blogDetailMeta}>
                        <div className={styles.blogDetailCategory}>
                            <span className={styles.categoryBadge}>{blogPost.categoryName}</span>
                        </div>
                        <div className={styles.blogDetailDate}>
                            <svg className={styles.dateIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>                            <span>{formatDate(blogPost.createdAt, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                            {blogPost.updatedAt && blogPost.updatedAt !== blogPost.createdAt && (
                                <span className={styles.updateText}>
                                    (Cập nhật: {formatDate(blogPost.updatedAt, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })})
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.blogDetailAuthor}>
                        <img
                            src={authService.getAvatarUrl(blogPost.authorAvatar)}
                            alt={blogPost.authorName}
                            className={styles.authorAvatar}
                            onError={(e) => {
                                e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                            }}
                        />
                        <span className={styles.authorName}>Tác giả: {blogPost.authorName}</span>
                    </div>
                </div>                {/* Featured Image */}
                <div className={styles.blogDetailImage}>
                    <img
                        src={blogService.getBlogImageUrl(blogPost.thumbnailImage)}
                        alt={blogPost.title}
                        onError={(e) => {
                            e.target.src = blogService.getBlogImageUrl('/img/blog/default.jpg');
                        }}
                    />
                </div>                {/* Main Content */}
                <div className={styles.blogDetailContent}>
                    <div
                        className={styles.blogMainContent}
                        dangerouslySetInnerHTML={{ __html: formatTextForDisplay(blogPost.content) }}
                    />
                </div>

                {/* Sections */}
                {blogPost.sections && blogPost.sections.length > 0 && (
                    <div className={styles.blogSections}>
                        {blogPost.sections
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((section) => (
                                <div key={section.sectionId} className={styles.blogSection}>
                                    {section.sectionTitle && (
                                        <h2 className={styles.sectionTitle}>{section.sectionTitle}</h2>
                                    )}                                    {section.sectionImage && (
                                        <div className={styles.sectionImage}>
                                            <img
                                                src={blogService.getBlogImageUrl(section.sectionImage.replace(/^.*[\\/]/, ''))}
                                                alt={section.sectionTitle || "Section image"}
                                                onError={(e) => {
                                                    e.target.src = blogService.getBlogImageUrl('/img/blog/default.jpg');
                                                }}
                                            />
                                        </div>
                                    )}                                    <div
                                        className={styles.sectionContent}
                                        dangerouslySetInnerHTML={{ __html: formatTextForDisplay(section.sectionContent) }}
                                    />
                                </div>
                            ))}
                    </div>
                )}

                {/* Navigation */}
                <div className={styles.blogDetailNavigation}>
                    <Link to="/blog" className={styles.backToBlog}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Quay lại danh sách bài viết
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default BlogDetail;