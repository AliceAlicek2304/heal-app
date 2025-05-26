import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { stiService } from '../../../services/stiService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import './STIBookingModal.css';

const PAYMENT_METHODS = [
    { value: 'COD', label: 'Thanh toán khi nhận dịch vụ (COD)' },
    { value: 'VISA', label: 'Thanh toán bằng thẻ VISA' }
];

const TIME_SLOTS = [
    { value: '08:00', label: '08:00 - 09:00' },
    { value: '09:00', label: '09:00 - 10:00' },
    { value: '10:00', label: '10:00 - 11:00' },
    { value: '11:00', label: '11:00 - 12:00' },
    { value: '13:00', label: '13:00 - 14:00' },
    { value: '14:00', label: '14:00 - 15:00' },
    { value: '15:00', label: '15:00 - 16:00' },
    { value: '16:00', label: '16:00 - 17:00' }
];

const STIBookingModal = ({ service, onClose, onSuccess, onError, onAuthRequired }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [formData, setFormData] = useState({
        serviceId: service.serviceId,
        appointmentDate: '',
        appointmentTime: '',
        paymentMethod: 'COD',
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        notes: '',
        // VISA fields
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        cardHolderName: ''
    });

    const [loading, setLoading] = useState(false);

    // Set minimum date to tomorrow
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateString = minDate.toISOString().split('T')[0];

    // Auto-fill user information when component mounts
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                patientName: user.fullName || user.username || '',
                patientPhone: user.phone || '',
                patientEmail: user.email || ''
            }));
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

    const validateForm = () => {
        if (!formData.appointmentDate) {
            toast.error('Vui lòng chọn ngày hẹn');
            return false;
        }

        if (!formData.appointmentTime) {
            toast.error('Vui lòng chọn giờ hẹn');
            return false;
        }

        if (!formData.patientName.trim()) {
            toast.error('Thiếu thông tin tên bệnh nhân');
            return false;
        }

        if (!formData.patientEmail.trim()) {
            toast.error('Thiếu thông tin email');
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

            // Combine date and time into LocalDateTime format for appointmentDate
            const appointmentDateTime = `${formData.appointmentDate}T${formData.appointmentTime}:00`;

            const testData = {
                serviceId: parseInt(formData.serviceId), // Ensure it's a number
                appointmentDate: appointmentDateTime, // Backend expects LocalDateTime in appointmentDate field
                paymentMethod: formData.paymentMethod,
                customerNotes: formData.notes || '' // Backend uses customerNotes, not notes
            };

            // Add VISA fields if payment method is VISA
            if (formData.paymentMethod === 'VISA') {
                testData.cardNumber = formData.cardNumber.replace(/\s/g, '');
                testData.expiryMonth = formData.expiryMonth;
                testData.expiryYear = formData.expiryYear;
                testData.cvc = formData.cvc;
                testData.cardHolderName = formData.cardHolderName;
            }

            console.log('Sending test data:', testData); // Debug log

            const response = await stiService.bookTest(testData, onAuthRequired);

            if (response.success) {
                toast.success('Đặt lịch xét nghiệm thành công!');
                setTimeout(() => {
                    onSuccess(response.data);
                }, 1000);
            } else {
                const errorMessage = response.message || 'Không thể đặt lịch xét nghiệm';
                toast.error(errorMessage);
                if (onError) {
                    onError(new Error(errorMessage));
                }
            }
        } catch (error) {
            console.error('Error booking STI test:', error);
            toast.error('Có lỗi xảy ra khi đặt lịch xét nghiệm');
            if (onError) {
                onError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="sti-booking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Đặt lịch xét nghiệm STI</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {/* Service Summary */}
                    <div className="service-summary">
                        <h4>{service.name || service.serviceName}</h4>
                        <p>{service.description || 'Dịch vụ xét nghiệm STI chuyên nghiệp'}</p>

                        {/* Component Count */}
                        {(service.componentCount || service.testComponents?.length) && (
                            <div className="component-info">
                                <span className="component-label">Số lượng xét nghiệm:</span>
                                <span className="component-value">
                                    {service.componentCount || service.testComponents?.length || 0} xét nghiệm
                                </span>
                            </div>
                        )}

                        <div className="price-summary">
                            <span className="price-label">Giá dịch vụ:</span>
                            <span className="price-value">
                                {service.price ?
                                    `${service.price.toLocaleString('vi-VN')} VNĐ` :
                                    'Liên hệ'
                                }
                            </span>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <form onSubmit={handleSubmit} className="booking-form">
                        {/* Date and Time Selection */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="appointmentDate">Ngày hẹn *</label>
                                <input
                                    type="date"
                                    id="appointmentDate"
                                    name="appointmentDate"
                                    value={formData.appointmentDate}
                                    onChange={handleInputChange}
                                    min={minDateString}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="appointmentTime">Giờ hẹn *</label>
                                <select
                                    id="appointmentTime"
                                    name="appointmentTime"
                                    value={formData.appointmentTime}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Chọn giờ</option>
                                    {TIME_SLOTS.map(slot => (
                                        <option key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Patient Information */}
                        <div className="form-section">
                            <h4>Thông tin bệnh nhân</h4>

                            <div className="form-group">
                                <label htmlFor="patientName">Họ và tên *</label>
                                <input
                                    type="text"
                                    id="patientName"
                                    name="patientName"
                                    value={formData.patientName}
                                    onChange={handleInputChange}
                                    placeholder="Tên từ tài khoản"
                                    readOnly
                                    disabled={true}
                                    className="readonly-field"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="patientPhone">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        id="patientPhone"
                                        name="patientPhone"
                                        value={formData.patientPhone}
                                        onChange={handleInputChange}
                                        placeholder="Số điện thoại từ tài khoản"
                                        readOnly
                                        disabled={true}
                                        className="readonly-field"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="patientEmail">Email *</label>
                                    <input
                                        type="email"
                                        id="patientEmail"
                                        name="patientEmail"
                                        value={formData.patientEmail}
                                        onChange={handleInputChange}
                                        placeholder="Email từ tài khoản"
                                        readOnly
                                        disabled={true}
                                        className="readonly-field"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="notes">Ghi chú</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Thêm ghi chú cho cuộc hẹn (nếu có)"
                                    rows="3"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="form-section">
                            <h4>Phương thức thanh toán</h4>
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
                            <div className="form-section visa-fields">
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
                                            <option value="">Tháng</option>
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
                                            <option value="">Năm</option>
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
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-calendar-check"></i>
                                Đặt lịch xét nghiệm
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

export default STIBookingModal;