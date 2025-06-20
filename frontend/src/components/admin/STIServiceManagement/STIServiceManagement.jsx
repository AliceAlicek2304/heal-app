import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaVial, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import { stiService } from '../../../services/stiService';
import { formatDateTime } from '../../../utils/dateUtils';
import STIServiceDetailModal from './STIServiceDetailModal';
import Pagination from '../../common/Pagination/Pagination';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import styles from './STIServiceManagement.module.css';

const ITEMS_PER_PAGE = 12;

const STIServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const { addToast } = useToast();

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        filterServices();
    }, [services, searchTerm, selectedStatus]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredServices.length / ITEMS_PER_PAGE));
    }, [filteredServices]); const loadServices = async () => {
        setLoading(true);
        try {
            const response = await stiService.getAllSTIServices();
            if (response.success) {
                setServices(response.data || []);
            } else {
                addToast(response.message || 'Không thể tải danh sách dịch vụ STI', 'error');
                setServices([]);
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const filterServices = () => {
        if (!Array.isArray(services)) {
            setFilteredServices([]);
            return;
        }

        let filtered = [...services];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(service =>
                service.name?.toLowerCase().includes(term) ||
                service.description?.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (selectedStatus) {
            const isActive = selectedStatus === 'active';
            filtered = filtered.filter(service => service.isActive === isActive);
        }

        setFilteredServices(filtered);
        setCurrentPage(1);
    };

    const handleViewDetails = async (serviceId) => {
        try {
            const response = await stiService.getServiceDetails(serviceId);
            if (response.success) {
                setSelectedService(response.data);
                setShowDetailModal(true);
            } else {
                addToast(response.message || 'Không thể tải chi tiết dịch vụ', 'error');
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi tải chi tiết dịch vụ', 'error');
        }
    };

    const getCurrentPageServices = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredServices.slice(startIndex, endIndex);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className={styles.serviceManagement}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerText}>
                        <h1>Quản lý dịch vụ STI</h1>
                        <p>Xem danh sách các dịch vụ xét nghiệm bệnh lây truyền qua đường tình dục</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchSection}>
                    <div className={styles.searchBox}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Ngừng hoạt động</option>
                    </select>
                </div>
            </div>

            {/* Services List */}
            <div className={styles.servicesContainer}>
                {filteredServices.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaVial className={styles.emptyIcon} />
                        <h3>Không tìm thấy dịch vụ nào</h3>
                        <p>Không có dịch vụ STI nào phù hợp với bộ lọc hiện tại</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.servicesGrid}>
                            {getCurrentPageServices().map(service => (
                                <div
                                    key={service.serviceId}
                                    className={`${styles.serviceCard} ${!service.isActive ? styles.inactive : ''}`}
                                >
                                    <div className={styles.serviceHeader}>
                                        <h3 className={styles.serviceName}>{service.name}</h3>
                                        <div className={styles.serviceStatus}>
                                            {service.isActive ? (
                                                <FaToggleOn className={styles.statusActive} />
                                            ) : (
                                                <FaToggleOff className={styles.statusInactive} />
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.serviceContent}>
                                        <p className={styles.serviceDescription}>
                                            {service.description}
                                        </p>

                                        <div className={styles.serviceInfo}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Giá:</span>
                                                <span className={styles.infoValue}>
                                                    {service.price?.toLocaleString() || 'Chưa cập nhật'} VNĐ
                                                </span>
                                            </div>
                                            {service.testComponents && service.testComponents.length > 0 && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Thành phần xét nghiệm:</span>
                                                    <span className={styles.infoValue}>
                                                        {service.testComponents.length} thành phần
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.serviceActions}>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleViewDetails(service.serviceId)}
                                            title="Xem chi tiết"
                                        >
                                            <FaEye />
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedService && (
                <STIServiceDetailModal
                    service={selectedService}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedService(null);
                    }}
                />
            )}
        </div>
    );
};

export default STIServiceManagement;
