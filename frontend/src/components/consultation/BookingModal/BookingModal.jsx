import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { consultationService } from '../../../services/consultationService';
import { authService } from '../../../services/authService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import './BookingModal.css';

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
                console.log('Available slots response:', response);

                // Kiểm tra response đúng format
                if (Array.isArray(response.data)) {
                    setAvailableSlots(response.data);

                    // Debug
                    const availableCount = response.data.filter(slot => slot.available).length;
                    setDebug(`${availableCount}/${response.data.length} slots available`);

                    // Reset timeSlot nếu slot đang chọn không available
                    if (formData.timeSlot) {
                        const isCurrentSlotAvailable = response.data.some(
                            slot => slot.slot === formData.timeSlot && slot.available
                        );

                        if (!isCurrentSlotAvailable) {
                            setFormData(prev => ({ ...prev, timeSlot: '' }));
                        }
                    }
                } else {
                    console.error('Invalid response format:', response.data);
                    setAvailableSlots([]);
                    setDebug('Invalid response format');
                }
            } else {
                console.error('Failed to fetch available slots:', response.message);
                setAvailableSlots([]);
                toast.error(response.message || 'Không thể tải khung giờ có sẵn');
                setDebug(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error('Error fetching available slots:', error);
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
        const timeSlot = TIME_SLOTS.find(slot => slot.value === formData.timeSlot);
        if (!timeSlot) return 0;

        // Extract hours from time slot (e.g., "8-10" -> 2 hours)
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

        // Kiểm tra timeSlot có available hay không
        const selectedSlot = availableSlots.find(slot => slot.slot === formData.timeSlot);
        if (!selectedSlot || !selectedSlot.available) {
            toast.error('Khung giờ đã chọn không còn trống');
            return false;
        }

        if (!formData.paymentMethod) {
            toast.error('Vui lòng chọn phương thức thanh toán');
            return false;
        }

        // Validate VISA fields if selected
        if (formData.paymentMethod === 'VISA') {
            if (!formData.cardNumber || !formData.expiryMonth || !formData.expiryYear ||
                !formData.cvc || !formData.cardHolderName) {
                toast.error('Vui lòng điền đầy đủ thông tin thẻ');
                return false;
            }

            // Basic card number validation (16 digits)
            if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
                toast.error('Số thẻ không hợp lệ');
                return false;
            }

            // CVC validation (3-4 digits)
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

            // Add VISA fields if payment method is VISA
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

    // Kiểm tra xem một slot có available không
    const isSlotAvailable = (slotValue) => {
        // Kiểm tra có slot nào trùng với giá trị và có available = true không
        const slot = availableSlots.find(s => s.slot === slotValue);
        return slot && slot.available;
    };

    const formatCardNumber = (value) => {
        // Remove all non-digits
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        // Add space every 4 digits
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
        <div className="modal-backdrop" onClick={onClose}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Đặt lịch tư vấn</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {/* Consultant Info */}
                    <div className="consultant-summary">
                        <img
                            src={authService.getAvatarUrl(consultant.avatar)}
                            alt={consultant.fullName || consultant.username}
                            className="consultant-avatar-small"
                            onError={(e) => {
                                e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                            }}
                        />
                        <div className="consultant-summary-info">
                            <h4>{consultant.fullName || consultant.username}</h4>
                            <p>Chuyên gia tư vấn</p>
                        </div>
                    </div>

                    {/* Debug */}
                    {debug && (
                        <div className="debug-info">
                            <small>{debug}</small>
                        </div>
                    )}

                    {/* Booking Form */}
                    <form onSubmit={handleSubmit} className="booking-form">
                        {/* Date Selection */}
                        <div className="form-group">
                            <label htmlFor="date">Ngày tư vấn *</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                min={minDateString}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Time Slot Selection */}
                        <div className="form-group">
                            <label htmlFor="timeSlot">Khung giờ *</label>
                            {checkingSlots ? (
                                <div className="checking-slots">
                                    <LoadingSpinner size="small" />
                                    <span>Đang kiểm tra khung giờ có sẵn...</span>
                                </div>
                            ) : (
                                <div className="time-slots">
                                    {TIME_SLOTS.map(slot => {
                                        const available = formData.date ? isSlotAvailable(slot.value) : true;
                                        return (
                                            <label
                                                key={slot.value}
                                                className={`time-slot-option ${!available ? 'unavailable' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="timeSlot"
                                                    value={slot.value}
                                                    checked={formData.timeSlot === slot.value}
                                                    onChange={handleInputChange}
                                                    disabled={!available || loading}
                                                />
                                                <span className="time-slot-label">
                                                    {slot.label}
                                                    {!available && <span className="unavailable-text"> (Không có sẵn)</span>}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            <small className="form-note">
                                * Thời gian hoạt động: 8:00-10:00, 10:00-12:00, 13:00-15:00, 15:00-17:00
                            </small>
                        </div>

                        {/* Payment Method */}
                        <div className="form-group">
                            <label htmlFor="paymentMethod">Phương thức thanh toán *</label>
                            <div className="payment-methods">
                                {PAYMENT_METHODS.map(method => (
                                    <label key={method.value} className="payment-method-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={method.value}
                                            checked={formData.paymentMethod === method.value}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                        <span className="payment-method-label">{method.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* VISA Card Fields */}
                        {formData.paymentMethod === 'VISA' && (
                            <div className="visa-fields">
                                <h4>Thông tin thẻ VISA</h4>

                                <div className="form-group">
                                    <label htmlFor="cardNumber">Số thẻ *</label>
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
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="expiryMonth">Tháng hết hạn *</label>
                                        <select
                                            id="expiryMonth"
                                            name="expiryMonth"
                                            value={formData.expiryMonth}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Chọn tháng</option>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="expiryYear">Năm hết hạn *</label>
                                        <select
                                            id="expiryYear"
                                            name="expiryYear"
                                            value={formData.expiryYear}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Chọn năm</option>
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

                                    <div className="form-group">
                                        <label htmlFor="cvc">CVC *</label>
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
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="cardHolderName">Tên chủ thẻ *</label>
                                    <input
                                        type="text"
                                        id="cardHolderName"
                                        name="cardHolderName"
                                        value={formData.cardHolderName}
                                        onChange={handleInputChange}
                                        placeholder="Nhập tên như trên thẻ"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Price Summary */}
                        {formData.timeSlot && (
                            <div className="price-summary">
                                <div className="price-row">
                                    <span>Thời lượng:</span>
                                    <span>{TIME_SLOTS.find(s => s.value === formData.timeSlot)?.label}</span>
                                </div>
                                <div className="price-row">
                                    <span>Giá/giờ:</span>
                                    <span>{consultationPrice.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                                <div className="price-row total">
                                    <span>Tổng cộng:</span>
                                    <span>{calculateTotalPrice().toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading || !formData.timeSlot}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-calendar-check"></i>
                                Đặt lịch tư vấn
                            </>
                        )}
                    </button>
                </div>

                {loading && (
                    <div className="modal-loading-overlay">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;