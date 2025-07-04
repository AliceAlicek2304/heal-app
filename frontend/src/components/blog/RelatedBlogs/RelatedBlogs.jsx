import React from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../../../services/blogService';
import { authService } from '../../../services/authService';
import { formatDate } from '../../../utils/dateUtils';
import styles from './RelatedBlogs.module.css';

const RelatedBlogs = ({ relatedPosts }) => {
    if (!relatedPosts || relatedPosts.length === 0) {
        return null;
    }

    return (
        <div className={styles.relatedBlogs}>
            <h3 className={styles.relatedTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"></path>
                </svg>
                Bài viết liên quan
            </h3>
            
            <div className={styles.relatedGrid}>
                {relatedPosts.map(post => (
                    <Link 
                        key={post.id} 
                        to={`/blog/${post.id}`} 
                        className={styles.relatedCard}
                    >
                        <div className={styles.relatedImage}>
                            <img
                                src={blogService.getBlogImageUrl(post.thumbnailImage)}
                                alt={post.title}
                                onError={(e) => {
                                    e.target.src = blogService.getBlogImageUrl('/img/blog/default.jpg');
                                }}
                            />
                        </div>
                        
                        <div className={styles.relatedContent}>
                            <h4 className={styles.relatedPostTitle}>
                                {post.title.length > 60 
                                    ? post.title.substring(0, 60) + '...' 
                                    : post.title
                                }
                            </h4>
                            
                            <div className={styles.relatedMeta}>
                                <span className={styles.relatedCategory}>
                                    {post.categoryName || "Danh mục đã bị xoá"}
                                </span>
                                <span className={styles.relatedDate}>
                                    {formatDate(post.createdAt, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            
                            <div className={styles.relatedAuthor}>
                                <img
                                    src={authService.getAvatarUrl(post.authorAvatar)}
                                    alt={post.authorName}
                                    className={styles.authorAvatar}
                                    onError={(e) => {
                                        e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                                    }}
                                />
                                <span className={styles.authorName}>{post.authorName}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RelatedBlogs; 