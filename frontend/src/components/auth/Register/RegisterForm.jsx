import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import './RegisterForm.css';

const RegisterForm = ({ onClose, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        birthDay: '',
        password: '',
        confirmPassword: '',
        verificationCode: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    // Xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Kiểm tra độ mạnh mật khẩu khi nhập password
        if (name === 'password') {
            checkPasswordStrength(value);
        }

        // Xóa lỗi khi người dùng nhập lại
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Kiểm tra độ mạnh mật khẩu
    const checkPasswordStrength = (password) => {
        setPasswordStrength({
            hasMinLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        });
    };

    // Validate email
    const validateEmail = () => {
        if (!formData.email.trim()) {
            setErrors({ email: 'Email không được để trống' });
            return false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setErrors({ email: 'Email không hợp lệ' });
            return false;
        }
        return true;
    };

    // Validate mật khẩu với yêu cầu mới
    const validatePassword = (password) => {
        const errors = [];

        if (!password) {
            return ['Mật khẩu không được để trống'];
        }

        if (password.length < 8) {
            errors.push('Mật khẩu phải có ít nhất 8 ký tự');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất 1 chữ cái viết thường');
        }

        if (!/\d/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất 1 chữ số');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)');
        }

        return errors;
    };

    // Validate toàn bộ form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ và tên không được để trống';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Tên đăng nhập không được để trống';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email không được để trống';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Số điện thoại không được để trống';
        } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        if (!formData.birthDay) {
            newErrors.birthDay = 'Ngày sinh không được để trống';
        }

        // Validate mật khẩu với yêu cầu mới
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
            newErrors.password = passwordErrors[0]; // Hiển thị lỗi đầu tiên
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (isCodeSent && !formData.verificationCode.trim()) {
            newErrors.verificationCode = 'Vui lòng nhập mã xác thực';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Gửi mã xác thực
    const handleSendCode = async () => {
        if (!validateEmail()) {
            return;
        }

        setIsSendingCode(true);
        setMessage('');

        try {
            const response = await authService.sendVerificationCode(formData.email);

            if (response.success) {
                setMessage('Mã xác thực đã được gửi đến email của bạn');
                setIsCodeSent(true);
                startCountdown();
            } else {
                setMessage(response.message || 'Có lỗi xảy ra khi gửi mã xác thực');
            }
        } catch (error) {
            setMessage('Không thể gửi mã xác thực. Vui lòng thử lại');
            console.error('Error sending verification code:', error);
        } finally {
            setIsSendingCode(false);
        }
    };

    // Đếm ngược thời gian gửi lại mã
    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Gửi lại mã xác thực
    const handleResendCode = async () => {
        if (countdown > 0) return;

        setIsSendingCode(true);
        setMessage('');

        try {
            const response = await authService.sendVerificationCode(formData.email);
            if (response.success) {
                setMessage('Mã xác thực mới đã được gửi');
                startCountdown();
            } else {
                setMessage(response.message || 'Không thể gửi lại mã xác thực');
            }
        } catch (error) {
            setMessage('Không thể gửi lại mã xác thực');
            console.error('Error resending verification code:', error);
        } finally {
            setIsSendingCode(false);
        }
    };

    // Xử lý đăng ký
    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!isCodeSent) {
            setMessage('Vui lòng gửi mã xác thực trước');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const registerData = {
                fullName: formData.fullName,
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                birthDay: formData.birthDay,
                password: formData.password,
                verificationCode: formData.verificationCode,
            };

            const response = await authService.registerUser(registerData);

            if (response.success) {
                setMessage('Đăng ký thành công! Chuyển sang đăng nhập...');
                setTimeout(() => {
                    onSwitchToLogin();
                }, 2000);
            } else {
                setMessage(response.message || 'Đăng ký thất bại');
            }
        } catch (error) {
            setMessage('Có lỗi xảy ra trong quá trình đăng ký');
            console.error('Error registering user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-form">
            <div className="register-header">
                <h2>Đăng ký tài khoản</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <form onSubmit={handleRegister} className="register-form-content">
                <div className="form-group">
                    <label htmlFor="fullName">Họ và tên *</label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={errors.fullName ? 'error' : ''}
                        placeholder="Nhập họ và tên"
                    />
                    {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="username">Tên đăng nhập *</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={errors.username ? 'error' : ''}
                        placeholder="Nhập tên đăng nhập"
                    />
                    {errors.username && <span className="error-message">{errors.username}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <div className="email-input-group">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="Nhập địa chỉ email"
                        />
                        <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={isSendingCode || !formData.email.trim() || countdown > 0}
                            className="send-code-btn"
                        >
                            {isSendingCode ? 'Đang gửi...' :
                                countdown > 0 ? `${countdown}s` :
                                    isCodeSent ? 'Gửi lại' : 'Send Code'}
                        </button>
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                {/* Ô nhập verification code - chỉ hiện khi đã gửi code */}
                {isCodeSent && (
                    <div className="form-group verification-group">
                        <label htmlFor="verificationCode">Mã xác thực *</label>
                        <input
                            type="text"
                            id="verificationCode"
                            name="verificationCode"
                            value={formData.verificationCode}
                            onChange={handleInputChange}
                            className={errors.verificationCode ? 'error' : ''}
                            placeholder="Nhập mã xác thực 6 số"
                            maxLength="6"
                        />
                        {errors.verificationCode && <span className="error-message">{errors.verificationCode}</span>}
                        <div className="verification-hint">
                            <p>Mã xác thực đã được gửi đến: <strong>{formData.email}</strong></p>
                            {countdown === 0 && (
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={isSendingCode}
                                    className="resend-link"
                                >
                                    Gửi lại mã xác thực
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="phone">Số điện thoại *</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={errors.phone ? 'error' : ''}
                        placeholder="Nhập số điện thoại"
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="birthDay">Ngày sinh *</label>
                    <input
                        type="date"
                        id="birthDay"
                        name="birthDay"
                        value={formData.birthDay}
                        onChange={handleInputChange}
                        className={errors.birthDay ? 'error' : ''}
                    />
                    {errors.birthDay && <span className="error-message">{errors.birthDay}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Mật khẩu *</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={errors.password ? 'error' : ''}
                        placeholder="Nhập mật khẩu"
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}

                    {/* Password strength indicator */}
                    {formData.password && (
                        <div className="password-strength">
                            <p className="strength-title">Yêu cầu mật khẩu:</p>
                            <ul className="strength-list">
                                <li className={passwordStrength.hasMinLength ? 'valid' : 'invalid'}>
                                    <span className="strength-icon">{passwordStrength.hasMinLength ? '✓' : '✗'}</span>
                                    Ít nhất 8 ký tự
                                </li>
                                <li className={passwordStrength.hasUpperCase ? 'valid' : 'invalid'}>
                                    <span className="strength-icon">{passwordStrength.hasUpperCase ? '✓' : '✗'}</span>
                                    Có chữ cái viết hoa (A-Z)
                                </li>
                                <li className={passwordStrength.hasLowerCase ? 'valid' : 'invalid'}>
                                    <span className="strength-icon">{passwordStrength.hasLowerCase ? '✓' : '✗'}</span>
                                    Có chữ cái viết thường (a-z)
                                </li>
                                <li className={passwordStrength.hasNumber ? 'valid' : 'invalid'}>
                                    <span className="strength-icon">{passwordStrength.hasNumber ? '✓' : '✗'}</span>
                                    Có chữ số (0-9)
                                </li>
                                <li className={passwordStrength.hasSpecialChar ? 'valid' : 'invalid'}>
                                    <span className="strength-icon">{passwordStrength.hasSpecialChar ? '✓' : '✗'}</span>
                                    Có ký tự đặc biệt (!@#$%^&*...)
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={errors.confirmPassword ? 'error' : ''}
                        placeholder="Nhập lại mật khẩu"
                    />
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>

                {message && (
                    <div className={`message ${message.includes('thành công') || message.includes('gửi') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !isCodeSent}
                    className="btn-register"
                >
                    {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>

                <div className="form-footer">
                    <p>
                        Đã có tài khoản?{' '}
                        <button type="button" onClick={onSwitchToLogin} className="link-btn">
                            Đăng nhập ngay
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm;