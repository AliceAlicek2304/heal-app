import React, { useEffect, useState } from 'react';
import { FaVial, FaTimes, FaToggleOn, FaToggleOff, FaMoneyBillWave, FaCalendarAlt, FaFlask } from 'react-icons/fa';
import { formatDateTime } from '../../../utils/dateUtils';
import Modal from '../../ui/Modal';
import styles from './STIPackageDetailModal.module.css';
import { stiService } from '../../../services/stiService';

const STIPackageDetailModal = ({ pkg, onClose, onBook }) => {
    const [serviceDetails, setServiceDetails] = useState([]);
    const [detailedServices, setDetailedServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingServices, setLoadingServices] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchDetails() {
            if (!pkg?.services) return;
            setLoading(true);
            const details = await Promise.all(
                pkg.services.map(async (svc) => {
                    // svc có thể là object hoặc chỉ id
                    const id = svc.serviceId || svc.id || svc;
                    const res = await stiService.getServiceDetails(id);
                    return res && res.success && res.data ? res.data : null;
                })
            );
            if (isMounted) {
                setServiceDetails(details.filter(Boolean));
                setLoading(false);
            }
        }
        fetchDetails();
        return () => { isMounted = false; };
    }, [pkg]);

    useEffect(() => {
        let isMounted = true;
        async function fetchServiceDetails() {
            if (!pkg || !pkg.services || pkg.services.length === 0) {
                setDetailedServices([]);
                return;
            }
            setLoadingServices(true);
            setError(null);
            try {
                // Fetch all service details in parallel
                const serviceDetails = await Promise.all(
                    pkg.services.map(async (service) => {
                        // Nếu đã có testComponents thì không cần fetch lại
                        if (service.testComponents && service.testComponents.length > 0) return service;
                        try {
                            const detail = await stiService.getServiceDetails(service.serviceId || service.id);
                            return { ...service, ...((detail && detail.success && detail.data) ? detail.data : {}) };
                        } catch (e) {
                            return { ...service, testComponents: [], fetchError: true };
                        }
                    })
                );
                if (isMounted) setDetailedServices(serviceDetails);
            } catch (e) {
                if (isMounted) setError('Lỗi khi tải chi tiết dịch vụ');
            } finally {
                if (isMounted) setLoadingServices(false);
            }
        }
        fetchServiceDetails();
        return () => { isMounted = false; };
    }, [pkg]);

    if (!pkg) return null;

    const handleBook = () => {
        if (onBook) {
            onBook(pkg);
        }
        if (onClose) {
            onClose();
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} size="large">
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Chi tiết gói xét nghiệm STI</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className={styles.content}>
                    {/* Package Info */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FaVial className={styles.sectionIcon} /> Thông tin gói
                        </h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Tên gói: <span className={styles.infoValue}>{pkg.packageName || pkg.name}</span></span>
                            </div>
                            {pkg.isActive !== undefined && (
                                <div className={styles.infoItem}>
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
                            )}
                            {pkg.packagePrice && (
                                <div className={styles.infoItem}>
                                    <FaMoneyBillWave className={styles.infoIcon} />
                                    <span className={styles.infoLabel}>Giá combo: <span className={styles.packagePriceValue}>{pkg.packagePrice.toLocaleString()} VNĐ</span></span>
                                </div>
                            )}
                            {pkg.totalIndividualPrice && (
                                <div className={styles.infoItem}>
                                    <FaMoneyBillWave className={styles.infoIcon} />
                                    <span className={styles.infoLabel}>Tổng giá lẻ: <span className={styles.originalPriceValue}>{pkg.totalIndividualPrice.toLocaleString()} VNĐ</span></span>
                                </div>
                            )}
                            {pkg.totalIndividualPrice && pkg.packagePrice && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Tiết kiệm: <span className={styles.infoValue}>{(pkg.totalIndividualPrice - pkg.packagePrice).toLocaleString()} VNĐ</span></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {pkg.description && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Mô tả</h3>
                            <div className={styles.descriptionContent}>{pkg.description}</div>
                        </div>
                    )}

                    {/* Services List */}
                    {pkg.services && pkg.services.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FaFlask className={styles.sectionIcon} /> Danh sách dịch vụ ({pkg.services.length})
                            </h3>
                            {loadingServices ? (
                                <div className={styles.loadingServices}>Đang tải chi tiết dịch vụ...</div>
                            ) : error ? (
                                <div className={styles.errorServices}>{error}</div>
                            ) : (
                                <div>
                                    {(detailedServices.length > 0 ? detailedServices : pkg.services).map((service, idx) => (
                                        <div key={service.serviceId || service.id || idx} className={styles.serviceGroup}>
                                            <div className={styles.serviceGroupTitle}>{service.name || service.serviceName}</div>
                                            {service.testComponents && service.testComponents.length > 0 ? (
                                                <div className={styles.resultsTable}>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th style={{width: 50}}>STT</th>
                                                                <th>Tên xét nghiệm</th>
                                                                <th>Khoảng tham chiếu</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {service.testComponents.map((comp, cidx) => (
                                                                <tr key={comp.componentId || comp.testComponentId || cidx}>
                                                                    <td>{cidx + 1}</td>
                                                                    <td>{comp.testName}</td>
                                                                    <td>{comp.referenceRange || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className={styles.noResults}>Không có thành phần xét nghiệm</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Thông tin thời gian</h3>
                        <div className={styles.infoGrid}>
                            {pkg.createdAt && (
                                <div className={styles.infoItem}>
                                    <FaCalendarAlt className={styles.infoIcon} />
                                    <span className={styles.infoLabel}>Ngày tạo: <span className={styles.infoValue}>{formatDateTime(pkg.createdAt)}</span></span>
                                </div>
                            )}
                            {pkg.updatedAt && (
                                <div className={styles.infoItem}>
                                    <FaCalendarAlt className={styles.infoIcon} />
                                    <span className={styles.infoLabel}>Cập nhật lần cuối: <span className={styles.infoValue}>{formatDateTime(pkg.updatedAt)}</span></span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.footer}>
                    <button className={styles.btnPrimary} onClick={handleBook}>
                        Đặt lịch gói này
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default STIPackageDetailModal;
