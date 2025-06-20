import React from 'react';
import { FaUser, FaUserMd, FaCalendarAlt, FaClock, FaComment, FaLink, FaTimes } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/dateUtils';
import Modal from '../../ui/Modal';
import styles from './ConsultationDetailModal.module.css';

const STATUS_CONFIG = {
    PENDING: { label: 'Chờ xử lý', color: '#f59e0b' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#10b981' },
    COMPLETED: { label: 'Hoàn thành', color: '#6366f1' },
    CANCELLED: { label: 'Đã hủy', color: '#ef4444' }
};

const ConsultationDetailModal = ({ consultation, onClose }) => {
    if (!consultation) return null;

    const statusConfig = STATUS_CONFIG[consultation.status] || { label: consultation.status, color: '#6b7280' }; return (
        <Modal isOpen={true} onClose={onClose} size="large">
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Chi tiết cuộc tư vấn #{consultation.consultationId}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Status */}
                    <div className={styles.statusSection}>
                        <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: statusConfig.color }}
                        >
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Participants */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Thông tin người tham gia</h3>
                        <div className={styles.participants}>
                            <div className={styles.participant}>
                                <div className={styles.participantIcon}>
                                    <FaUser />
                                </div>
                                <div className={styles.participantInfo}>
                                    <h4>Khách hàng</h4>
                                    <p>{consultation.customerName}</p>
                                    {consultation.customerEmail && (
                                        <p className={styles.contactInfo}>{consultation.customerEmail}</p>
                                    )}
                                    {consultation.customerPhone && (
                                        <p className={styles.contactInfo}>{consultation.customerPhone}</p>
                                    )}
                                </div>
                            </div>
                            <div className={styles.participant}>
                                <div className={styles.participantIcon}>
                                    <FaUserMd />
                                </div>
                                <div className={styles.participantInfo}>
                                    <h4>Tư vấn viên</h4>
                                    <p>{consultation.consultantName}</p>
                                    {consultation.consultantEmail && (
                                        <p className={styles.contactInfo}>{consultation.consultantEmail}</p>
                                    )}
                                    {consultation.consultantPhone && (
                                        <p className={styles.contactInfo}>{consultation.consultantPhone}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Thời gian tư vấn</h3>
                        <div className={styles.schedule}>
                            {consultation.startTime && consultation.endTime ? (
                                <div className={styles.timeInfo}>
                                    <div className={styles.timeItem}>
                                        <FaCalendarAlt className={styles.timeIcon} />
                                        <div>
                                            <p className={styles.timeLabel}>Thời gian bắt đầu</p>
                                            <p className={styles.timeValue}>{formatDateTime(consultation.startTime)}</p>
                                        </div>
                                    </div>
                                    <div className={styles.timeItem}>
                                        <FaClock className={styles.timeIcon} />
                                        <div>
                                            <p className={styles.timeLabel}>Thời gian kết thúc</p>
                                            <p className={styles.timeValue}>{formatDateTime(consultation.endTime)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className={styles.noSchedule}>Chưa có lịch hẹn cụ thể</p>
                            )}                        </div>
                    </div>

                    {/* Meeting Link */}
                    {consultation.meetUrl && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Liên kết cuộc họp</h3>
                            <div className={styles.meetLink}>
                                <FaLink className={styles.linkIcon} />
                                <a
                                    href={consultation.meetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.linkUrl}
                                >
                                    {consultation.meetUrl}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Thông tin hệ thống</h3>
                        <div className={styles.timestamps}>
                            <div className={styles.timestamp}>
                                <label>Ngày tạo:</label>
                                <span>{formatDateTime(consultation.createdAt)}</span>
                            </div>
                            {consultation.updatedAt && (
                                <div className={styles.timestamp}>
                                    <label>Cập nhật lần cuối:</label>
                                    <span>{formatDateTime(consultation.updatedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ConsultationDetailModal;
