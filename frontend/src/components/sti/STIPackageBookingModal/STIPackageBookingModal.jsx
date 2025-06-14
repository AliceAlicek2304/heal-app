import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { stiService } from '../../../services/stiService';
import styles from './STIPackageBookingModal.module.css';

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

const STIPackageBookingModal = ({ isOpen, onClose, package: pkg }) => {
    const { user } = useAuth();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrPaymentData, setQrPaymentData] = useState(null);
    const [checkingPayment, setCheckingPayment] = useState(false);

    const [formData, setFormData] = useState({
        packageId: pkg?.packageId,
        appointmentDate: '',
        appointmentTime: '',
        paymentMethod: 'COD',
        customerNotes: '',
        // VISA fields
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        cardHolderName: '',
        // QR fields
        qrPaymentReference: ''
    });    // Auto-fill user information when component mounts
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                cardHolderName: user.fullName || ''
            }));
        }
    }, [user]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0);
    };

    const generateQRCodeUrl = (qrData, amount = 500000) => {
        const bankId = '970422';
        const accountNo = '1234567890';
        const template = 'compact2';
        const description = `HealApp STI Package ${qrData}`;
        const accountName = 'CONG TY TNHH HEALAPP';

        return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
    };

    const handleCheckPaymentStatus = async () => {
        if (!qrPaymentData) return;

        setCheckingPayment(true);
        try {
            const checkResult = await stiService.checkQRPaymentStatus(qrPaymentData.testId);
            if (checkResult.success && checkResult.data.isCompleted) {
                toast.success('Thanh toán thành công!');
                setShowQRModal(false);
                onClose();
            } else {
                toast.info('Chưa nhận được thanh toán. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            toast.error('Có lỗi khi kiểm tra thanh toán');
        } finally {
            setCheckingPayment(false);
        }
    };

    const handleCloseQRModal = () => {
        setShowQRModal(false);
        setQrPaymentData(null);
    }; const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'cardNumber') {
            // Format card number with spaces
            const formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
            if (formattedValue.replace(/\s/g, '').length <= 16) {
                setFormData(prev => ({ ...prev, [name]: formattedValue }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const validateForm = () => {
        if (!formData.appointmentDate || !formData.appointmentTime) {
            toast.error('Vui lòng chọn ngày và giờ hẹn');
            return false;
        }

        if (formData.paymentMethod === 'VISA') {
            if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
                toast.error('Vui lòng nhập đúng số thẻ (16 số)');
                return false;
            }
            if (!formData.expiryMonth || !formData.expiryYear) {
                toast.error('Vui lòng nhập ngày hết hạn thẻ');
                return false;
            }
            if (!formData.cvc || formData.cvc.length < 3) {
                toast.error('Vui lòng nhập mã CVC');
                return false;
            }
            if (!formData.cardHolderName.trim()) {
                toast.error('Vui lòng nhập tên chủ thẻ');
                return false;
            }
        }

        return true;
    }; const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Vui lòng đăng nhập để đặt lịch');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Prepare appointment date time
            const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);

            const bookingData = {
                packageId: pkg.packageId,
                serviceId: null, // Null khi book package
                appointmentDate: appointmentDateTime.toISOString(),
                paymentMethod: formData.paymentMethod,
                customerNotes: formData.customerNotes,
                // VISA fields
                cardNumber: formData.paymentMethod === 'VISA' ? formData.cardNumber.replace(/\s/g, '') : null,
                expiryMonth: formData.paymentMethod === 'VISA' ? formData.expiryMonth : null,
                expiryYear: formData.paymentMethod === 'VISA' ? formData.expiryYear : null,
                cvc: formData.paymentMethod === 'VISA' ? formData.cvc : null,
                cardHolderName: formData.paymentMethod === 'VISA' ? formData.cardHolderName : null,
                // QR fields
                qrPaymentReference: formData.qrPaymentReference || null
            };

            const result = await stiService.bookTest(bookingData);

            if (result.success) {
                if (formData.paymentMethod === 'QR_CODE' && result.data.qrCodeUrl) {
                    // Show QR modal for QR payment
                    setQrPaymentData({
                        testId: result.data.testId,
                        qrCodeUrl: result.data.qrCodeUrl,
                        amount: pkg.packagePrice,
                        reference: result.data.qrPaymentReference
                    });
                    setShowQRModal(true);
                    toast.success('Đặt lịch thành công! Vui lòng quét mã QR để thanh toán.');
                } else if (formData.paymentMethod === 'VISA') {
                    toast.success('Thanh toán và đặt lịch thành công!');
                    onClose();
                } else {
                    toast.success('Đặt lịch thành công! Thanh toán khi nhận dịch vụ.');
                    onClose();
                }

                // Reset form
                setFormData({
                    packageId: pkg?.packageId,
                    appointmentDate: '',
                    appointmentTime: '',
                    paymentMethod: 'COD',
                    customerNotes: '',
                    cardNumber: '',
                    expiryMonth: '',
                    expiryYear: '',
                    cvc: '',
                    cardHolderName: user?.fullName || '',
                    qrPaymentReference: ''
                });
            } else {
                toast.error(result.message || 'Không thể đặt gói combo');
            }
        } catch (error) {
            console.error('Error booking package:', error);
            toast.error('Có lỗi xảy ra khi đặt gói combo');
        } finally {
            setLoading(false);
        }
    };

    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const getTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 17; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 17) {
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }
        return slots;
    };

    if (!isOpen || !pkg) return null;

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Đặt Gói Combo STI</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Package Summary */}
                    <div className={styles.packageSummary}>
                        <div className={styles.packageInfo}>
                            <h4>{pkg.packageName}</h4>
                            <p className={styles.packagePrice}>
                                {formatPrice(pkg.packagePrice)}
                            </p>
                        </div>

                        <div className={styles.servicesIncluded}>
                            <h5>Gói bao gồm:</h5>
                            <ul>
                                {pkg.services?.map((service) => (
                                    <li key={service.serviceId}>
                                        <span className={styles.serviceName}>{service.name}</span>
                                        <span className={styles.componentCount}>
                                            ({service.componentCount} xét nghiệm)
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.totalInfo}>
                            <div className={styles.totalItem}>
                                <span>Tổng số xét nghiệm:</span>
                                <span className={styles.totalValue}>{pkg.totalComponentCount}</span>
                            </div>
                            {pkg.totalIndividualPrice && (
                                <>
                                    <div className={styles.totalItem}>
                                        <span>Giá lẻ:</span>
                                        <span className={styles.originalPrice}>
                                            {formatPrice(pkg.totalIndividualPrice)}
                                        </span>
                                    </div>
                                    <div className={styles.totalItem}>
                                        <span>Tiết kiệm:</span>
                                        <span className={styles.savings}>
                                            {formatPrice(pkg.totalIndividualPrice - pkg.packagePrice)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Booking Form */}
                    <form onSubmit={handleSubmit} className={styles.bookingForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="appointmentDate">Ngày hẹn *</label>
                            <input
                                type="date"
                                id="appointmentDate"
                                name="appointmentDate"
                                value={formData.appointmentDate}
                                onChange={handleInputChange}
                                min={getTomorrowDate()}
                                required
                            />
                        </div>                        <div className={styles.formGroup}>
                            <label htmlFor="appointmentTime">Giờ hẹn *</label>
                            <select
                                id="appointmentTime"
                                name="appointmentTime"
                                value={formData.appointmentTime}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Chọn giờ hẹn</option>
                                {TIME_SLOTS.map((slot) => (
                                    <option key={slot.value} value={slot.value}>
                                        {slot.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="paymentMethod">Phương thức thanh toán *</label>
                            <select
                                id="paymentMethod"
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                required
                            >
                                {PAYMENT_METHODS.map((method) => (
                                    <option key={method.value} value={method.value}>
                                        {method.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* VISA Payment Fields */}
                        {formData.paymentMethod === 'VISA' && (
                            <>
                                <div className={styles.paymentSection}>
                                    <h4>Thông tin thẻ VISA</h4>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="cardNumber">Số thẻ *</label>
                                        <input
                                            type="text"
                                            id="cardNumber"
                                            name="cardNumber"
                                            value={formData.cardNumber}
                                            onChange={handleInputChange}
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={19}
                                            required
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
                                            >
                                                <option value="">Tháng</option>
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const month = (i + 1).toString().padStart(2, '0');
                                                    return (
                                                        <option key={month} value={month}>
                                                            {month}
                                                        </option>
                                                    );
                                                })}
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
                                            >
                                                <option value="">Năm</option>
                                                {Array.from({ length: 10 }, (_, i) => {
                                                    const year = (new Date().getFullYear() + i).toString();
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
                                                maxLength={4}
                                                required
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
                                            placeholder="NGUYEN VAN A"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className={styles.formGroup}>
                            <label htmlFor="customerNotes">Ghi chú</label>
                            <textarea
                                id="customerNotes"
                                name="customerNotes"
                                value={formData.customerNotes}
                                onChange={handleInputChange}
                                placeholder="Nhập ghi chú nếu có..."
                                rows="3"
                            />
                        </div>                        <div className={styles.paymentInfo}>
                            <div className={styles.paymentIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {formData.paymentMethod === 'VISA' ? (
                                        <>
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                            <line x1="1" y1="10" x2="23" y2="10"></line>
                                        </>
                                    ) : formData.paymentMethod === 'QR_CODE' ? (
                                        <>
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <rect x="7" y="7" width="3" height="3"></rect>
                                            <rect x="14" y="7" width="3" height="3"></rect>
                                            <rect x="7" y="14" width="3" height="3"></rect>
                                            <path d="m14 14 3 3"></path>
                                            <path d="m14 17 3-3"></path>
                                        </>
                                    ) : (
                                        <>
                                            <path d="M20 6L9 17l-5-5"></path>
                                        </>
                                    )}
                                </svg>
                            </div>
                            <div className={styles.paymentText}>
                                <p><strong>Thanh toán:</strong> {
                                    formData.paymentMethod === 'COD' ? 'Thanh toán khi nhận dịch vụ' :
                                        formData.paymentMethod === 'VISA' ? 'Thanh toán bằng thẻ VISA' :
                                            'Thanh toán bằng QR Code'
                                }</p>
                                <p className={styles.totalAmount}>
                                    <strong>Tổng tiền: {formatPrice(pkg.packagePrice)}</strong>
                                </p>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={onClose}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className={styles.confirmBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className={styles.spinner}></div>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        Xác nhận đặt lịch
                                    </>
                                )}
                            </button>
                        </div>                    </form>
                </div>
            </div>

            {/* QR Code Payment Modal */}
            {showQRModal && qrPaymentData && (
                <div className={styles.qrModalBackdrop} onClick={handleCloseQRModal}>
                    <div className={styles.qrModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.qrModalHeader}>
                            <h3>Thanh toán QR Code</h3>
                            <button className={styles.qrCloseBtn} onClick={handleCloseQRModal}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.qrModalBody}>
                            <div className={styles.qrCodeContainer}>
                                <img
                                    src={qrPaymentData.qrCodeUrl}
                                    alt="QR Code Payment"
                                    className={styles.qrCodeImage}
                                />
                            </div>

                            <div className={styles.qrPaymentInfo}>
                                <h4>Thông tin thanh toán</h4>
                                <div className={styles.qrPaymentDetails}>
                                    <div className={styles.qrDetailItem}>
                                        <span>Số tiền:</span>
                                        <span className={styles.qrAmount}>{formatPrice(qrPaymentData.amount)}</span>
                                    </div>
                                    <div className={styles.qrDetailItem}>
                                        <span>Mã tham chiếu:</span>
                                        <span className={styles.qrReference}>{qrPaymentData.reference}</span>
                                    </div>
                                </div>
                            </div>                            {/* Manual Banking Info */}
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
                                            {qrPaymentData.reference}
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
                            </div>                            <div className={styles.qrModalActions}>
                                <button
                                    onClick={handleCloseQRModal}
                                    className={styles.qrCancelBtn}
                                >
                                    Thanh toán sau
                                </button>
                                <button
                                    onClick={handleCheckPaymentStatus}
                                    className={styles.checkPaymentBtn}
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
                </div>
            )}
        </div>
    );
};

export default STIPackageBookingModal;
