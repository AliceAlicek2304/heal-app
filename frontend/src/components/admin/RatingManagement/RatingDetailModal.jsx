import React from 'react';
import { FaStar, FaUser, FaCalendarAlt, FaTimes, FaCommentAlt, FaTag } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/dateUtils';
import Modal from '../../ui/Modal';
import styles from './RatingDetailModal.module.css';

const TARGET_TYPE_CONFIG = {
    CONSULTANT: { label: 'Tư vấn viên', color: '#6366f1' },
    STI_SERVICE: { label: 'Dịch vụ STI', color: '#10b981' },
    STI_PACKAGE: { label: 'Gói STI', color: '#f59e0b' }
};

const RatingDetailModal = ({ rating, onClose }) => {
    if (!rating) return null;

    const targetConfig = TARGET_TYPE_CONFIG[rating.targetType] || {
        label: rating.targetType,
        color: '#6b7280'
    };

    const renderStars = (ratingValue) => {
        return Array.from({ length: 5 }, (_, index) => (
            <FaStar
                key={index}
                className={`${styles.star} ${index < ratingValue ? styles.starFilled : styles.starEmpty}`}
            />
        ));
    };

    return (
        <Modal isOpen={true} onClose={onClose} size="medium">
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Chi tiết đánh giá #{rating.ratingId}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Rating Overview */}
                    <div className={styles.ratingOverview}>
                        <div className={styles.ratingDisplay}>
                            <div className={styles.stars}>
                                {renderStars(rating.rating)}
                            </div>
                            <span className={styles.ratingNumber}>
                                {rating.rating}/5 sao
                            </span>
                        </div>
                        <div className={styles.ratingMeta}>
                            <span className={styles.ratingDate}>
                                <FaCalendarAlt className={styles.metaIcon} />
                                {formatDateTime(rating.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaUser className={styles.sectionIcon} />
                            Thông tin khách hàng
                        </h3>                        <div className={styles.customerInfo}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Tên khách hàng:</span>
                                <span className={styles.infoValue}>{rating.userFullName}</span>
                            </div>
                            {rating.userEmail && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Email:</span>
                                    <span className={styles.infoValue}>{rating.userEmail}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Target Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaTag className={styles.sectionIcon} />
                            Đối tượng đánh giá
                        </h3>                        <div className={styles.targetInfo}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Tên:</span>
                                <span className={styles.infoValue}>{rating.targetName || `${rating.targetType} #${rating.targetId}`}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Loại:</span>
                                <span
                                    className={styles.targetTypeBadge}
                                    style={{ backgroundColor: targetConfig.color }}
                                >
                                    {targetConfig.label}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>ID:</span>
                                <span className={styles.infoValue}>#{rating.targetId}</span>
                            </div>
                        </div>
                    </div>                    {/* Comment */}
                    {rating.comment && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FaCommentAlt className={styles.sectionIcon} />
                                Bình luận
                            </h3>
                            <div className={styles.commentContent}>
                                <p>{rating.comment}</p>
                            </div>
                        </div>
                    )}

                    {/* Staff Reply */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaCommentAlt className={styles.sectionIcon} />
                            Phản hồi từ Staff
                        </h3>
                        {rating.staffReply ? (
                            <div className={styles.replyContent}>
                                <div className={styles.replyText}>
                                    <p>{rating.staffReply}</p>
                                </div>
                                <div className={styles.replyMeta}>
                                    <span className={styles.repliedBy}>
                                        Phản hồi bởi: <strong>{rating.repliedByName}</strong>
                                    </span>
                                    {rating.repliedAt && (
                                        <span className={styles.repliedAt}>
                                            vào {formatDateTime(rating.repliedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.noReplyMessage}>
                                <p>Chưa có phản hồi từ staff</p>
                            </div>
                        )}
                    </div>

                    {/* Additional Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Thông tin bổ sung</h3>
                        <div className={styles.additionalInfo}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>ID đánh giá:</span>
                                <span className={styles.infoValue}>#{rating.ratingId}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Ngày tạo:</span>
                                <span className={styles.infoValue}>{formatDateTime(rating.createdAt)}</span>
                            </div>
                            {rating.updatedAt && rating.updatedAt !== rating.createdAt && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Cập nhật lần cuối:</span>
                                    <span className={styles.infoValue}>{formatDateTime(rating.updatedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default RatingDetailModal;
