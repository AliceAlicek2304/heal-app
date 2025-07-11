import React, { useState, useEffect } from 'react';
import { authService } from '../../../services/authService';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './RegisterForm.module.css';

const RegisterForm = ({ onClose, onSwitchToLogin, onRegisterSuccess }) => {
    const toast = useToast();
    const { googleLogin } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        birthDay: '',
        gender: '',
        password: '',
        confirmPassword: '',
        verificationCode: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [errors, setErrors] = useState({});
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    // Load Google Sign-In script
    useEffect(() => {
        const loadGoogleScript = () => {
            if (window.google) {
                // If Google script is already loaded, just initialize
                initializeGoogleSignIn();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogleSignIn;
            document.head.appendChild(script);
        };

        const initializeGoogleSignIn = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: '720346160754-f1vpd97jhm81p15201reechausvnnd7u.apps.googleusercontent.com',
                    callback: handleGoogleLogin,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    ux_mode: 'popup'
                });
                
                // Clear any existing button content first
                const buttonContainer = document.getElementById('google-register-button');
                if (buttonContainer) {
                    buttonContainer.innerHTML = '';
                    
                    // Render the button
                    window.google.accounts.id.renderButton(
                        buttonContainer,
                        {
                            theme: 'outline',
                            size: 'large',
                            text: 'signup_with',
                            width: '100%'
                        }
                    );
                }
            }
        };

        // Add a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            loadGoogleScript();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Re-initialize Google button when component becomes visible
    useEffect(() => {
        const reinitializeGoogleButton = () => {
            if (window.google) {
                const buttonContainer = document.getElementById('google-register-button');
                if (buttonContainer && buttonContainer.innerHTML === '') {
                    window.google.accounts.id.renderButton(
                        buttonContainer,
                        {
                            theme: 'outline',
                            size: 'large',
                            text: 'signup_with',
                            width: '100%'
                        }
                    );
                }
            }
        };

        // Check if we need to reinitialize the button
        const timer = setTimeout(reinitializeGoogleButton, 200);
        
        return () => clearTimeout(timer);
    });

    const handleGoogleLogin = async (response) => {
        setIsGoogleLoading(true);
        try {
            const result = await googleLogin(response.credential);
            
            if (result.success) {
                // Check if user is admin
                if (result.isAdmin) {
                    toast.success('Đang chuyển hướng đến trang quản trị...', 1000);
                    if (onRegisterSuccess) {
                        onRegisterSuccess();
                    }
                    onClose();
                    navigate('/admin');
                    return;
                }

                // Normal user flow
                toast.success('Đăng ký Google thành công!', 2000);
                if (onRegisterSuccess) {
                    onRegisterSuccess();
                }
                setTimeout(() => {
                    onClose();
                }, 500);
            } else {
                // Show user-friendly error messages based on error type
                const errorMessage = result.message || 'Đăng ký Google thất bại';
                const errorCode = result.error;
                
                if (errorCode === 'EMAIL_ALREADY_EXISTS' || errorMessage.includes('Email này đã được')) {
                    toast.error(errorMessage + ' Hãy thử đăng nhập thay vì đăng ký.', 5000);
                } else if (errorCode === 'SERVER_ERROR' || errorMessage.includes('Lỗi hệ thống')) {
                    toast.error(errorMessage, 4000);
                } else if (errorCode === 'AUTHENTICATION_ERROR') {
                    toast.error('Xác thực Google thất bại. Vui lòng thử lại.', 3000);
                } else {
                    toast.error(errorMessage, 3000);
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra trong quá trình đăng ký Google');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleButtonClick = () => {
        if (isGoogleLoading) return;
        
        if (window.google) {
            window.google.accounts.id.prompt();
        } else {
            toast.error('Google Sign-In chưa được tải. Vui lòng thử lại sau.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'password') {
            checkPasswordStrength(value);
        }

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const checkPasswordStrength = (password) => {
        setPasswordStrength({
            hasMinLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        });
    };

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

        if (!formData.gender) {
            newErrors.gender = 'Giới tính không được để trống';
        }

        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
            newErrors.password = passwordErrors[0];
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

    const handleSendCode = async () => {
        if (!validateEmail()) {
            return;
        }

        setIsSendingCode(true);

        try {
            const response = await authService.sendVerificationCode(formData.email);

            if (response.success) {
                toast.success('Mã xác thực đã được gửi đến email của bạn', 6000);
                setIsCodeSent(true);
                startCountdown();
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi gửi mã xác thực');
            }
        } catch (error) {
            toast.error('Không thể gửi mã xác thực. Vui lòng thử lại');
            console.error('Error sending verification code:', error);
        } finally {
            setIsSendingCode(false);
        }
    };

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

    const handleResendCode = async () => {
        if (countdown > 0) return;

        setIsSendingCode(true);

        try {
            const response = await authService.sendVerificationCode(formData.email);
            if (response.success) {
                toast.success('Mã xác thực mới đã được gửi', 6000);
                startCountdown();
            } else {
                toast.error(response.message || 'Không thể gửi lại mã xác thực');
            }
        } catch (error) {
            toast.error('Không thể gửi lại mã xác thực');
            console.error('Error resending verification code:', error);
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Vui lòng kiểm tra và điền đầy đủ thông tin');
            return;
        }

        if (!isCodeSent) {
            toast.error('Vui lòng gửi mã xác thực trước');
            return;
        }

        setIsLoading(true);

        try {
            const registerData = {
                fullName: formData.fullName,
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                birthDay: formData.birthDay,
                gender: formData.gender,
                password: formData.password,
                verificationCode: formData.verificationCode,
            };

            const response = await authService.registerUser(registerData);            if (response.success) {
                toast.success('Đăng ký thành công! Chuyển sang đăng nhập...', 2000);
                setTimeout(() => {
                    onSwitchToLogin();
                }, 500);
            } else {
                toast.error(response.message || 'Đăng ký thất bại');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra trong quá trình đăng ký');
            console.error('Error registering user:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const handleClose = () => {
        toast.clearAllToasts();
        onClose();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Đăng ký tài khoản</h2>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <form onSubmit={handleRegister} className={styles.form}>
                <div className={styles.welcomeText}>
                    <h3>Tham gia cộng đồng của chúng tôi!</h3>
                    <p>Tạo tài khoản để bắt đầu hành trình chăm sóc sức khỏe</p>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="fullName" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Họ và tên
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                        placeholder="Nhập họ và tên đầy đủ"
                    />
                    {errors.fullName && <span className={styles.errorMessage}>{errors.fullName}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4"></path>
                            <circle cx="12" cy="12" r="9"></circle>
                        </svg>
                        Tên đăng nhập
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                        placeholder="Nhập tên đăng nhập (ít nhất 3 ký tự)"
                    />
                    {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Email
                    </label>
                    <div className={styles.emailInputGroup}>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                            placeholder="example@email.com"
                        />
                        <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={isSendingCode || !formData.email.trim() || countdown > 0}
                            className={`${styles.sendCodeBtn} ${isSendingCode ? styles.loading : ''}`}
                        >
                            {isSendingCode ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    Đang gửi...
                                </>
                            ) : countdown > 0 ? (
                                `${countdown}s`
                            ) : isCodeSent ? (
                                'Gửi lại'
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13"></path>
                                        <polygon points="22,2 15,22 11,13 2,9"></polygon>
                                    </svg>
                                    Gửi mã
                                </>
                            )}
                        </button>
                    </div>
                    {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                </div>

                {isCodeSent && (
                    <div className={`${styles.formGroup} ${styles.verificationGroup}`}>
                        <label htmlFor="verificationCode" className={styles.label}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                                <circle cx="12" cy="16" r="1"></circle>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Mã xác thực
                        </label>
                        <input
                            type="text"
                            id="verificationCode"
                            name="verificationCode"
                            value={formData.verificationCode}
                            onChange={handleInputChange}
                            className={`${styles.input} ${errors.verificationCode ? styles.inputError : ''}`}
                            placeholder="Nhập mã 6 chữ số"
                            maxLength="6"
                        />
                        {errors.verificationCode && <span className={styles.errorMessage}>{errors.verificationCode}</span>}
                        <div className={styles.verificationHint}>
                            <div className={styles.infoCard}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 6v6l4 2"></path>
                                </svg>
                                <p>Mã xác thực đã được gửi đến: <strong>{formData.email}</strong></p>
                            </div>
                            {countdown === 0 && (
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={isSendingCode}
                                    className={styles.resendLink}
                                >
                                    Gửi lại mã xác thực
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        Số điện thoại
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                        placeholder="0xxx xxx xxx"
                    />
                    {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="birthDay" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Ngày sinh
                    </label>
                    <input
                        type="date"
                        id="birthDay"
                        name="birthDay"
                        value={formData.birthDay}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.birthDay ? styles.inputError : ''}`}
                    />
                    {errors.birthDay && <span className={styles.errorMessage}>{errors.birthDay}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="gender" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="9" r="9"></circle>
                            <path d="M10.6 15.8a9 9 0 0 0 4.4 0"></path>
                            <path d="M13.5 7.5a3 3 0 1 1-3 0"></path>
                        </svg>
                        Giới tính
                    </label>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className={`${styles.input} ${styles.selectInput} ${errors.gender ? styles.inputError : ''}`}
                    >
                        <option value="">Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                    </select>
                    {errors.gender && <span className={styles.errorMessage}>{errors.gender}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Mật khẩu
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                        placeholder="Nhập mật khẩu mạnh"
                    />
                    {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}

                    {formData.password && (
                        <div className={styles.passwordStrength}>
                            <p className={styles.strengthTitle}>Yêu cầu mật khẩu:</p>
                            <ul className={styles.strengthList}>
                                <li className={passwordStrength.hasMinLength ? styles.valid : styles.invalid}>
                                    <span className={styles.strengthIcon}>
                                        {passwordStrength.hasMinLength ? '✓' : '○'}
                                    </span>
                                    Ít nhất 8 ký tự
                                </li>
                                <li className={passwordStrength.hasUpperCase ? styles.valid : styles.invalid}>
                                    <span className={styles.strengthIcon}>
                                        {passwordStrength.hasUpperCase ? '✓' : '○'}
                                    </span>
                                    Có chữ cái viết hoa (A-Z)
                                </li>
                                <li className={passwordStrength.hasLowerCase ? styles.valid : styles.invalid}>
                                    <span className={styles.strengthIcon}>
                                        {passwordStrength.hasLowerCase ? '✓' : '○'}
                                    </span>
                                    Có chữ cái viết thường (a-z)
                                </li>
                                <li className={passwordStrength.hasNumber ? styles.valid : styles.invalid}>
                                    <span className={styles.strengthIcon}>
                                        {passwordStrength.hasNumber ? '✓' : '○'}
                                    </span>
                                    Có chữ số (0-9)
                                </li>
                                <li className={passwordStrength.hasSpecialChar ? styles.valid : styles.invalid}>
                                    <span className={styles.strengthIcon}>
                                        {passwordStrength.hasSpecialChar ? '✓' : '○'}
                                    </span>
                                    Có ký tự đặc biệt (!@#$%^&*...)
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Xác nhận mật khẩu
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                        placeholder="Nhập lại mật khẩu"
                    />
                    {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !isCodeSent}
                    className={styles.btnRegister}
                >
                    {isLoading ? (
                        <>
                            <div className={styles.spinner}></div>
                            Đang đăng ký...
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                            Tạo tài khoản
                        </>
                    )}
                </button>

                <div className={styles.divider}>
                    <span>hoặc</span>
                </div>

                <div id="google-register-button" className={styles.googleButtonContainer}></div>

                <div className={styles.footer}>
                    <p>
                        Đã có tài khoản?
                        <button type="button" onClick={onSwitchToLogin} className={styles.linkBtn}>
                            Đăng nhập ngay
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm;