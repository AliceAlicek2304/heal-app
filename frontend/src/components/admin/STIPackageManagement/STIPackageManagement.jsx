import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaBoxOpen, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import { stiService } from '../../../services/stiService';
import { formatDateTime } from '../../../utils/dateUtils';
import STIPackageDetailModal from './STIPackageDetailModal';
import Pagination from '../../common/Pagination/Pagination';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import styles from './STIPackageManagement.module.css';

const ITEMS_PER_PAGE = 12;

const STIPackageManagement = () => {
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);

    const { addToast } = useToast();

    useEffect(() => {
        loadPackages();
    }, []);

    useEffect(() => {
        filterPackages();
    }, [packages, searchTerm, selectedStatus]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredPackages.length / ITEMS_PER_PAGE));
    }, [filteredPackages]); const loadPackages = async () => {
        setLoading(true);
        try {
            const response = await stiService.getAllSTIPackages();
            if (response.success) {
                setPackages(response.data || []);
            } else {
                addToast(response.message || 'Không thể tải danh sách gói dịch vụ STI', 'error');
                setPackages([]);
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const filterPackages = () => {
        if (!Array.isArray(packages)) {
            setFilteredPackages([]);
            return;
        }

        let filtered = [...packages];        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(pkg =>
                pkg.packageName?.toLowerCase().includes(term) ||
                pkg.description?.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (selectedStatus) {
            const isActive = selectedStatus === 'active';
            filtered = filtered.filter(pkg => pkg.isActive === isActive);
        }

        setFilteredPackages(filtered);
        setCurrentPage(1);
    };

    const handleViewDetails = async (packageId) => {
        try {
            // Since we already have the package data, we can use it directly
            const packageData = packages.find(pkg => pkg.packageId === packageId);
            if (packageData) {
                setSelectedPackage(packageData);
                setShowDetailModal(true);
            } else {
                addToast('Không thể tìm thấy gói dịch vụ', 'error');
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi tải chi tiết gói dịch vụ', 'error');
        }
    };

    const getCurrentPagePackages = () => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredPackages.slice(startIndex, endIndex);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className={styles.packageManagement}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerText}>
                        <h1>Quản lý gói dịch vụ STI</h1>
                        <p>Xem danh sách các gói dịch vụ xét nghiệm bệnh lây truyền qua đường tình dục</p>
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
                            placeholder="Tìm kiếm theo tên gói dịch vụ..."
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

            {/* Packages List */}
            <div className={styles.packagesContainer}>
                {filteredPackages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaBoxOpen className={styles.emptyIcon} />
                        <h3>Không tìm thấy gói dịch vụ nào</h3>
                        <p>Không có gói dịch vụ STI nào phù hợp với bộ lọc hiện tại</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.packagesGrid}>
                            {getCurrentPagePackages().map(pkg => (
                                <div
                                    key={pkg.packageId}
                                    className={`${styles.packageCard} ${!pkg.isActive ? styles.inactive : ''}`}
                                >                                    <div className={styles.packageHeader}>
                                        <h3 className={styles.packageName}>{pkg.packageName}</h3>
                                        <div className={styles.packageStatus}>
                                            {pkg.isActive ? (
                                                <FaToggleOn className={styles.statusActive} />
                                            ) : (
                                                <FaToggleOff className={styles.statusInactive} />
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.packageContent}>
                                        <p className={styles.packageDescription}>
                                            {pkg.description}
                                        </p>

                                        <div className={styles.packageInfo}>                                            <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Giá:</span>
                                            <span className={styles.infoValue}>
                                                {pkg.packagePrice?.toLocaleString() || 'Chưa cập nhật'} VNĐ
                                            </span>
                                        </div>
                                            {pkg.services && pkg.services.length > 0 && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Dịch vụ bao gồm:</span>
                                                    <span className={styles.infoValue}>
                                                        {pkg.services.length} dịch vụ
                                                    </span>
                                                </div>
                                            )}
                                            {pkg.discount && pkg.discount > 0 && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Giảm giá:</span>
                                                    <span className={styles.infoValue}>
                                                        {pkg.discount}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.packageActions}>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleViewDetails(pkg.packageId)}
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
            {showDetailModal && selectedPackage && (
                <STIPackageDetailModal
                    package={selectedPackage}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedPackage(null);
                    }}
                />
            )}
        </div>
    );
};

export default STIPackageManagement;
