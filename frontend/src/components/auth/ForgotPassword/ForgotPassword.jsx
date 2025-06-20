import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import { useToast } from '../../../contexts/ToastContext';
import styles from './ForgotPassword.module.css';

const ForgotPassword = ({ onClose, onSwitchToLogin }) => {
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Vui lòng nhập địa chỉ email');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            toast.error('Vui lòng nhập địa chỉ email hợp lệ');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.forgotPassword(email);

            if (response.success) {
                toast.success('Mã xác thực đã được gửi tới email của bạn', 6000);
                setStep(2);
                startCountdown();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra, vui lòng thử lại');
            }
        } catch (error) {
            console.error('Error sending reset code:', error);
            toast.error('Không thể kết nối đến server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;

        setIsLoading(true);

        try {
            const response = await authService.forgotPassword(email);

            if (response.success) {
                toast.success('Mã xác thực mới đã được gửi tới email của bạn', 6000);
                startCountdown();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra, vui lòng thử lại');
            }
        } catch (error) {
            console.error('Error resending code:', error);
            toast.error('Không thể kết nối đến server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!verificationCode || !newPassword) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
            toast.error('Mã xác thực phải là 6 chữ số');
            return;
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
        if (!passwordRegex.test(newPassword)) {
            toast.error('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@#$%^&+=)', 8000);
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.resetPassword(email, verificationCode, newPassword);

            if (response.success) {
                toast.success('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.', 8000);
                setTimeout(() => {
                    onSwitchToLogin();
                    onClose();
                }, 3000);
            } else {
                toast.error(response.message || 'Có lỗi xảy ra, vui lòng thử lại');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Không thể kết nối đến server');
        } finally {
            setIsLoading(false);
        }
    };

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(prevCount => {
                if (prevCount <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prevCount - 1;
            });
        }, 1000);
    };

    const handleBackToEmail = () => {
        setStep(1);
        setVerificationCode('');
        setNewPassword('');
    }; const handleClose = () => {
        toast.clearAllToasts();
        onClose();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Quên mật khẩu</h2>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {step === 1 ? (
                <form onSubmit={handleEmailSubmit} className={styles.form}>
                    <div className={styles.stepIndicator}>
                        <div className={`${styles.step} ${styles.active}`}>1</div>
                        <div className={styles.stepLine}></div>
                        <div className={styles.step}>2</div>
                    </div>

                    <div className={styles.description}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <h3>Nhập email của bạn</h3>
                        <p>Chúng tôi sẽ gửi mã xác thực đến email để bạn có thể đặt lại mật khẩu</p>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            Email của bạn
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            disabled={isLoading}
                            className={styles.input}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={isLoading || !email}
                    >
                        {isLoading ? (
                            <>
                                <div className={styles.spinner}></div>
                                Đang gửi mã...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 2L11 13"></path>
                                    <polygon points="22,2 15,22 11,13 2,9"></polygon>
                                </svg>
                                Gửi mã xác thực
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleResetPassword} className={styles.form}>
                    <div className={styles.stepIndicator}>
                        <div className={`${styles.step} ${styles.completed}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                        </div>
                        <div className={`${styles.stepLine} ${styles.completed}`}></div>
                        <div className={`${styles.step} ${styles.active}`}>2</div>
                    </div>

                    <div className={styles.description}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                            <circle cx="12" cy="16" r="1"></circle>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <h3>Nhập mã xác thực</h3>
                        <p>Mã xác thực đã được gửi đến <strong>{email}</strong></p>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="verificationCode" className={styles.label}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                                <circle cx="12" cy="16" r="1"></circle>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Mã xác thực (6 chữ số)
                        </label>
                        <input
                            type="text"
                            id="verificationCode"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            maxLength={6}
                            disabled={isLoading}
                            className={styles.input}
                            style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="newPassword" className={styles.label}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới"
                            disabled={isLoading}
                            className={styles.input}
                            required
                        />
                        <div className={styles.passwordRequirements}>
                            <div className={styles.requirementsList}>
                                <div className={`${styles.requirement} ${newPassword.length >= 6 ? styles.valid : ''}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                    Ít nhất 6 ký tự
                                </div>
                                <div className={`${styles.requirement} ${/[a-z]/.test(newPassword) ? styles.valid : ''}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                    Chữ thường (a-z)
                                </div>
                                <div className={`${styles.requirement} ${/[A-Z]/.test(newPassword) ? styles.valid : ''}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                    Chữ hoa (A-Z)
                                </div>
                                <div className={`${styles.requirement} ${/[0-9]/.test(newPassword) ? styles.valid : ''}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                    Số (0-9)
                                </div>
                                <div className={`${styles.requirement} ${/[@#$%^&+=]/.test(newPassword) ? styles.valid : ''}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                    Ký tự đặc biệt (@#$%^&+=)
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.buttonGroup}>
                        <button
                            type="button"
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={handleResendCode}
                            disabled={isLoading || countdown > 0}
                        >
                            {countdown > 0 ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12,6 12,12 16,14"></polyline>
                                    </svg>
                                    Gửi lại ({countdown}s)
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                        <path d="M21 3v5h-5"></path>
                                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                        <path d="M3 21v-5h5"></path>
                                    </svg>
                                    Gửi lại mã
                                </>
                            )}
                        </button>

                        <button
                            type="submit"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            disabled={isLoading || !verificationCode || !newPassword}
                        >
                            {isLoading ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    Đang đặt lại...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                    Đặt lại mật khẩu
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        type="button"
                        className={styles.btnBack}
                        onClick={handleBackToEmail}
                        disabled={isLoading}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12,19 5,12 12,5"></polyline>
                        </svg>
                        Quay lại
                    </button>
                </form>
            )}

            <div className={styles.footer}>
                <p>
                    Đã có tài khoản?
                    <button type="button" onClick={onSwitchToLogin} className={styles.linkBtn}>
                        Đăng nhập ngay
                    </button>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;