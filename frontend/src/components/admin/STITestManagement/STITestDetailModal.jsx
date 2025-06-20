import React from 'react';
import { FaUser, FaVial, FaCalendarAlt, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaTimes, FaPhone, FaEnvelope, FaIdCard } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/dateUtils';
import Modal from '../../ui/Modal';
import PaymentSection from './PaymentSection';
import styles from './STITestDetailModal.module.css';

const STATUS_CONFIG = {
    PENDING: { label: 'Chờ xử lý', color: '#f59e0b' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#10b981' },
    SAMPLED: { label: 'Đã lấy mẫu', color: '#3b82f6' },
    RESULTED: { label: 'Có kết quả', color: '#8b5cf6' },
    COMPLETED: { label: 'Hoàn thành', color: '#06d6a0' },
    CANCELED: { label: 'Đã hủy', color: '#ef4444' }
};

const PAYMENT_STATUS_CONFIG = {
    PENDING: { label: 'Chờ thanh toán', color: '#f59e0b' },
    COMPLETED: { label: 'Đã thanh toán', color: '#10b981' },
    FAILED: { label: 'Thất bại', color: '#ef4444' },
    EXPIRED: { label: 'Hết hạn', color: '#6b7280' },
    REFUNDED: { label: 'Đã hoàn tiền', color: '#3b82f6' }
};

const STITestDetailModal = ({ test, onClose }) => {
    if (!test) return null;

    const statusConfig = STATUS_CONFIG[test.status] || { label: test.status, color: '#6b7280' };
    const paymentStatusConfig = PAYMENT_STATUS_CONFIG[test.paymentStatus] || { label: test.paymentStatus, color: '#6b7280' };

    return (
        <Modal isOpen={true} onClose={onClose} size="large">
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Chi tiết STI Test #{test.testId}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Status Section */}
                    <div className={styles.statusSection}>
                        <div className={styles.statusGroup}>
                            <span
                                className={styles.statusBadge}
                                style={{ backgroundColor: statusConfig.color }}
                            >
                                {statusConfig.label}
                            </span>
                            <span
                                className={styles.statusBadge}
                                style={{ backgroundColor: paymentStatusConfig.color }}
                            >
                                {paymentStatusConfig.label}
                            </span>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaUser className={styles.sectionIcon} />
                            Thông tin khách hàng
                        </h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <FaIdCard className={styles.infoIcon} />
                                <div className={styles.infoContent}>
                                    <span className={styles.infoLabel}>Tên khách hàng:</span>
                                    <span className={styles.infoValue}>{test.customerName}</span>
                                </div>
                            </div>
                            {test.customerPhone && (
                                <div className={styles.infoItem}>
                                    <FaPhone className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Số điện thoại:</span>
                                        <span className={styles.infoValue}>{test.customerPhone}</span>
                                    </div>
                                </div>
                            )}
                            {test.customerEmail && (
                                <div className={styles.infoItem}>
                                    <FaEnvelope className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Email:</span>
                                        <span className={styles.infoValue}>{test.customerEmail}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Service/Package Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaVial className={styles.sectionIcon} />
                            Thông tin dịch vụ
                        </h3>
                        <div className={styles.infoGrid}>
                            {test.serviceName && (
                                <div className={styles.infoItem}>
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Dịch vụ: <span className={styles.infoValue}>{test.serviceName}</span></span>
                                    </div>
                                </div>
                            )}
                            {test.packageName && (
                                <div className={styles.infoItem}>
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Gói dịch vụ: <span className={styles.infoValue}>{test.packageName}</span></span>
                                    </div>
                                </div>
                            )}
                            {test.price && (
                                <div className={styles.infoItem}>
                                    <FaMoneyBillWave className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Giá:</span>
                                        <span className={styles.infoValue}>{test.price.toLocaleString()} VNĐ</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Appointment Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaCalendarAlt className={styles.sectionIcon} />
                            Thông tin lịch hẹn
                        </h3>
                        <div className={styles.infoGrid}>
                            {test.appointmentDate && (
                                <div className={styles.infoItem}>
                                    <FaCalendarAlt className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Ngày hẹn:</span>
                                        <span className={styles.infoValue}>{formatDateTime(test.appointmentDate)}</span>
                                    </div>
                                </div>
                            )}
                            {test.appointmentTime && (
                                <div className={styles.infoItem}>
                                    <FaClock className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Giờ hẹn:</span>
                                        <span className={styles.infoValue}>{test.appointmentTime}</span>
                                    </div>
                                </div>
                            )}
                            {test.location && (
                                <div className={styles.infoItem}>
                                    <FaMapMarkerAlt className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Địa điểm:</span>
                                        <span className={styles.infoValue}>{test.location}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {test.notes && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Ghi chú</h3>
                            <div className={styles.notesContent}>
                                {test.notes}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Thông tin thời gian</h3>
                        <div className={styles.infoGrid}>
                            {test.createdAt && (
                                <div className={styles.infoItem}>
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Ngày tạo:</span>
                                        <span className={styles.infoValue}>{formatDateTime(test.createdAt)}</span>
                                    </div>
                                </div>
                            )}
                            {test.updatedAt && (
                                <div className={styles.infoItem}>
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Cập nhật lần cuối:</span>
                                        <span className={styles.infoValue}>{formatDateTime(test.updatedAt)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>                    {/* Payment Section */}
                    <PaymentSection
                        serviceType="STI"
                        serviceId={test.testId}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default STITestDetailModal;
