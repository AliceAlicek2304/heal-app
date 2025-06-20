import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { stiServiceManagementService } from '../../services/stiServiceManagementService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import styles from './ManageSTIServices.module.css';

const ManageSTIServices = () => {
    const { logout } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedService, setSelectedService] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        isActive: true,
        testComponents: []
    });    const [newComponent, setNewComponent] = useState({
        testName: '',
        referenceRange: ''
    });

    useEffect(() => {
        loadServices();
    }, []);

    const handleAuthRequired = () => {
        logout();
        navigate('/');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    };

    const loadServices = async () => {
        try {
            setLoading(true);
            const response = await stiServiceManagementService.getAllSTIServices(handleAuthRequired);

            if (response.success) {
                setServices(response.data || []);
            } else {
                toast.error(response.message || 'Không thể tải danh sách dịch vụ');
            }
        } catch (error) {
            console.error('Error loading services:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = () => {
        setModalMode('create');
        setFormData({
            name: '',
            description: '',
            price: '',
            isActive: true,
            testComponents: []
        });
        setShowModal(true);
    };

    const handleEditService = async (serviceId) => {
        try {
            const response = await stiServiceManagementService.getSTIServiceDetails(serviceId, handleAuthRequired);

            if (response.success) {
                const service = response.data;
                setSelectedService(service);
                setFormData({
                    name: service.name || '',
                    description: service.description || '',
                    price: service.price || '',
                    isActive: service.isActive !== false,
                    testComponents: service.testComponents || []
                });
                setModalMode('edit');
                setShowModal(true);
            } else {
                toast.error(response.message || 'Không thể tải chi tiết dịch vụ');
            }
        } catch (error) {
            console.error('Error loading service details:', error);
            toast.error('Có lỗi xảy ra khi tải chi tiết dịch vụ');
        }
    };

    const handleViewService = async (serviceId) => {
        try {
            const response = await stiServiceManagementService.getSTIServiceDetails(serviceId, handleAuthRequired);

            if (response.success) {
                const service = response.data;
                setSelectedService(service);
                setFormData({
                    name: service.name || '',
                    description: service.description || '',
                    price: service.price || '',
                    isActive: service.isActive !== false,
                    testComponents: service.testComponents || []
                });
                setModalMode('view');
                setShowModal(true);
            } else {
                toast.error(response.message || 'Không thể tải chi tiết dịch vụ');
            }
        } catch (error) {
            console.error('Error loading service details:', error);
            toast.error('Có lỗi xảy ra khi tải chi tiết dịch vụ');
        }
    };

    const handleToggleStatus = async (serviceId) => {
        try {
            setActionLoading(prev => ({ ...prev, [serviceId]: true }));

            const response = await stiServiceManagementService.toggleSTIServiceStatus(serviceId, handleAuthRequired);

            if (response.success) {
                toast.success(response.message || 'Cập nhật trạng thái thành công');
                await loadServices(); // Reload data
            } else {
                toast.error(response.message || 'Không thể cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Error toggling service status:', error);
            toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setActionLoading(prev => ({ ...prev, [serviceId]: false }));
        }
    };

    const handleConfirmDelete = (service) => {
        setServiceToDelete(service);
        setShowDeleteConfirm(true);
    };

    const handleDeleteService = async () => {
        if (!serviceToDelete) return;

        try {
            await handleToggleStatus(serviceToDelete.serviceId);
            setShowDeleteConfirm(false);
            setServiceToDelete(null);
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();

        try {
            setActionLoading(prev => ({ ...prev, form: true }));

            const serviceData = {
                ...formData,
                price: parseFloat(formData.price) || 0
            };

            let response;
            if (modalMode === 'create') {
                response = await stiServiceManagementService.createSTIService(serviceData, handleAuthRequired);
            } else if (modalMode === 'edit') {
                response = await stiServiceManagementService.updateSTIService(
                    selectedService.serviceId,
                    serviceData,
                    handleAuthRequired
                );
            }

            if (response.success) {
                toast.success(
                    modalMode === 'create' ? 'Tạo dịch vụ thành công' : 'Cập nhật dịch vụ thành công'
                );
                setShowModal(false);
                await loadServices();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Có lỗi xảy ra khi lưu dữ liệu');
        } finally {
            setActionLoading(prev => ({ ...prev, form: false }));
        }
    };

    const handleAddComponent = () => {
        if (!newComponent.testName.trim() || !newComponent.referenceRange.trim()) {
            toast.error('Vui lòng nhập đầy đủ thông tin test component');
            return;
        } setFormData(prev => ({
            ...prev,
            testComponents: [
                ...prev.testComponents,
                { ...newComponent }
            ]
        }));

        setNewComponent({ testName: '', referenceRange: '' });
    };

    const handleRemoveComponent = (index) => {
        setFormData(prev => ({
            ...prev,
            testComponents: prev.testComponents.filter((_, i) => i !== index)
        }));
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0);
    };    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.manageServices}>
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.manageServices}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerText}>
                        <h1>Quản lý dịch vụ STI</h1>
                        <p>Quản lý các dịch vụ xét nghiệm bệnh lây truyền qua đường tình dục</p>
                    </div>
                    <button
                        className={styles.createBtn}
                        onClick={handleCreateService}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Tạo dịch vụ mới
                    </button>
                </div>
            </div>

            {/* Services List */}
            <div className={styles.servicesContainer}>
                {services.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <h3>Chưa có dịch vụ nào</h3>
                        <p>Hãy tạo dịch vụ STI đầu tiên để bắt đầu</p>
                        <button
                            className={styles.createBtn}
                            onClick={handleCreateService}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Tạo dịch vụ đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className={styles.servicesGrid}>
                        {services.map(service => (
                            <div
                                key={service.serviceId}
                                className={`${styles.serviceCard} ${!service.isActive ? styles.inactive : ''}`}
                            >
                                <div className={styles.serviceHeader}>
                                    <h3>{service.name}</h3>                                    <div className={styles.serviceStatus}>
                                        <span className={`${styles.statusBadge} ${service.isActive ? styles.active : styles.inactive}`}>
                                            {service.isActive ? (
                                                <>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <polyline points="20,6 9,17 4,12"></polyline>
                                                    </svg>
                                                    Hoạt động
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                    Không hoạt động
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.serviceBody}>
                                    <p className={styles.description}>{service.description}</p>

                                    <div className={styles.serviceInfo}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Giá:</span>
                                            <span className={styles.price}>{formatPrice(service.price)}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Số test:</span>
                                            <span className={styles.componentCount}>{service.componentCount || 0} tests</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Ngày tạo:</span>
                                            <span className={styles.date}>{formatDate(service.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.serviceActions}>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => handleViewService(service.serviceId)}
                                        title="Xem chi tiết"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>

                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => handleEditService(service.serviceId)}
                                        title="Chỉnh sửa"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>

                                    <button
                                        className={`${styles.actionBtn} ${styles.toggleBtn}`}
                                        onClick={() => handleToggleStatus(service.serviceId)}
                                        disabled={actionLoading[service.serviceId]}
                                        title={service.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                    >
                                        {actionLoading[service.serviceId] ? (
                                            <LoadingSpinner size="small" />
                                        ) : service.isActive ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Service Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>
                                {modalMode === 'create' && 'Tạo dịch vụ mới'}
                                {modalMode === 'edit' && 'Chỉnh sửa dịch vụ'}
                                {modalMode === 'view' && 'Chi tiết dịch vụ'}
                            </h2>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowModal(false)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitForm} className={styles.modalBody}>
                            {/* Basic Info */}
                            <div className={styles.formSection}>
                                <h3>Thông tin cơ bản</h3>

                                <div className={styles.formGroup}>
                                    <label htmlFor="serviceName">Tên dịch vụ *</label>
                                    <input
                                        type="text"
                                        id="serviceName"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nhập tên dịch vụ"
                                        required
                                        disabled={modalMode === 'view'}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="serviceDescription">Mô tả</label>
                                    <textarea
                                        id="serviceDescription"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Nhập mô tả dịch vụ"
                                        rows={3}
                                        disabled={modalMode === 'view'}
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="servicePrice">Giá (VNĐ) *</label>
                                        <input
                                            type="number"
                                            id="servicePrice"
                                            value={formData.price}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="0"
                                            min="0"
                                            step="1000"
                                            required
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>                                    {modalMode !== 'create' && (
                                        <div className={styles.formGroup}>
                                            <div className={styles.checkboxWrapper}>
                                                <span>Dịch vụ hoạt động</span>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isActive}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                                    disabled={modalMode === 'view'}
                                                />
                                            </div>
                                            <div className={`${styles.statusText} ${formData.isActive ? styles.activeText : styles.inactiveText}`}>
                                                {formData.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Test Components */}
                            <div className={styles.formSection}>
                                <h3>Test Components</h3>

                                {modalMode !== 'view' && (
                                    <div className={styles.componentForm}>                                        <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <input
                                                type="text"
                                                value={newComponent.testName}
                                                onChange={(e) => setNewComponent(prev => ({ ...prev, testName: e.target.value }))}
                                                placeholder="Tên test"
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <input
                                                type="text"
                                                value={newComponent.referenceRange}
                                                onChange={(e) => setNewComponent(prev => ({ ...prev, referenceRange: e.target.value }))}
                                                placeholder="Giá trị tham chiếu"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.addComponentBtn}
                                            onClick={handleAddComponent}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                            Thêm
                                        </button>
                                    </div>
                                    </div>
                                )}

                                <div className={styles.componentsList}>
                                    {formData.testComponents.length === 0 ? (
                                        <p className={styles.emptyComponents}>Chưa có test component nào</p>
                                    ) : (
                                        formData.testComponents.map((component, index) => (<div key={index} className={styles.componentItem}>                                            <div className={styles.componentInfo}>
                                                <strong>{component.testName}</strong>
                                                <div className={styles.componentDetails}>
                                                    <span className={styles.referenceRange}>{component.referenceRange}</span>
                                                </div>
                                            </div>
                                            {modalMode !== 'view' && (
                                                <button
                                                    type="button"
                                                    className={styles.removeComponentBtn}
                                                    onClick={() => handleRemoveComponent(index)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Marketing Value Section - Hiển thị chỉ trong chế độ view */}
                            {modalMode === 'view' && formData.testComponents && formData.testComponents.length > 0 && (
                                <div className={styles.formSection}>
                                    <h3>Giá trị gói dịch vụ</h3>

                                    <div className={styles.valueProposition}>
                                        <div className={styles.comparisonTable}>
                                            <div className={styles.comparisonHeader}>
                                                <span>Test Component</span>
                                                <span>Giá lẻ</span>
                                            </div>

                                            {formData.testComponents.map((component, index) => (
                                                <div key={index} className={styles.comparisonRow}>
                                                    <span>{component.testName}</span>
                                                    <span>{component.price ? formatPrice(component.price) : '-'}</span>
                                                </div>
                                            ))}                                        </div>

                                        <div className={styles.marketingPoints}>
                                            <h4>🎯 Lợi ích của gói dịch vụ:</h4>
                                            <ul>
                                                <li>✅ Chẩn đoán toàn diện, chính xác</li>
                                                <li>✅ Một lần làm, đầy đủ kết quả</li>
                                                <li>✅ Tư vấn miễn phí từ chuyên gia</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Actions */}
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={() => setShowModal(false)}
                                >
                                    {modalMode === 'view' ? 'Đóng' : 'Hủy'}
                                </button>

                                {modalMode !== 'view' && (
                                    <button
                                        type="submit"
                                        className={styles.saveBtn}
                                        disabled={actionLoading.form}
                                    >
                                        {actionLoading.form ? (
                                            <>
                                                <LoadingSpinner size="small" />
                                                {modalMode === 'create' ? 'Đang tạo...' : 'Đang lưu...'}
                                            </>
                                        ) : (
                                            modalMode === 'create' ? 'Tạo dịch vụ' : 'Lưu thay đổi'
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <h3>Xác nhận thay đổi trạng thái</h3>
                        </div>
                        <div className={styles.confirmBody}>
                            <p>
                                Bạn có chắc chắn muốn {serviceToDelete?.isActive ? 'vô hiệu hóa' : 'kích hoạt'} dịch vụ
                                <strong> "{serviceToDelete?.name}"</strong>?
                            </p>
                        </div>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleDeleteService}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSTIServices;