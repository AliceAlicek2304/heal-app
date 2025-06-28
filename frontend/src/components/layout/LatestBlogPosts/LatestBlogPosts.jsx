import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { blogService } from "../../../services/blogService";
import { formatDate, getRelativeTime } from "../../../utils/dateUtils";
import styles from "./LatestBlogPosts.module.css";

const LatestBlogPosts = () => {
    const [blogPosts, setBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLatestBlogPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const result = await blogService.getLatestBlogPosts(3);
                
                if (result.success) {
                    setBlogPosts(result.data);
                } else {
                    throw new Error(result.message || 'Failed to fetch blog posts');
                }
            } catch (error) {
                console.error('Error fetching blog posts:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestBlogPosts();
    }, []);

    // Calculate time since last update
    const getTimeSinceUpdate = (updatedAt) => {
        if (!updatedAt) return "Vừa cập nhật";
        return getRelativeTime(updatedAt);
    };

    if (loading) {
        return (
            <section className={styles.latestBlogPosts}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>Bài viết <span className={styles.highlight}>mới nhất</span></h2>
                        <p className={styles.description}>Cập nhật kiến thức sức khỏe sinh sản từ các chuyên gia hàng đầu</p>
                    </div>
                    <div className={styles.loadingGrid}>
                        {[1, 2, 3].map((item) => (
                            <div key={item} className={styles.loadingCard}>
                                <div className={styles.loadingImage}></div>
                                <div className={styles.loadingContent}>
                                    <div className={styles.loadingTitle}></div>
                                    <div className={styles.loadingExcerpt}></div>
                                    <div className={styles.loadingMeta}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.latestBlogPosts}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>Bài viết <span className={styles.highlight}>mới nhất</span></h2>
                        <p className={styles.description}>Cập nhật kiến thức sức khỏe sinh sản từ các chuyên gia hàng đầu</p>
                    </div>
                    <div className={styles.errorContainer}>
                        <div className={styles.errorMessage}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            <h3>Không thể tải bài viết</h3>
                            <p>{error}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className={styles.retryButton}
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (blogPosts.length === 0) {
        return (
            <section className={styles.latestBlogPosts}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>Bài viết <span className={styles.highlight}>mới nhất</span></h2>
                        <p className={styles.description}>Cập nhật kiến thức sức khỏe sinh sản từ các chuyên gia hàng đầu</p>
                    </div>
                    <div className={styles.emptyContainer}>
                        <div className={styles.emptyMessage}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            <h3>Chưa có bài viết nào</h3>
                            <p>Hãy quay lại sau để xem các bài viết mới nhất</p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.latestBlogPosts}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Bài viết <span className={styles.highlight}>mới nhất</span></h2>
                    <p className={styles.description}>Cập nhật kiến thức sức khỏe sinh sản từ các chuyên gia hàng đầu</p>
                </div>

                <div className={styles.blogGrid}>
                    {blogPosts.map((post, index) => (
                        <article key={post.id} className={styles.blogCard} style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className={styles.imageContainer}>
                                <img 
                                    src={blogService.getBlogImageUrl(post.thumbnailImage)} 
                                    alt={post.title} 
                                    className={styles.blogImage}
                                    onError={(e) => {
                                        e.target.src = "/image/img1.jpg";
                                    }}
                                />
                                <div className={styles.categoryBadge}>{post.categoryName}</div>
                            </div>
                            
                            <div className={styles.blogContent}>
                                <div className={styles.blogMeta}>
                                    <span className={styles.author}>{post.authorName}</span>
                                    <span className={styles.date}>{formatDate(post.createdAt)}</span>
                                    <span className={styles.readTime}>{getTimeSinceUpdate(post.updatedAt)}</span>
                                </div>
                                
                                <h3 className={styles.blogTitle}>{post.title}</h3>
                                <p className={styles.blogExcerpt}>
                                    {post.content && post.content.length > 150 
                                        ? post.content.substring(0, 150) + '...' 
                                        : post.content}
                                </p>
                                
                                <Link to={`/blog/${post.id}`} className={styles.readMore}>
                                    Đọc thêm
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                        <polyline points="7,7 17,7 17,17"></polyline>
                                    </svg>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                <div className={styles.viewAllContainer}>
                    <Link to="/blog" className={styles.viewAllButton}>
                        Xem tất cả bài viết
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7,7 17,7 17,17"></polyline>
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default LatestBlogPosts; 