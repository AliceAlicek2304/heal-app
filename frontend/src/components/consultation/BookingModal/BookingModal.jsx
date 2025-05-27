import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { consultationService } from '../../../services/consultationService';
import { authService } from '../../../services/authService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import styles from './BookingModal.module.css';

const TIME_SLOTS = [
    { value: '8-10', label: '08:00 - 10:00 (2 giờ)' },
    { value: '10-12', label: '10:00 - 12:00 (2 giờ)' },
    { value: '13-15', label: '13:00 - 15:00 (2 giờ)' },
    { value: '15-17', label: '15:00 - 17:00 (2 giờ)' }
];

const PAYMENT_METHODS = [
    { value: 'COD', label: 'Thanh toán khi nhận dịch vụ (COD)' },
    { value: 'VISA', label: 'Thanh toán bằng thẻ VISA' }
];

const BookingModal = ({ consultant, consultationPrice, onClose, onSuccess, onError, onAuthRequired }) => {
    const toast = useToast();
    const [formData, setFormData] = useState({
        consultantId: consultant.id,
        date: '',
        timeSlot: '',
        paymentMethod: 'COD',
        // VISA fields
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        cardHolderName: ''
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [checkingSlots, setCheckingSlots] = useState(false);
    const [debug, setDebug] = useState('');

    // Set minimum date to tomorrow
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateString = minDate.toISOString().split('T')[0];

    useEffect(() => {
        if (formData.date) {
            fetchAvailableSlots();
        }
    }, [formData.date]);

    const fetchAvailableSlots = async () => {
        try {
            setCheckingSlots(true);
            const response = await consultationService.getAvailableTimeSlots(
                consultant.id,
                formData.date,
                onAuthRequired
            );

            if (response.success) {
                if (Array.isArray(response.data)) {
                    setAvailableSlots(response.data);
                    const availableCount = response.data.filter(slot => slot.available).length;
                    setDebug(`${availableCount}/${response.data.length} slots available`);

                    if (formData.timeSlot) {
                        const isCurrentSlotAvailable = response.data.some(
                            slot => slot.slot === formData.timeSlot && slot.available
                        );
                        if (!isCurrentSlotAvailable) {
                            setFormData(prev => ({ ...prev, timeSlot: '' }));
                        }
                    }
                } else {
                    setAvailableSlots([]);
                    setDebug('Invalid response format');
                }
            } else {
                setAvailableSlots([]);
                toast.error(response.message || 'Không thể tải khung giờ có sẵn');
                setDebug(`Error: ${response.message}`);
            }
        } catch (error) {
            setAvailableSlots([]);
            toast.error('Không thể tải khung giờ có sẵn');
            setDebug(`Exception: ${error.message}`);
        } finally {
            setCheckingSlots(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const calculateTotalPrice = () => {
        if (!formData.timeSlot) return 0;
        const [startHour, endHour] = formData.timeSlot.split('-').map(Number);
        const duration = endHour - startHour;
        return consultationPrice * duration;
    };

    const validateForm = () => {
        if (!formData.date) {
            toast.error('Vui lòng chọn ngày tư vấn');
            return false;
        }

        if (!formData.timeSlot) {
            toast.error('Vui lòng chọn khung giờ');
            return false;
        }

        const selectedSlot = availableSlots.find(slot => slot.slot === formData.timeSlot);
        if (!selectedSlot || !selectedSlot.available) {
            toast.error('Khung giờ đã chọn không còn trống');
            return false;
        }

        if (!formData.paymentMethod) {
            toast.error('Vui lòng chọn phương thức thanh toán');
            return false;
        }

        if (formData.paymentMethod === 'VISA') {
            if (!formData.cardNumber || !formData.expiryMonth || !formData.expiryYear ||
                !formData.cvc || !formData.cardHolderName) {
                toast.error('Vui lòng điền đầy đủ thông tin thẻ');
                return false;
            }

            if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
                toast.error('Số thẻ không hợp lệ');
                return false;
            }

            if (!/^\d{3,4}$/.test(formData.cvc)) {
                toast.error('Mã CVC không hợp lệ');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);
            const consultationData = {
                consultantId: formData.consultantId,
                date: formData.date,
                timeSlot: formData.timeSlot,
                paymentMethod: formData.paymentMethod
            };

            if (formData.paymentMethod === 'VISA') {
                consultationData.cardNumber = formData.cardNumber.replace(/\s/g, '');
                consultationData.expiryMonth = formData.expiryMonth;
                consultationData.expiryYear = formData.expiryYear;
                consultationData.cvc = formData.cvc;
                consultationData.cardHolderName = formData.cardHolderName;
            }

            const response = await consultationService.createConsultation(consultationData, onAuthRequired);

            if (response.success) {
                toast.success('Đặt lịch tư vấn thành công!');
                setTimeout(() => {
                    onSuccess(response.data);
                }, 1000);
            } else {
                const errorMessage = response.message || 'Không thể đặt lịch tư vấn';
                toast.error(errorMessage);
                if (onError) {
                    onError(new Error(errorMessage));
                }
            }
        } catch (error) {
            console.error('Error creating consultation:', error);
            toast.error('Có lỗi xảy ra khi đặt lịch tư vấn');
            if (onError) {
                onError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    const isSlotAvailable = (slotValue) => {
        const slot = availableSlots.find(s => s.slot === slotValue);
        return slot && slot.available;
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    const handleCardNumberChange = (e) => {
        const formattedValue = formatCardNumber(e.target.value);
        setFormData(prev => ({
            ...prev,
            cardNumber: formattedValue
        }));
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.bookingModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <h3>Đặt lịch tư vấn</h3>
                    </div>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Consultant Info */}
                    <div className={styles.consultantSummary}>
                        <img
                            src={authService.getAvatarUrl(consultant.avatar)}
                            alt={consultant.fullName || consultant.username}
                            className={styles.consultantAvatarSmall}
                            onError={(e) => {
                                e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                            }}
                        />
                        <div className={styles.consultantSummaryInfo}>
                            <h4>{consultant.fullName || consultant.username}</h4>
                            <p>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Chuyên gia tư vấn
                            </p>
                        </div>
                        <div className={styles.consultantRating}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                            </svg>
                            <span>Verified</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.bookingForm}>
                        {/* Date Selection */}
                        <div className={styles.formGroup}>
                            <label htmlFor="date" className={styles.formLabel}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Ngày tư vấn *
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                min={minDateString}
                                required
                                disabled={loading}
                                className={styles.formInput}
                            />
                        </div>

                        {/* Time Slot Selection */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                Khung giờ *
                            </label>
                            {checkingSlots ? (
                                <div className={styles.checkingSlots}>
                                    <LoadingSpinner size="small" />
                                    <span>Đang kiểm tra khung giờ có sẵn...</span>
                                </div>
                            ) : (
                                <div className={styles.timeSlots}>
                                    {TIME_SLOTS.map(slot => {
                                        const available = formData.date ? isSlotAvailable(slot.value) : true;
                                        return (
                                            <label
                                                key={slot.value}
                                                className={`${styles.timeSlotOption} ${!available ? styles.unavailable : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="timeSlot"
                                                    value={slot.value}
                                                    checked={formData.timeSlot === slot.value}
                                                    onChange={handleInputChange}
                                                    disabled={!available || loading}
                                                    className={styles.radioInput}
                                                />
                                                <div className={styles.timeSlotLabel}>
                                                    <span className={styles.timeSlotText}>{slot.label}</span>
                                                    {!available && <span className={styles.unavailableText}>(Không có sẵn)</span>}
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="9,11 12,14 22,4"></polyline>
                                                        <path d="M21,12v7a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2V5a2,2 0 0,1,2-2h11"></path>
                                                    </svg>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            <div className={styles.formNote}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                Thời gian hoạt động: 8:00-10:00, 10:00-12:00, 13:00-15:00, 15:00-17:00
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                                Phương thức thanh toán *
                            </label>
                            <div className={styles.paymentMethods}>
                                {PAYMENT_METHODS.map(method => (
                                    <label key={method.value} className={styles.paymentMethodOption}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={method.value}
                                            checked={formData.paymentMethod === method.value}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            className={styles.radioInput}
                                        />
                                        <div className={styles.paymentMethodLabel}>
                                            <div className={styles.paymentIcon}>
                                                {method.value === 'COD' ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                                    </svg>
                                                )}
                                            </div>
                                            <span>{method.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* VISA Card Fields */}
                        {formData.paymentMethod === 'VISA' && (
                            <div className={styles.visaFields}>
                                <div className={styles.visaHeader}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                    </svg>
                                    <h4>Thông tin thẻ VISA</h4>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="cardNumber" className={styles.formLabel}>Số thẻ *</label>
                                    <input
                                        type="text"
                                        id="cardNumber"
                                        name="cardNumber"
                                        value={formData.cardNumber}
                                        onChange={handleCardNumberChange}
                                        placeholder="1234 5678 9012 3456"
                                        maxLength="19"
                                        required
                                        disabled={loading}
                                        className={styles.formInput}
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="expiryMonth" className={styles.formLabel}>Tháng *</label>
                                        <select
                                            id="expiryMonth"
                                            name="expiryMonth"
                                            value={formData.expiryMonth}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            className={styles.formSelect}
                                        >
                                            <option value="">MM</option>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="expiryYear" className={styles.formLabel}>Năm *</label>
                                        <select
                                            id="expiryYear"
                                            name="expiryYear"
                                            value={formData.expiryYear}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                            className={styles.formSelect}
                                        >
                                            <option value="">YYYY</option>
                                            {[...Array(10)].map((_, i) => {
                                                const year = new Date().getFullYear() + i;
                                                return (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="cvc" className={styles.formLabel}>CVC *</label>
                                        <input
                                            type="text"
                                            id="cvc"
                                            name="cvc"
                                            value={formData.cvc}
                                            onChange={handleInputChange}
                                            placeholder="123"
                                            maxLength="4"
                                            required
                                            disabled={loading}
                                            className={styles.formInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="cardHolderName" className={styles.formLabel}>Tên chủ thẻ *</label>
                                    <input
                                        type="text"
                                        id="cardHolderName"
                                        name="cardHolderName"
                                        value={formData.cardHolderName}
                                        onChange={handleInputChange}
                                        placeholder="Nhập tên như trên thẻ"
                                        required
                                        disabled={loading}
                                        className={styles.formInput}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Price Summary */}
                        {formData.timeSlot && (
                            <div className={styles.priceSummary}>
                                <div className={styles.priceHeader}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                    <h4>Chi tiết thanh toán</h4>
                                </div>
                                <div className={styles.priceRow}>
                                    <span>Thời lượng:</span>
                                    <span>{TIME_SLOTS.find(s => s.value === formData.timeSlot)?.label}</span>
                                </div>
                                <div className={styles.priceRow}>
                                    <span>Giá/giờ:</span>
                                    <span>{consultationPrice.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                                <div className={`${styles.priceRow} ${styles.total}`}>
                                    <span>Tổng cộng:</span>
                                    <span>{calculateTotalPrice().toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={onClose}
                        disabled={loading}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handleSubmit}
                        disabled={loading || !formData.timeSlot}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" color="primary" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9,11 12,14 22,4"></polyline>
                                    <path d="M21,12v7a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2V5a2,2 0 0,1,2-2h11"></path>
                                </svg>
                                Đặt lịch tư vấn
                            </>
                        )}
                    </button>
                </div>

                {loading && (
                    <div className={styles.modalLoadingOverlay}>
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;