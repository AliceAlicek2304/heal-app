import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import stiPackageService from '../../../services/stiPackageService';
import { stiService } from '../../../services/stiService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import styles from './ManageSTIPackages.module.css';

const ManageSTIPackages = () => {
    const { user } = useAuth();
    const toast = useToast();

    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    const [formData, setFormData] = useState({
        packageName: '',
        description: '',
        packagePrice: '',
        isActive: true,
        serviceIds: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true); try {
            const [packagesResult, servicesResult] = await Promise.all([
                stiPackageService.getAllPackages(),
                stiService.getActiveServices()
            ]);

            if (packagesResult.success) {
                setPackages(packagesResult.data || []);
            } else {
                toast.error('Không thể tải danh sách packages: ' + packagesResult.message);
            }

            if (servicesResult.success) {
                setServices(servicesResult.data || []);
            } else {
                toast.error('Không thể tải danh sách services: ' + servicesResult.message);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            packageName: '',
            description: '',
            packagePrice: '',
            isActive: true,
            serviceIds: []
        });
        setErrors({});
        setEditingPackage(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (pkg) => {
        setFormData({
            packageName: pkg.packageName || '',
            description: pkg.description || '',
            packagePrice: pkg.packagePrice || '',
            isActive: pkg.isActive !== false,
            serviceIds: pkg.services?.map(s => s.serviceId) || []
        });
        setEditingPackage(pkg);
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleServiceSelection = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            serviceIds: prev.serviceIds.includes(serviceId)
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId]
        }));

        if (errors.serviceIds) {
            setErrors(prev => ({ ...prev, serviceIds: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.packageName.trim()) {
            newErrors.packageName = 'Tên package là bắt buộc';
        }

        if (!formData.packagePrice || parseFloat(formData.packagePrice) <= 0) {
            newErrors.packagePrice = 'Giá package phải lớn hơn 0';
        }

        if (formData.serviceIds.length < 2) {
            newErrors.serviceIds = 'Package phải chứa ít nhất 2 services';
        }

        // Tính tổng giá individual
        const totalIndividualPrice = formData.serviceIds.reduce((total, serviceId) => {
            const service = services.find(s => s.serviceId === serviceId);
            return total + (service?.price || 0);
        }, 0);

        if (parseFloat(formData.packagePrice) >= totalIndividualPrice) {
            newErrors.packagePrice = 'Giá package phải nhỏ hơn tổng giá các services riêng lẻ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const packageData = {
                packageName: formData.packageName.trim(),
                description: formData.description.trim(),
                packagePrice: parseFloat(formData.packagePrice),
                isActive: formData.isActive,
                serviceIds: formData.serviceIds
            };

            let result;
            if (editingPackage) {
                result = await stiPackageService.updatePackage(editingPackage.packageId, packageData);
            } else {
                result = await stiPackageService.createPackage(packageData);
            }

            if (result.success) {
                toast.success(editingPackage ? 'Cập nhật package thành công!' : 'Tạo package thành công!');
                closeModal();
                loadData();
            } else {
                toast.error(result.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error saving package:', error);
            toast.error('Có lỗi xảy ra khi lưu package');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (packageId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa package này?')) {
            return;
        }

        setLoading(true);
        try {
            const result = await stiPackageService.deletePackage(packageId);
            if (result.success) {
                toast.success('Xóa package thành công!');
                loadData();
            } else {
                toast.error(result.message || 'Không thể xóa package');
            }
        } catch (error) {
            console.error('Error deleting package:', error);
            toast.error('Có lỗi xảy ra khi xóa package');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0);
    };

    const calculateTotalIndividualPrice = (serviceIds) => {
        return serviceIds.reduce((total, serviceId) => {
            const service = services.find(s => s.serviceId === serviceId);
            return total + (service?.price || 0);
        }, 0);
    };

    const calculateSavings = (packagePrice, totalIndividualPrice) => {
        return Math.max(0, totalIndividualPrice - packagePrice);
    };

    const calculateDiscountPercentage = (packagePrice, totalIndividualPrice) => {
        if (totalIndividualPrice === 0) return 0;
        const savings = calculateSavings(packagePrice, totalIndividualPrice);
        return Math.round((savings / totalIndividualPrice) * 100);
    };

    if (loading && packages.length === 0) {
        return <LoadingSpinner />;
    }

    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
        return (
            <div className={styles.accessDenied}>
                <h2>Truy cập bị từ chối</h2>
                <p>Bạn không có quyền truy cập trang này.</p>
                <p>Role hiện tại: {user?.role || 'Không có role'}</p>
            </div>
        );
    }

    return (
        <div className={styles.managePackages}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h2>Quản lý STI Packages</h2>
                    <p>Tạo và quản lý các gói combo xét nghiệm STI</p>
                </div>
                <button
                    className={styles.createBtn}
                    onClick={openCreateModal}
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Tạo Package Mới
                </button>
            </div>

            {packages.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <h3>Chưa có package nào</h3>
                    <p>Tạo package đầu tiên để bắt đầu quản lý gói combo xét nghiệm</p>
                </div>
            ) : (
                <div className={styles.packagesGrid}>
                    {packages.map((pkg) => (
                        <div key={pkg.packageId} className={styles.packageCard}>
                            <div className={styles.packageHeader}>
                                <div className={styles.packageInfo}>
                                    <h3>{pkg.packageName}</h3>
                                    <p className={styles.description}>{pkg.description}</p>
                                </div>
                                <div className={styles.packageActions}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => openEditModal(pkg)}
                                        title="Chỉnh sửa"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m18 2 4 4-14 14H4v-4L18 2z"></path>
                                        </svg>
                                    </button>
                                    {user.role === 'ADMIN' && (
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDelete(pkg.packageId)}
                                            title="Xóa"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3,6 5,6 21,6"></polyline>
                                                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.packagePricing}>
                                <div className={styles.priceInfo}>
                                    <div className={styles.packagePrice}>
                                        <span className={styles.priceLabel}>Giá package:</span>
                                        <span className={styles.priceValue}>{formatPrice(pkg.packagePrice)}</span>
                                    </div>
                                    {pkg.totalIndividualPrice && (
                                        <div className={styles.originalPrice}>
                                            <span className={styles.priceLabel}>Giá lẻ:</span>
                                            <span className={styles.originalPriceValue}>{formatPrice(pkg.totalIndividualPrice)}</span>
                                        </div>
                                    )}
                                </div>
                                {pkg.savingsAmount > 0 && (
                                    <div className={styles.savings}>
                                        <span className={styles.savingsAmount}>
                                            Tiết kiệm {formatPrice(pkg.savingsAmount)}
                                        </span>
                                        <span className={styles.discountPercentage}>
                                            ({pkg.discountPercentage}%)
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.packageServices}>
                                <div className={styles.servicesHeader}>
                                    <span>Services bao gồm ({pkg.serviceCount})</span>
                                </div>
                                <div className={styles.servicesList}>
                                    {pkg.services?.map((service, index) => (
                                        <div key={service.serviceId} className={styles.serviceItem}>
                                            <span className={styles.serviceName}>{service.name}</span>
                                            <span className={styles.servicePrice}>{formatPrice(service.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.packageMeta}>
                                <div className={styles.componentCount}>
                                    <span>Tổng xét nghiệm: {pkg.totalComponentCount}</span>
                                </div>
                                <div className={styles.status}>
                                    <span className={`${styles.statusBadge} ${pkg.isActive ? styles.active : styles.inactive}`}>
                                        {pkg.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Create/Edit Package */}
            {showModal && (
                <div className={styles.modalBackdrop} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{editingPackage ? 'Chỉnh sửa Package' : 'Tạo Package Mới'}</h3>
                            <button className={styles.modalCloseBtn} onClick={closeModal}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="packageName">Tên Package *</label>
                                <input
                                    type="text"
                                    id="packageName"
                                    name="packageName"
                                    value={formData.packageName}
                                    onChange={handleInputChange}
                                    placeholder="Nhập tên package"
                                    className={errors.packageName ? styles.error : ''}
                                />
                                {errors.packageName && <span className={styles.errorText}>{errors.packageName}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="description">Mô tả</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Nhập mô tả package"
                                    rows="3"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="packagePrice">Giá Package (VNĐ) *</label>
                                <input
                                    type="number"
                                    id="packagePrice"
                                    name="packagePrice"
                                    value={formData.packagePrice}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="0"
                                    step="1000"
                                    className={errors.packagePrice ? styles.error : ''}
                                />
                                {errors.packagePrice && <span className={styles.errorText}>{errors.packagePrice}</span>}

                                {/* Price comparison */}
                                {formData.serviceIds.length > 0 && (
                                    <div className={styles.priceComparison}>
                                        <div className={styles.comparisonRow}>
                                            <span>Tổng giá lẻ:</span>
                                            <span>{formatPrice(calculateTotalIndividualPrice(formData.serviceIds))}</span>
                                        </div>
                                        {formData.packagePrice && (
                                            <>
                                                <div className={styles.comparisonRow}>
                                                    <span>Giá package:</span>
                                                    <span>{formatPrice(parseFloat(formData.packagePrice))}</span>
                                                </div>
                                                <div className={styles.comparisonRow + ' ' + styles.savings}>
                                                    <span>Tiết kiệm:</span>
                                                    <span>
                                                        {formatPrice(calculateSavings(parseFloat(formData.packagePrice), calculateTotalIndividualPrice(formData.serviceIds)))}
                                                        ({calculateDiscountPercentage(parseFloat(formData.packagePrice), calculateTotalIndividualPrice(formData.serviceIds))}%)
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Chọn Services *</label>
                                <div className={styles.servicesSelection}>
                                    {services.map((service) => (
                                        <div key={service.serviceId} className={styles.serviceOption}>
                                            <label className={styles.serviceCheckbox}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.serviceIds.includes(service.serviceId)}
                                                    onChange={() => handleServiceSelection(service.serviceId)}
                                                />
                                                <div className={styles.serviceDetails}>
                                                    <div className={styles.serviceName}>{service.name}</div>
                                                    <div className={styles.serviceInfo}>
                                                        <span className={styles.servicePrice}>{formatPrice(service.price)}</span>
                                                        <span className={styles.componentCount}>
                                                            {service.componentCount} xét nghiệm
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.serviceIds && <span className={styles.errorText}>{errors.serviceIds}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                    />
                                    Package đang hoạt động
                                </label>
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={closeModal}
                                    disabled={loading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className={styles.spinner}></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        editingPackage ? 'Cập nhật' : 'Tạo Package'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading && <div className={styles.loadingOverlay}><LoadingSpinner /></div>}
        </div>
    );
};

export default ManageSTIPackages;
