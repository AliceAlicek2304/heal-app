import React from 'react';
import { FaBoxOpen, FaTimes, FaToggleOn, FaToggleOff, FaMoneyBillWave, FaCalendarAlt, FaVial, FaPercentage } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/dateUtils';
import Modal from '../../ui/Modal';
import styles from './STIPackageDetailModal.module.css';

const STIPackageDetailModal = ({ package: pkg, onClose }) => {
    if (!pkg) return null;

    return (
        <Modal isOpen={true} onClose={onClose} size="large">
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Chi tiết gói dịch vụ STI
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Package Info */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaBoxOpen className={styles.sectionIcon} />
                            Thông tin gói dịch vụ
                        </h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <div className={styles.infoContent}>
                                    <span className={styles.infoLabel}>Tên gói: <span className={styles.infoValue}>{pkg.packageName}</span></span>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.infoContent}>
                                    <span className={styles.infoLabel}>Trạng thái:</span>
                                    <div className={styles.statusContainer}>
                                        {pkg.isActive ? (
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
                            {pkg.packagePrice && (
                                <div className={styles.infoItem}>
                                    <FaMoneyBillWave className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Giá: <span className={styles.infoValue}>{pkg.packagePrice.toLocaleString()} VNĐ</span></span>
                                    </div>
                                </div>
                            )}
                            {pkg.discount && pkg.discount > 0 && (
                                <div className={styles.infoItem}>
                                    <FaPercentage className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Giảm giá:</span>
                                        <span className={styles.infoValue}>{pkg.discount}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {pkg.description && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Mô tả</h3>
                            <div className={styles.descriptionContent}>
                                {pkg.description}
                            </div>
                        </div>
                    )}

                    {/* Services */}
                    {pkg.services && pkg.services.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FaVial className={styles.sectionIcon} />
                                Dịch vụ bao gồm ({pkg.services.length})
                            </h3>
                            <div className={styles.servicesGrid}>
                                {pkg.services.map((service, index) => (
                                    <div key={index} className={styles.serviceCard}>
                                        <div className={styles.serviceHeader}>
                                            <FaVial className={styles.serviceIcon} />
                                            <h4 className={styles.serviceName}>{service.name}</h4>
                                        </div>
                                        {service.description && (
                                            <div className={styles.serviceDescription}>
                                                {service.description}
                                            </div>
                                        )}                                        {service.price && (
                                            <div className={styles.servicePrice}>
                                                <span className={styles.priceLabel}>Giá lẻ:</span>
                                                <span className={styles.priceValue}>{service.price.toLocaleString()} VNĐ</span>
                                            </div>
                                        )}
                                        {service.testComponents && service.testComponents.length > 0 && (
                                            <div className={styles.serviceComponents}>
                                                <span className={styles.componentsLabel}>
                                                    Bao gồm {service.testComponents.length} xét nghiệm
                                                </span>
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
                            {pkg.createdAt && (
                                <div className={styles.infoItem}>
                                    <FaCalendarAlt className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Ngày tạo:</span>
                                        <span className={styles.infoValue}>{formatDateTime(pkg.createdAt)}</span>
                                    </div>
                                </div>
                            )}
                            {pkg.updatedAt && (
                                <div className={styles.infoItem}>
                                    <FaCalendarAlt className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Cập nhật lần cuối:</span>
                                        <span className={styles.infoValue}>{formatDateTime(pkg.updatedAt)}</span>
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

export default STIPackageDetailModal;
