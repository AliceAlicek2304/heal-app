import React, { useState, useEffect } from 'react';
import {
    FaCreditCard,
    FaMoneyBillWave,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationCircle,
    FaQrcode,
    FaUndo
} from 'react-icons/fa';
import { formatDateTime } from '../../../utils/dateUtils';
import { stiService } from '../../../services/stiService';
import styles from './PaymentSection.module.css';

const PAYMENT_METHOD_CONFIG = {
    COD: { label: 'Thanh toán khi nhận dịch vụ', icon: FaMoneyBillWave, color: '#10b981' },
    VISA: { label: 'Thẻ tín dụng/ghi nợ', icon: FaCreditCard, color: '#1e40af' },
    QR_CODE: { label: 'QR Code', icon: FaQrcode, color: '#7c3aed' }
};

const PAYMENT_STATUS_CONFIG = {
    PENDING: { label: 'Chờ thanh toán', icon: FaClock, color: '#f59e0b' },
    PROCESSING: { label: 'Đang xử lý', icon: FaClock, color: '#3b82f6' },
    COMPLETED: { label: 'Đã thanh toán', icon: FaCheckCircle, color: '#10b981' },
    FAILED: { label: 'Thất bại', icon: FaTimesCircle, color: '#ef4444' },
    EXPIRED: { label: 'Hết hạn', icon: FaExclamationCircle, color: '#6b7280' },
    REFUNDED: { label: 'Đã hoàn tiền', icon: FaUndo, color: '#3b82f6' }
};

const PaymentSection = ({ serviceType, serviceId }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); useEffect(() => {
        loadPayments();
    }, [serviceType, serviceId]); const loadPayments = async () => {
        if (!serviceType || !serviceId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await stiService.getPaymentsByService(serviceType, serviceId);

            if (response.success) {
                setPayments(response.data || []);
            } else {
                setError(response.message || 'Không thể tải thông tin thanh toán');
            }
        } catch (error) {
            console.error('Error loading payments:', error);
            setError('Lỗi khi tải thông tin thanh toán');
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getPaymentMethodInfo = (method) => {
        return PAYMENT_METHOD_CONFIG[method] || {
            label: method,
            icon: FaMoneyBillWave,
            color: '#6b7280'
        };
    };

    const getPaymentStatusInfo = (status) => {
        return PAYMENT_STATUS_CONFIG[status] || {
            label: status,
            icon: FaExclamationCircle,
            color: '#6b7280'
        };
    };

    if (loading) {
        return (
            <div className={styles.paymentSection}>
                <h3 className={styles.sectionTitle}>
                    <FaMoneyBillWave className={styles.sectionIcon} />
                    Thông tin thanh toán
                </h3>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải thông tin thanh toán...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.paymentSection}>
                <h3 className={styles.sectionTitle}>
                    <FaMoneyBillWave className={styles.sectionIcon} />
                    Thông tin thanh toán
                </h3>
                <div className={styles.error}>
                    <FaTimesCircle className={styles.errorIcon} />
                    <p>{error}</p>
                </div>
            </div>
        );
    } if (payments.length === 0) {
        return (
            <div className={styles.paymentSection}>
                <h3 className={styles.sectionTitle}>
                    <FaMoneyBillWave className={styles.sectionIcon} />
                    Thông tin thanh toán
                </h3>
                <div className={styles.noPayments}>
                    <FaMoneyBillWave className={styles.noPaymentsIcon} />
                    <p>Chưa có thông tin thanh toán</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.paymentSection}>
            <h3 className={styles.sectionTitle}>
                <FaMoneyBillWave className={styles.sectionIcon} />
                Thông tin thanh toán ({payments.length})
            </h3>

            <div className={styles.paymentsContainer}>
                {payments.map((payment) => {
                    const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
                    const statusInfo = getPaymentStatusInfo(payment.paymentStatus);
                    const MethodIcon = methodInfo.icon;
                    const StatusIcon = statusInfo.icon;

                    return (
                        <div key={payment.paymentId} className={styles.paymentCard}>
                            <div className={styles.paymentHeader}>
                                <div className={styles.paymentId}>
                                    #PAY{payment.paymentId}
                                </div>
                                <div
                                    className={styles.paymentStatus}
                                    style={{ backgroundColor: statusInfo.color }}
                                >
                                    <StatusIcon className={styles.statusIcon} />
                                    {statusInfo.label}
                                </div>
                            </div>

                            <div className={styles.paymentDetails}>
                                <div className={styles.paymentRow}>
                                    <div className={styles.paymentLabel}>Phương thức:</div>
                                    <div className={styles.paymentValue}>
                                        <MethodIcon
                                            className={styles.methodIcon}
                                            style={{ color: methodInfo.color }}
                                        />
                                        {methodInfo.label}
                                    </div>
                                </div>

                                <div className={styles.paymentRow}>
                                    <div className={styles.paymentLabel}>Số tiền:</div>
                                    <div className={styles.paymentAmount}>
                                        {formatAmount(payment.amount)}
                                    </div>
                                </div>

                                <div className={styles.paymentRow}>
                                    <div className={styles.paymentLabel}>Ngày tạo:</div>
                                    <div className={styles.paymentValue}>
                                        {formatDateTime(payment.createdAt)}
                                    </div>
                                </div>

                                {payment.paidAt && (
                                    <div className={styles.paymentRow}>
                                        <div className={styles.paymentLabel}>Ngày thanh toán:</div>
                                        <div className={styles.paymentValue}>
                                            {formatDateTime(payment.paidAt)}
                                        </div>
                                    </div>
                                )}

                                {payment.transactionId && (
                                    <div className={styles.paymentRow}>
                                        <div className={styles.paymentLabel}>Mã giao dịch:</div>
                                        <div className={styles.paymentValue}>
                                            {payment.transactionId}
                                        </div>
                                    </div>
                                )}

                                {payment.refundedAt && (
                                    <div className={styles.paymentRow}>
                                        <div className={styles.paymentLabel}>Ngày hoàn tiền:</div>
                                        <div className={styles.paymentValue}>
                                            {formatDateTime(payment.refundedAt)}
                                        </div>
                                    </div>
                                )}

                                {payment.refundAmount && (
                                    <div className={styles.paymentRow}>
                                        <div className={styles.paymentLabel}>Số tiền hoàn:</div>
                                        <div className={styles.paymentAmount}>
                                            {formatAmount(payment.refundAmount)}
                                        </div>
                                    </div>
                                )}

                                {payment.description && (
                                    <div className={styles.paymentRow}>
                                        <div className={styles.paymentLabel}>Mô tả:</div>
                                        <div className={styles.paymentValue}>
                                            {payment.description}
                                        </div>
                                    </div>
                                )}

                                {payment.notes && (
                                    <div className={styles.paymentRow}>
                                        <div className={styles.paymentLabel}>Ghi chú:</div>
                                        <div className={styles.paymentValue}>
                                            {payment.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PaymentSection;
