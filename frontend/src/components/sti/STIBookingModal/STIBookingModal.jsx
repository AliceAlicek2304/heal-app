import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { stiService } from '../../../services/stiService';
import { paymentInfoService } from '../../../services/paymentInfoService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import styles from './STIBookingModal.module.css';

const PAYMENT_METHODS = [
    { value: 'COD', label: 'Thanh toán khi nhận dịch vụ (COD)' },
    { value: 'VISA', label: 'Thanh toán bằng thẻ VISA' },
    { value: 'QR_CODE', label: 'Thanh toán bằng QR Code (Chuyển khoản)' }
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

    // ✅ THÊM STATE CHO QR CODE
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrPaymentData, setQrPaymentData] = useState(null);
    const [checkingPayment, setCheckingPayment] = useState(false);

    // ✅ THÊM STATE CHO SAVED PAYMENT METHODS
    const [savedCards, setSavedCards] = useState([]);
    const [loadingCards, setLoadingCards] = useState(false);
    const [useSavedCard, setUseSavedCard] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);

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
        cardHolderName: '',
        // Saved payment info
        paymentInfoId: null
    });

    const [loading, setLoading] = useState(false);

    // Load saved cards when component mounts
    useEffect(() => {
        if (user) {
            loadSavedCards();
        }
    }, [user]);

    // Load saved payment methods
    const loadSavedCards = async () => {
        setLoadingCards(true);
        try {
            const response = await paymentInfoService.getMyCards(() => window.location.hash = '#/login');
            if (response.success) {
                setSavedCards(response.data || []);
                // Auto-select default card if available
                const defaultCard = response.data?.find(card => card.isDefault);
                if (defaultCard) {
                    setSelectedCardId(defaultCard.paymentInfoId);
                    setUseSavedCard(true);
                }
            }
        } catch (error) {
            console.error('Error loading saved cards:', error);
        } finally {
            setLoadingCards(false);
        }
    };

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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const generateQRCodeUrl = (qrData, amount = 500000) => {
        if (!qrData) return null;

        // Fallback QR generators
        const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&margin=10&data=${encodeURIComponent(`STK: 0349079940\nTen: NGUYEN VAN CUONG\nNH: MB Bank\nST: ${amount.toLocaleString()}\nND: ${qrData}`)}`;

        return qrPaymentData?.qrCodeUrl || fallbackQR;
    };

    const handleCheckPaymentStatus = async () => {
        if (!qrPaymentData?.qrReference) {
            toast.error('Không tìm thấy thông tin QR để kiểm tra');
            return;
        }

        try {
            setCheckingPayment(true);
            const response = await stiService.checkQRPaymentStatus(qrPaymentData.qrReference, () => {
                window.location.hash = '#/login';
            });

            if (response.success) {
                if (response.data?.status === 'COMPLETED' || response.data?.paymentStatus === 'COMPLETED') {
                    toast.success('Thanh toán thành công!');
                    setShowQRModal(false);
                    setTimeout(() => {
                        onSuccess({
                            ...qrPaymentData,
                            paymentStatus: 'COMPLETED'
                        });
                    }, 1000);
                } else {
                    toast.info('Chưa nhận được thanh toán. Vui lòng thử lại sau.');
                }
            } else {
                toast.error(response.message || 'Không thể kiểm tra trạng thái thanh toán');
            }
        } catch (error) {
            console.error('Error checking payment:', error);
            toast.error('Có lỗi xảy ra khi kiểm tra thanh toán');
        } finally {
            setCheckingPayment(false);
        }
    };

    const handleCloseQRModal = () => {
        setShowQRModal(false);
        setQrPaymentData(null);
        // Close main modal and show success (user can pay later)
        onClose();
    };

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
                serviceId: parseInt(formData.serviceId),
                appointmentDate: appointmentDateTime,
                paymentMethod: formData.paymentMethod,
                customerNotes: formData.notes || ''
            };

            // Add VISA fields if payment method is VISA
            if (formData.paymentMethod === 'VISA') {
                if (useSavedCard && selectedCardId) {
                    // Use saved payment method
                    testData.paymentInfoId = selectedCardId;
                    testData.cvc = formData.cvc; // CVC is still required for security
                } else {
                    // Use manually entered card info
                    testData.cardNumber = formData.cardNumber.replace(/\s/g, '');
                    testData.expiryMonth = formData.expiryMonth;
                    testData.expiryYear = formData.expiryYear;
                    testData.cvc = formData.cvc;
                    testData.cardHolderName = formData.cardHolderName;
                }
            }

            const response = await stiService.bookTest(testData, onAuthRequired);

            if (response.success) {
                // ✅ XỬ LÝ RESPONSE CHO QR CODE
                if (formData.paymentMethod === 'QR_CODE' && response.data?.paymentStatus === 'PENDING') {
                    // Show QR Modal for payment
                    setQrPaymentData({
                        testId: response.data.testId,
                        paymentId: response.data.paymentId,
                        qrReference: response.data.qrPaymentReference,
                        qrCodeUrl: response.data.qrCodeUrl,
                        amount: service.price,
                        expiresAt: response.data.qrExpiresAt
                    });
                    setShowQRModal(true);
                    toast.success('Đặt lịch thành công! Vui lòng thanh toán bằng QR Code.');
                } else {
                    // COD hoặc VISA thành công
                    toast.success('Đặt lịch xét nghiệm thành công!');
                    setTimeout(() => {
                        onSuccess(response.data);
                    }, 1000);
                }
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
        <>
            {/* ✅ MAIN BOOKING MODAL */}
            <div className={styles.modalBackdrop} onClick={onClose}>
                <div className={styles.stiBookingModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3>Đặt lịch xét nghiệm STI</h3>
                        <button className={styles.modalCloseBtn} onClick={onClose}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        {/* Service Summary */}
                        <div className={styles.serviceSummary}>
                            <h4>{service.name || service.serviceName}</h4>
                            <p>{service.description || 'Dịch vụ xét nghiệm STI chuyên nghiệp'}</p>

                            {/* Component Count */}
                            {(service.componentCount || service.testComponents?.length) && (
                                <div className={styles.componentInfo}>
                                    <span className={styles.componentLabel}>Số lượng xét nghiệm:</span>
                                    <span className={styles.componentValue}>
                                        {service.componentCount || service.testComponents?.length || 0} xét nghiệm
                                    </span>
                                </div>
                            )}

                            <div className={styles.priceSummary}>
                                <span className={styles.priceLabel}>Giá dịch vụ:</span>
                                <span className={styles.priceValue}>
                                    {service.price ?
                                        `${service.price.toLocaleString('vi-VN')} VNĐ` :
                                        'Liên hệ'
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Booking Form */}
                        <form onSubmit={handleSubmit} className={styles.bookingForm}>
                            {/* Date and Time Selection */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
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

                                <div className={styles.formGroup}>
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
                            <div className={styles.formSection}>
                                <h4>Thông tin bệnh nhân</h4>

                                <div className={styles.formGroup}>
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
                                        className={styles.readonlyField}
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
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
                                            className={styles.readonlyField}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
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
                                            className={styles.readonlyField}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
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
                            <div className={styles.formSection}>
                                <h4>Phương thức thanh toán</h4>
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
                                            />
                                            <span className={styles.paymentMethodLabel}>{method.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ✅ QR CODE INFO SECTION */}
                            {formData.paymentMethod === 'QR_CODE' && (
                                <div className={`${styles.formSection} ${styles.qrCodeInfo}`}>
                                    <h4>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="7"></rect>
                                            <rect x="14" y="3" width="7" height="7"></rect>
                                            <rect x="14" y="14" width="7" height="7"></rect>
                                            <rect x="3" y="14" width="7" height="7"></rect>
                                        </svg>
                                        Thanh toán QR Code
                                    </h4>
                                    <div className={styles.qrCodeInfoContent}>
                                        <div className={styles.qrInfoItem}>
                                            <strong>🏦 Ngân hàng:</strong> MB Bank
                                        </div>
                                        <div className={styles.qrInfoItem}>
                                            <strong>📱 Số tài khoản:</strong> 0349079940
                                        </div>
                                        <div className={styles.qrInfoItem}>
                                            <strong>👤 Chủ tài khoản:</strong> NGUYEN VAN CUONG
                                        </div>
                                        <div className={styles.qrInfoItem}>
                                            <strong>💰 Số tiền:</strong> {formatPrice(service.price || 500000)}
                                        </div>
                                        <div className={styles.qrInfoNote}>
                                            <strong>📝 Lưu ý:</strong> Sau khi đặt lịch, bạn sẽ nhận được mã QR để thanh toán.
                                            Bạn có thể thanh toán ngay hoặc thanh toán sau trong mục "Lịch sử xét nghiệm".
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* VISA Card Fields */}
                            {formData.paymentMethod === 'VISA' && (
                                <div className={`${styles.formSection} ${styles.visaFields}`}>
                                    <h4>Thông tin thẻ VISA</h4>

                                    {/* Saved Cards Selection */}
                                    {savedCards.length > 0 && (
                                        <div className={styles.savedCardsSection}>
                                            <div className={styles.savedCardsHeader}>
                                                <h5>Thẻ đã lưu</h5>
                                                <label className={styles.savedCardToggle}>
                                                    <input
                                                        type="checkbox"
                                                        checked={useSavedCard}
                                                        onChange={(e) => {
                                                            setUseSavedCard(e.target.checked);
                                                            if (!e.target.checked) {
                                                                setSelectedCardId(null);
                                                                setFormData(prev => ({ ...prev, paymentInfoId: null }));
                                                            }
                                                        }}
                                                        disabled={loading}
                                                    />
                                                    <span>Sử dụng thẻ đã lưu</span>
                                                </label>
                                            </div>

                                            {useSavedCard && (
                                                <div className={styles.savedCardsList}>
                                                    {savedCards.map(card => (
                                                        <div
                                                            key={card.paymentInfoId}
                                                            className={`${styles.savedCardItem} ${selectedCardId === card.paymentInfoId ? styles.selected : ''}`}
                                                            onClick={() => {
                                                                setSelectedCardId(card.paymentInfoId);
                                                                setFormData(prev => ({ 
                                                                    ...prev, 
                                                                    paymentInfoId: card.paymentInfoId,
                                                                    cardHolderName: card.cardHolderName
                                                                }));
                                                            }}
                                                        >
                                                            <div className={styles.cardInfo}>
                                                                <div className={styles.cardType}>
                                                                    💳 {card.cardType || 'VISA'}
                                                                </div>
                                                                <div className={styles.cardNumber}>
                                                                    {card.cardNumber}
                                                                </div>
                                                                <div className={styles.cardDetails}>
                                                                    <span>{card.cardHolderName}</span>
                                                                    <span>Hết hạn: {card.expiryMonth}/{card.expiryYear}</span>
                                                                </div>
                                                                {card.isDefault && (
                                                                    <div className={styles.defaultBadge}>Mặc định</div>
                                                                )}
                                                            </div>
                                                            <div className={styles.cardRadio}>
                                                                <input
                                                                    type="radio"
                                                                    name="selectedCard"
                                                                    checked={selectedCardId === card.paymentInfoId}
                                                                    onChange={() => {}}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Manual Card Entry */}
                                    {(!useSavedCard || savedCards.length === 0) && (
                                        <>
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
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>

                                            <div className={styles.formRow}>
                                                <div className={styles.formGroup}>
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

                                                <div className={styles.formGroup}>
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
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.formGroup}>
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

                                            {/* Save Card Option */}
                                            <div className={styles.saveCardOption}>
                                                <label className={styles.saveCardToggle}>
                                                    <input
                                                        type="checkbox"
                                                        name="saveCard"
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                    />
                                                    <span>Lưu thẻ này để sử dụng lần sau</span>
                                                </label>
                                            </div>
                                        </>
                                    )}

                                    {/* CVC for Saved Card */}
                                    {useSavedCard && selectedCardId && (
                                        <div className={styles.formGroup}>
                                            <label htmlFor="cvc">CVC *</label>
                                            <input
                                                type="text"
                                                id="cvc"
                                                name="cvc"
                                                value={formData.cvc}
                                                onChange={handleInputChange}
                                                placeholder="Nhập CVC để bảo mật"
                                                maxLength="4"
                                                required
                                                disabled={loading}
                                            />
                                            <small className={styles.cvcNote}>
                                                CVC là bắt buộc để bảo mật khi sử dụng thẻ đã lưu
                                            </small>
                                        </div>
                                    )}
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
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                    </svg>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"></path>
                                    </svg>
                                    {formData.paymentMethod === 'QR_CODE' ? 'Đặt lịch & Tạo QR' : 'Đặt lịch xét nghiệm'}
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

            {/* ✅ QR CODE PAYMENT MODAL */}
            {showQRModal && qrPaymentData && (
                <div className={styles.modalBackdrop} onClick={handleCloseQRModal}>
                    <div className={`${styles.qrPaymentModal} ${styles.stiBookingModal}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                                Thanh toán QR Code - #{qrPaymentData.testId}
                            </h3>
                            <button className={styles.modalCloseBtn} onClick={handleCloseQRModal}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.qrPaymentSection}>
                                <div className={styles.qrHeader}>
                                    <h4>Quét mã QR để thanh toán</h4>
                                    <p>Sử dụng ứng dụng ngân hàng để quét mã QR bên dưới</p>
                                </div>

                                <div className={styles.qrCodeContainer}>
                                    <div className={styles.qrCodeWrapper}>
                                        {qrPaymentData.qrCodeUrl ? (
                                            <img
                                                src={qrPaymentData.qrCodeUrl}
                                                alt="QR Code thanh toán"
                                                className={styles.qrCodeImageLarge}
                                                onError={(e) => {
                                                    console.error('VietQR failed, using fallback');
                                                    if (!e.target.dataset.fallbackAttempted) {
                                                        e.target.dataset.fallbackAttempted = 'true';
                                                        e.target.src = generateQRCodeUrl(qrPaymentData.qrReference, qrPaymentData.amount);
                                                    } else {
                                                        // Show manual banking info
                                                        e.target.style.display = 'none';
                                                        const container = e.target.parentNode;
                                                        container.innerHTML = `
                                                            <div class="${styles.qrCodePlaceholder}">
                                                                <div style="font-size: 48px; margin-bottom: 15px;">🏦</div>
                                                                <h6>Thông tin chuyển khoản</h6>
                                                                <div style="text-align: left; margin: 15px 0;">
                                                                    <div><strong>Ngân hàng:</strong> MB Bank</div>
                                                                    <div><strong>Số TK:</strong> 0349079940</div>
                                                                    <div><strong>Chủ TK:</strong> NGUYEN VAN CUONG</div>
                                                                    <div><strong>Số tiền:</strong> ${formatPrice(qrPaymentData.amount)}</div>
                                                                    <div><strong>Nội dung:</strong> ${qrPaymentData.qrReference}</div>
                                                                </div>
                                                                <small style="color: #666;">
                                                                    QR Code không khả dụng - Chuyển khoản thủ công
                                                                </small>
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                                onLoad={() => {
                                                    console.log('✅ QR Code loaded successfully');
                                                }}
                                            />
                                        ) : (
                                            <div className={styles.qrCodePlaceholder}>
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="7" height="7"></rect>
                                                    <rect x="14" y="3" width="7" height="7"></rect>
                                                    <rect x="14" y="14" width="7" height="7"></rect>
                                                    <rect x="3" y="14" width="7" height="7"></rect>
                                                </svg>
                                                <span>Đang tạo mã QR...</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.qrCodeInfo}>
                                        <div className={styles.paymentAmount}>
                                            <strong>{formatPrice(qrPaymentData.amount)}</strong>
                                        </div>
                                        <div className={styles.paymentNote}>
                                            Mã thanh toán: #{qrPaymentData.testId}
                                        </div>
                                        {qrPaymentData.qrReference && (
                                            <div className={styles.qrReference}>
                                                Mã QR: {qrPaymentData.qrReference}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Manual Banking Info */}
                                <div className={styles.manualPaymentBackup}>
                                    <h6>Hoặc chuyển khoản thủ công:</h6>
                                    <div className={styles.bankingDetails}>
                                        <div className={styles.bankRow}>
                                            <span className={styles.bankLabel}>Ngân hàng:</span>
                                            <span className={styles.bankValue}>MB Bank</span>
                                        </div>
                                        <div className={styles.bankRow}>
                                            <span className={styles.bankLabel}>Số tài khoản:</span>
                                            <span className={styles.bankValue}>0349079940</span>
                                        </div>
                                        <div className={styles.bankRow}>
                                            <span className={styles.bankLabel}>Chủ tài khoản:</span>
                                            <span className={styles.bankValue}>NGUYEN VAN CUONG</span>
                                        </div>
                                        <div className={styles.bankRow}>
                                            <span className={styles.bankLabel}>Số tiền:</span>
                                            <span className={styles.bankValue}>{formatPrice(qrPaymentData.amount)}</span>
                                        </div>
                                        <div className={styles.bankRow}>
                                            <span className={styles.bankLabel}>Nội dung:</span>
                                            <span className={`${styles.bankValue} ${styles.transferContent}`}>
                                                {qrPaymentData.qrReference}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.transferNote}>
                                        <strong>⚠️ Quan trọng:</strong> Vui lòng nhập chính xác nội dung chuyển tiền để hệ thống tự động xác nhận thanh toán.
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className={styles.qrInstructions}>
                                    <h6>Hướng dẫn thanh toán:</h6>
                                    <div className={styles.instructionTabs}>
                                        <div className={styles.instructionTab}>
                                            <strong>🎯 Cách 1: Quét QR Code</strong>
                                            <ol>
                                                <li>Mở ứng dụng ngân hàng</li>
                                                <li>Chọn "Quét mã QR" hoặc "QR Pay"</li>
                                                <li>Quét mã QR phía trên</li>
                                                <li>Kiểm tra thông tin và xác nhận</li>
                                            </ol>
                                        </div>
                                        <div className={styles.instructionTab}>
                                            <strong>💳 Cách 2: Chuyển khoản thủ công</strong>
                                            <ol>
                                                <li>Mở ứng dụng ngân hàng</li>
                                                <li>Chọn "Chuyển tiền" → "Tài khoản khác"</li>
                                                <li>Nhập thông tin tài khoản ở trên</li>
                                                <li><strong>Quan trọng:</strong> Nhập đúng nội dung chuyển tiền</li>
                                                <li>Xác nhận và hoàn tất giao dịch</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                onClick={handleCloseQRModal}
                            >
                                Thanh toán sau
                            </button>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={handleCheckPaymentStatus}
                                disabled={checkingPayment}
                            >
                                {checkingPayment ? (
                                    <>
                                        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                        </svg>
                                        Đang kiểm tra...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                        Kiểm tra thanh toán
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default STIBookingModal;