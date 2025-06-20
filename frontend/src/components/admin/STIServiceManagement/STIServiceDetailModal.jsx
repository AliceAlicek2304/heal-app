import React from 'react';
import { FaVial, FaTimes, FaToggleOn, FaToggleOff, FaMoneyBillWave, FaCalendarAlt, FaFlask } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/dateUtils';
import Modal from '../../ui/Modal';
import styles from './STIServiceDetailModal.module.css';

const STIServiceDetailModal = ({ service, onClose }) => {
    if (!service) return null;

    return (
        <Modal isOpen={true} onClose={onClose} size="large">
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Chi tiết dịch vụ STI
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Service Info */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaVial className={styles.sectionIcon} />
                            Thông tin dịch vụ
                        </h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <div className={styles.infoContent}>
                                    <span className={styles.infoLabel}>Tên dịch vụ: <span className={styles.infoValue}>{service.name}</span></span>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoContent}>
                                    <span className={styles.infoLabel}>Trạng thái:</span>
                                    <div className={styles.statusContainer}>
                                        {service.isActive ? (
                                            <>
                                                <FaToggleOn className={styles.statusIconActive} />
                                                <span className={styles.statusTextActive}>Đang hoạt động</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaToggleOff className={styles.statusIconInactive} />
                                                <span className={styles.statusTextInactive}>Ngừng hoạt động</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {service.price && (
                                <div className={styles.infoItem}>
                                    <FaMoneyBillWave className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Giá: <span className={styles.infoValue}>{service.price.toLocaleString()} VNĐ</span></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {service.description && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Mô tả</h3>
                            <div className={styles.descriptionContent}>
                                {service.description}
                            </div>
                        </div>
                    )}

                    {/* Test Components */}
                    {service.testComponents && service.testComponents.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FaFlask className={styles.sectionIcon} />
                                Thành phần xét nghiệm ({service.testComponents.length})
                            </h3>
                            <div className={styles.componentsGrid}>
                                {service.testComponents.map((component, index) => (
                                    <div key={index} className={styles.componentCard}>
                                        <div className={styles.componentHeader}>
                                            <FaFlask className={styles.componentIcon} />
                                            <h4 className={styles.componentName}>{component.testName}</h4>
                                        </div>
                                        {component.referenceRange && (
                                            <div className={styles.componentInfo}>
                                                <span className={styles.rangeLabel}>Khoảng tham chiếu: <span className={styles.rangeValue}>{component.referenceRange}</span></span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Thông tin thời gian</h3>
                        <div className={styles.infoGrid}>
                            {service.createdAt && (
                                <div className={styles.infoItem}>
                                    <FaCalendarAlt className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Ngày tạo:</span>
                                        <span className={styles.infoValue}>{formatDateTime(service.createdAt)}</span>
                                    </div>
                                </div>
                            )}
                            {service.updatedAt && (
                                <div className={styles.infoItem}>
                                    <FaCalendarAlt className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Cập nhật lần cuối:</span>
                                        <span className={styles.infoValue}>{formatDateTime(service.updatedAt)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default STIServiceDetailModal;
