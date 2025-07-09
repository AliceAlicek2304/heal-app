import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { paymentInfoService } from '../../../services/paymentInfoService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import styles from './PaymentMethods.module.css';

const PaymentMethods = () => {
    const { user } = useAuth();
    const toast = useToast();
    
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState({
        cardHolderName: '',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        nickname: '',
        isDefault: false
    });

    const [errors, setErrors] = useState({});

    // Load cards on component mount
    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        setLoading(true);
        try {
            const response = await paymentInfoService.getMyCards(() => window.location.hash = '#/login');
            if (response.success) {
                setCards(response.data || []);
            } else {
                toast.error(response.message || 'Không thể tải danh sách thẻ');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải danh sách thẻ');
        } finally {
            setLoading(false);
        }
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

    const handleCardNumberChange = (e) => {
        const formattedValue = paymentInfoService.formatCardNumber(e.target.value);
        setFormData(prev => ({
            ...prev,
            cardNumber: formattedValue
        }));
        
        if (errors.cardNumber) {
            setErrors(prev => ({
                ...prev,
                cardNumber: ''
            }));
        }
    };

    const validateForm = () => {
        const validation = paymentInfoService.validateCard(formData);
        setErrors(validation.errors);
        return validation.isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setProcessing(true);
        try {
            const cardData = {
                ...formData,
                cardNumber: formData.cardNumber.replace(/\s/g, '') // Remove spaces for backend
            };

            let response;
            if (editingCard) {
                response = await paymentInfoService.updateCard(editingCard.paymentInfoId, cardData, () => window.location.hash = '#/login');
            } else {
                response = await paymentInfoService.addCard(cardData, () => window.location.hash = '#/login');
            }

            if (response.success) {
                toast.success(editingCard ? 'Cập nhật thẻ thành công' : 'Thêm thẻ thành công');
                setShowAddModal(false);
                setShowEditModal(false);
                setEditingCard(null);
                resetForm();
                fetchCards();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi lưu thẻ');
        } finally {
            setProcessing(false);
        }
    };

    const handleEdit = (card) => {
        setEditingCard(card);
        setFormData({
            cardHolderName: card.cardHolderName,
            cardNumber: card.cardNumber, // Already masked
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            cvc: '', // CVC is not stored, user must enter it
            nickname: card.nickname || '',
            isDefault: card.isDefault
        });
        setErrors({});
        setShowEditModal(true);
    };

    const handleDelete = async (card) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ này?')) {
            return;
        }

        setProcessing(true);
        try {
            const response = await paymentInfoService.deleteCard(card.paymentInfoId, () => window.location.hash = '#/login');
            if (response.success) {
                toast.success('Xóa thẻ thành công');
                fetchCards();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi xóa thẻ');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi xóa thẻ');
        } finally {
            setProcessing(false);
        }
    };

    const handleSetDefault = async (card) => {
        if (card.isDefault) return;

        setProcessing(true);
        try {
            const response = await paymentInfoService.setDefaultCard(card.paymentInfoId, () => window.location.hash = '#/login');
            if (response.success) {
                toast.success('Đặt thẻ mặc định thành công');
                fetchCards();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi đặt thẻ mặc định');
        } finally {
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setFormData({
            cardHolderName: user?.fullName || '',
            cardNumber: '',
            expiryMonth: '',
            expiryYear: '',
            cvc: '',
            nickname: '',
            isDefault: false
        });
        setErrors({});
    };

    const openAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    const closeModals = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingCard(null);
        resetForm();
    };

    const getCardTypeIcon = (cardType) => {
        switch (cardType) {
            case 'VISA':
                return '💳';
            case 'MASTERCARD':
                return '💳';
            case 'AMEX':
                return '💳';
            default:
                return '💳';
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải danh sách thẻ...</p>
            </div>
        );
    }

    return (
        <div className={styles.paymentMethods}>
            <div className={styles.header}>
                <h2>Quản lý thẻ thanh toán</h2>
                <button 
                    className={styles.addButton}
                    onClick={openAddModal}
                    disabled={processing}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Thêm thẻ mới
                </button>
            </div>

            {cards.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                    </div>
                    <h3>Chưa có thẻ thanh toán</h3>
                    <p>Thêm thẻ để thanh toán nhanh hơn khi đặt lịch xét nghiệm</p>
                    <button 
                        className={styles.addFirstButton}
                        onClick={openAddModal}
                        disabled={processing}
                    >
                        Thêm thẻ đầu tiên
                    </button>
                </div>
            ) : (
                <div className={styles.cardsList}>
                    {cards.map(card => (
                        <div key={card.paymentInfoId} className={`${styles.cardItem} ${card.isDefault ? styles.defaultCard : ''}`}>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardType}>
                                        {getCardTypeIcon(card.cardType)} {card.cardType}
                                    </span>
                                    {card.isDefault && (
                                        <span className={styles.defaultBadge}>Mặc định</span>
                                    )}
                                </div>
                                
                                <div className={styles.cardNumber}>
                                    {card.cardNumber}
                                </div>
                                
                                <div className={styles.cardDetails}>
                                    <div className={styles.cardHolder}>
                                        <span className={styles.label}>Chủ thẻ:</span>
                                        <span>{card.cardHolderName}</span>
                                    </div>
                                    <div className={styles.expiry}>
                                        <span className={styles.label}>Hết hạn:</span>
                                        <span>{card.expiryMonth}/{card.expiryYear}</span>
                                    </div>
                                    {card.nickname && (
                                        <div className={styles.nickname}>
                                            <span className={styles.label}>Tên gợi nhớ:</span>
                                            <span>{card.nickname}</span>
                                        </div>
                                    )}
                                </div>

                                {card.isExpired && (
                                    <div className={styles.expiredWarning}>
                                        ⚠️ Thẻ đã hết hạn
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardActions}>
                                {!card.isDefault && (
                                    <button
                                        className={styles.setDefaultButton}
                                        onClick={() => handleSetDefault(card)}
                                        disabled={processing}
                                    >
                                        Đặt mặc định
                                    </button>
                                )}
                                <button
                                    className={styles.editButton}
                                    onClick={() => handleEdit(card)}
                                    disabled={processing}
                                >
                                    Sửa
                                </button>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(card)}
                                    disabled={processing}
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <div className={styles.modalOverlay} onClick={closeModals}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{editingCard ? 'Sửa thẻ thanh toán' : 'Thêm thẻ mới'}</h3>
                            <button className={styles.closeButton} onClick={closeModals}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="cardHolderName">Tên chủ thẻ *</label>
                                <input
                                    type="text"
                                    id="cardHolderName"
                                    name="cardHolderName"
                                    value={formData.cardHolderName}
                                    onChange={handleInputChange}
                                    placeholder="Nhập tên chủ thẻ"
                                    className={errors.cardHolderName ? styles.error : ''}
                                />
                                {errors.cardHolderName && <span className={styles.errorText}>{errors.cardHolderName}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="cardNumber">Số thẻ *</label>
                                <input
                                    type="text"
                                    id="cardNumber"
                                    name="cardNumber"
                                    value={formData.cardNumber}
                                    onChange={handleCardNumberChange}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength="19"
                                    className={errors.cardNumber ? styles.error : ''}
                                />
                                {errors.cardNumber && <span className={styles.errorText}>{errors.cardNumber}</span>}
                            </div>

                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="expiryMonth">Tháng hết hạn *</label>
                                    <select
                                        id="expiryMonth"
                                        name="expiryMonth"
                                        value={formData.expiryMonth}
                                        onChange={handleInputChange}
                                        className={errors.expiryDate ? styles.error : ''}
                                    >
                                        <option value="">Tháng</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <option key={month} value={month.toString().padStart(2, '0')}>
                                                {month.toString().padStart(2, '0')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="expiryYear">Năm hết hạn *</label>
                                    <select
                                        id="expiryYear"
                                        name="expiryYear"
                                        value={formData.expiryYear}
                                        onChange={handleInputChange}
                                        className={errors.expiryDate ? styles.error : ''}
                                    >
                                        <option value="">Năm</option>
                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                            <option key={year} value={year.toString()}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="cvc">CVC *</label>
                                    <input
                                        type="text"
                                        id="cvc"
                                        name="cvc"
                                        value={formData.cvc}
                                        onChange={handleInputChange}
                                        placeholder="123"
                                        maxLength="4"
                                        className={errors.cvc ? styles.error : ''}
                                    />
                                    {errors.cvc && <span className={styles.errorText}>{errors.cvc}</span>}
                                </div>
                            </div>

                            {errors.expiryDate && <span className={styles.errorText}>{errors.expiryDate}</span>}

                            <div className={styles.formGroup}>
                                <label htmlFor="nickname">Tên gợi nhớ (tùy chọn)</label>
                                <input
                                    type="text"
                                    id="nickname"
                                    name="nickname"
                                    value={formData.nickname}
                                    onChange={handleInputChange}
                                    placeholder="Ví dụ: Thẻ chính, Thẻ phụ..."
                                    maxLength="50"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        checked={formData.isDefault}
                                        onChange={handleInputChange}
                                    />
                                    <span className={styles.checkmark}></span>
                                    Đặt làm thẻ mặc định
                                </label>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={closeModals}
                                    disabled={processing}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <LoadingSpinner size="small" />
                                            {editingCard ? 'Đang cập nhật...' : 'Đang thêm...'}
                                        </>
                                    ) : (
                                        editingCard ? 'Cập nhật thẻ' : 'Thêm thẻ'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethods; 