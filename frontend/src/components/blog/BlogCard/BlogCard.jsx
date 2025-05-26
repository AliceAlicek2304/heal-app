import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './BlogCard.css';

const BlogCard = ({ post, truncateContent }) => {
    const navigate = useNavigate();

    const handleReadMore = () => {
        navigate(`/blog/${post.id}`);
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

    const getBlogStatusBadge = (status) => {
        const statusMap = {
            'CONFIRMED': { text: 'Đã duyệt', class: 'confirmed' },
            'PROCESSING': { text: 'Đang xử lý', class: 'processing' },
            'CANCELED': { text: 'Đã hủy', class: 'canceled' }
        };

        return statusMap[status] || { text: status, class: 'default' };
    };

    return (
        <article className="blog-card" onClick={handleReadMore}>
            <div className="blog-card-image">
                <img
                    src={authService.getBlogImageUrl(post.thumbnailImage)}
                    alt={post.title}
                    onError={(e) => {
                        e.target.src = authService.getBlogImageUrl('/img/blog/default.jpg');
                    }}
                />

                {/* Status badge - chỉ hiển thị nếu không phải CONFIRMED */}
                {post.status && post.status !== 'CONFIRMED' && (
                    <div className={`status-badge ${getBlogStatusBadge(post.status).class}`}>
                        {getBlogStatusBadge(post.status).text}
                    </div>
                )}
            </div>

            <div className="blog-card-content">
                <div className="blog-card-meta">
                    <span className="category">{post.categoryName}</span>
                    <span className="date">{formatDate(post.createdAt)}</span>
                </div>

                <h3 className="blog-card-title" title={post.title}>
                    {post.title}
                </h3>

                <p className="blog-card-excerpt">
                    {truncateContent(post.content, 120)}
                </p>

                <div className="blog-card-footer">
                    <div className="author-info">
                        <img
                            src={authService.getAvatarUrl(post.authorAvatar)}
                            alt={post.authorName}
                            className="author-avatar"
                            onError={(e) => {
                                e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                            }}
                        />
                        <span className="author-name">{post.authorName}</span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent the card click from triggering
                            handleReadMore();
                        }}
                        className="read-more-btn"
                        aria-label={`Đọc thêm bài viết: ${post.title}`}
                    >
                        Đọc thêm
                        <span className="arrow">→</span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export default BlogCard;