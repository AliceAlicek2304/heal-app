import React from 'react';
import { FaBlog, FaUser, FaCalendarAlt, FaTimes, FaTag, FaImage, FaEye } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatTextForDisplay } from '../../../utils/textUtils';
import Modal from '../../ui/Modal';
import styles from './BlogDetailModal.module.css';

const BlogDetailModal = ({ blog, onClose }) => {
    if (!blog) return null;

    const getStatusLabel = (status) => {
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

    return (
        <Modal isOpen={true} onClose={onClose} size="large">
            <div className={styles.modal}>
                <div className={styles.header}>                    <h2 className={styles.title}>
                    Chi tiết Blog #{blog.id}
                </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Blog Header */}
                    <div className={styles.blogHeader}>                        {blog.thumbnailImage && (
                        <div className={styles.thumbnailContainer}>
                            <img
                                src={`http://localhost:8080${blog.thumbnailImage}`}
                                alt={blog.title}
                                className={styles.thumbnail}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className={styles.noImage} style={{ display: 'none' }}>
                                <FaImage className={styles.noImageIcon} />
                                <span>Không có hình ảnh</span>
                            </div>
                        </div>
                    )}

                        <div className={styles.blogMeta}>
                            <h1 className={styles.blogTitle}>{blog.title}</h1>

                            <div className={styles.metaInfo}>
                                <div className={styles.metaItem}>
                                    <FaUser className={styles.metaIcon} />
                                    <span>{blog.authorName || 'Admin'}</span>
                                </div>

                                <div className={styles.metaItem}>
                                    <FaCalendarAlt className={styles.metaIcon} />
                                    <span>{formatDateTime(blog.createdAt)}</span>
                                </div>

                                {blog.categoryName && (
                                    <div className={styles.metaItem}>
                                        <FaTag className={styles.metaIcon} />
                                        <span className={styles.category}>{blog.categoryName}</span>
                                    </div>
                                )}                                {blog.status && (
                                    <div className={styles.metaItem}>
                                        <FaTag className={styles.metaIcon} />
                                        <span className={`${styles.statusBadge} ${styles[`status${blog.status}`]}`}>
                                            {getStatusLabel(blog.status)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>                    {/* Blog Content */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaBlog className={styles.sectionIcon} />
                            Nội dung chính
                        </h3>
                        <div className={styles.blogContent}>
                            <div
                                className={styles.contentText}
                                dangerouslySetInnerHTML={{ __html: formatTextForDisplay(blog.content) }}
                            />
                        </div>
                    </div>

                    {/* Blog Sections */}
                    {blog.sections && blog.sections.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FaImage className={styles.sectionIcon} />
                                Các phần bổ sung
                            </h3>
                            <div className={styles.sectionsContainer}>                                {blog.sections.map((section, index) => {
                                return (
                                    <div key={`section-${index}`} className={styles.blogSection}>
                                        {section.sectionTitle && (
                                            <h4 className={styles.sectionSubtitle}>
                                                {section.sectionTitle}
                                            </h4>
                                        )}

                                        {(section.sectionImageUrl || section.sectionImage) && (
                                            <div className={styles.sectionImageContainer}>
                                                <img
                                                    src={`http://localhost:8080${section.sectionImageUrl || section.sectionImage}`}
                                                    alt={section.sectionTitle || `Section ${index + 1}`}
                                                    className={styles.sectionImage}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className={styles.noImage} style={{ display: 'none' }}>
                                                    <FaImage className={styles.noImageIcon} />
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
                                );
                            })}
                            </div>
                        </div>)}

                    {/* Rejection Reason */}
                    {blog.rejectionReason && blog.status === 'CANCELED' && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FaTag className={styles.sectionIcon} />
                                Lý do từ chối
                            </h3>
                            <div className={styles.rejectionContent}>
                                <p>{blog.rejectionReason}</p>
                            </div>
                        </div>
                    )}

                    {/* Additional Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Thông tin bổ sung</h3>
                        <div className={styles.additionalInfo}>                            <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>ID bài viết:</span>
                            <span className={styles.infoValue}>#{blog.id}</span>
                        </div>

                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Ngày tạo:</span>
                                <span className={styles.infoValue}>{formatDateTime(blog.createdAt)}</span>
                            </div>

                            {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Cập nhật lần cuối:</span>
                                    <span className={styles.infoValue}>{formatDateTime(blog.updatedAt)}</span>
                                </div>
                            )}

                            {blog.status && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Trạng thái:</span>
                                    <span className={styles.infoValue}>{blog.status}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BlogDetailModal;
