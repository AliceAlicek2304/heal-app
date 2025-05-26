import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import './ForgotPassword.css';

const ForgotPassword = ({ onClose, onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code and new password
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [countdown, setCountdown] = useState(0);

    // Gửi email để nhận mã xác thực
    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ email' });
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ email hợp lệ' });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await authService.forgotPassword(email);

            if (response.success) {
                setMessage({
                    type: 'success',
                    text: 'Mã xác thực đã được gửi tới email của bạn'
                });
                setStep(2);
                startCountdown();
            } else {
                setMessage({
                    type: 'error',
                    text: response.message || 'Có lỗi xảy ra, vui lòng thử lại'
                });
            }
        } catch (error) {
            console.error('Error sending reset code:', error);
            setMessage({
                type: 'error',
                text: 'Không thể kết nối đến server'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Gửi lại mã xác thực
    const handleResendCode = async () => {
        if (countdown > 0) return;

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await authService.forgotPassword(email);

            if (response.success) {
                setMessage({
                    type: 'success',
                    text: 'Mã xác thực mới đã được gửi tới email của bạn'
                });
                startCountdown();
            } else {
                setMessage({
                    type: 'error',
                    text: response.message || 'Có lỗi xảy ra, vui lòng thử lại'
                });
            }
        } catch (error) {
            console.error('Error resending code:', error);
            setMessage({
                type: 'error',
                text: 'Không thể kết nối đến server'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Đặt lại mật khẩu
    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!verificationCode || !newPassword) {
            setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin' });
            return;
        }

        if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
            setMessage({ type: 'error', text: 'Mã xác thực phải là 6 chữ số' });
            return;
        }

        // Thêm kiểm tra mật khẩu theo yêu cầu từ backend
        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
        if (!passwordRegex.test(newPassword)) {
            setMessage({
                type: 'error',
                text: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@#$%^&+=)'
            });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự' });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await authService.resetPassword(email, verificationCode, newPassword);

            if (response.success) {
                setMessage({
                    type: 'success',
                    text: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.'
                });
                // Chuyển về trang login sau 3 giây
                setTimeout(() => {
                    onSwitchToLogin();
                    onClose();
                }, 3000);
            } else {
                setMessage({
                    type: 'error',
                    text: response.message || 'Có lỗi xảy ra, vui lòng thử lại'
                });
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setMessage({
                type: 'error',
                text: 'Không thể kết nối đến server'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Đếm ngược để gửi lại mã
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

    // Quay lại bước nhập email
    const handleBackToEmail = () => {
        setStep(1);
        setVerificationCode('');
        setNewPassword('');
        setMessage({ type: '', text: '' });
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-header">
                <h2>Quên mật khẩu</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {step === 1 ? (
                <form onSubmit={handleEmailSubmit} className="forgot-password-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleResetPassword} className="forgot-password-form">
                    <p className="info-text">
                        Mã xác thực đã được gửi đến <strong>{email}</strong>
                    </p>

                    <div className="form-group">
                        <label htmlFor="verificationCode">Mã xác thực</label>
                        <input
                            type="text"
                            id="verificationCode"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Nhập mã 6 chữ số"
                            maxLength={6}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">Mật khẩu mới</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới"
                            disabled={isLoading}
                            required
                        />
                        <small className="password-requirements">
                            Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=)
                        </small>
                    </div>

                    <div className="button-group">
                        <button
                            type="button"
                            className="btn-resend"
                            onClick={handleResendCode}
                            disabled={isLoading || countdown > 0}
                        >
                            {countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi lại mã'}
                        </button>

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>
                    </div>

                    <button
                        type="button"
                        className="btn-back"
                        onClick={handleBackToEmail}
                        disabled={isLoading}
                    >
                        Quay lại
                    </button>
                </form>
            )}

            <div className="form-footer">
                <p>
                    Đã có tài khoản? <button type="button" onClick={onSwitchToLogin} className="link-btn">Đăng nhập</button>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;