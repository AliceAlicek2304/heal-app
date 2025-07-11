import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import styles from './LoginForm.module.css';

const LoginForm = ({ onClose, onSwitchToRegister, onLoginSuccess, onSwitchToForgotPassword }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const { login, googleLogin } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

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
                const buttonContainer = document.getElementById('google-signin-button');
                if (buttonContainer) {
                    buttonContainer.innerHTML = '';
                    
                    // Render the button
                    window.google.accounts.id.renderButton(
                        buttonContainer,
                        {
                            theme: 'outline',
                            size: 'large',
                            text: 'signin_with',
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
    }, []); // Keep empty dependency array but improve the logic inside

    // Re-initialize Google button when component becomes visible
    useEffect(() => {
        const reinitializeGoogleButton = () => {
            if (window.google) {
                const buttonContainer = document.getElementById('google-signin-button');
                if (buttonContainer && buttonContainer.innerHTML === '') {
                    window.google.accounts.id.renderButton(
                        buttonContainer,
                        {
                            theme: 'outline',
                            size: 'large',
                            text: 'signin_with',
                            width: '100%'
                        }
                    );
                }
            }
        };

        // Check if we need to reinitialize the button
        const timer = setTimeout(reinitializeGoogleButton, 200);
        
        return () => clearTimeout(timer);
    }); // Run on every render to catch cases where button disappeared

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Tên đăng nhập hoặc email không được để trống';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Mật khẩu không được để trống';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Vui lòng kiểm tra và điền đầy đủ thông tin');
            return;
        }

        setIsLoading(true);

        try {
            const response = await login({
                username: formData.username,
                password: formData.password,
            }); if (response.success) {
                // Check if user is admin - if so, redirect immediately
                if (response.isAdmin) {
                    toast.success('Đang chuyển hướng đến trang quản trị...', 1000);
                    // Close modal immediately for admin
                    if (onLoginSuccess) {
                        onLoginSuccess();
                    }
                    onClose();
                    // Navigate to admin dashboard
                    navigate('/admin');
                    return; // Exit early for admin users
                }

                // Normal user flow - show toast and close modal with delay
                toast.success('Đăng nhập thành công!', 2000);

                // Đóng modal ngay lập tức và gọi callback
                if (onLoginSuccess) {
                    onLoginSuccess();
                }

                // Đóng modal với delay ngắn để user thấy toast
                setTimeout(() => {
                    onClose();
                }, 500);
            } else {
                toast.error(response.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra trong quá trình đăng nhập');
            console.error('Error logging in:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (response) => {
        setIsGoogleLoading(true);
        try {
            const result = await googleLogin(response.credential);
            
            if (result.success) {
                // Check if user is admin
                if (result.isAdmin) {
                    toast.success('Đang chuyển hướng đến trang quản trị...', 1000);
                    if (onLoginSuccess) {
                        onLoginSuccess();
                    }
                    onClose();
                    navigate('/admin');
                    return;
                }

                // Normal user flow
                toast.success('Đăng nhập Google thành công!', 2000);
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
                setTimeout(() => {
                    onClose();
                }, 500);
            } else {
                // Show user-friendly error messages based on error type
                const errorMessage = result.message || 'Đăng nhập Google thất bại';
                const errorCode = result.error;
                
                if (errorCode === 'EMAIL_ALREADY_EXISTS' || errorMessage.includes('Email này đã được')) {
                    toast.error(errorMessage + ' Hãy thử đăng nhập bằng mật khẩu.', 5000);
                } else if (errorCode === 'SERVER_ERROR' || errorMessage.includes('Lỗi hệ thống')) {
                    toast.error(errorMessage, 4000);
                } else if (errorCode === 'AUTHENTICATION_ERROR') {
                    toast.error('Xác thực Google thất bại. Vui lòng thử lại.', 3000);
                } else {
                    toast.error(errorMessage, 3000);
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra trong quá trình đăng nhập Google');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleButtonClick = () => {
        if (window.google && !isGoogleLoading) {
            window.google.accounts.id.prompt();
        }
    };

    const handleClose = () => {
        toast.clearAllToasts();
        onClose();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Đăng nhập</h2>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.welcomeText}>
                    <h3>Chào mừng bạn trở lại!</h3>
                    <p>Đăng nhập để tiếp tục sử dụng dịch vụ</p>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Tên đăng nhập hoặc Email
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                        placeholder="Nhập tên đăng nhập hoặc email"
                    />
                    {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
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
                        placeholder="Nhập mật khẩu"
                    />
                    {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                </div>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        className={styles.forgotPasswordBtn}
                        onClick={onSwitchToForgotPassword}
                        disabled={isLoading}
                    >
                        Quên mật khẩu?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={styles.btnLogin}
                >
                    {isLoading ? (
                        <>
                            <div className={styles.spinner}></div>
                            Đang đăng nhập...
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h6v18h-6M10 17l5-5-5-5M1 12h18"></path>
                            </svg>
                            Đăng nhập
                        </>
                    )}
                </button>

                <div className={styles.divider}>
                    <span>hoặc</span>
                </div>

                {/* Google Sign-In Button Container */}
                <div id="google-signin-button" className={styles.googleButtonContainer}></div>

                {/* Fallback manual button */}
                <button
                    type="button"
                    className={styles.btnGoogle}
                    onClick={handleGoogleButtonClick}
                    disabled={isLoading || isGoogleLoading}
                    style={{ display: 'none' }}
                >
                    {isGoogleLoading ? (
                        <>
                            <div className={styles.spinner}></div>
                            Đang đăng nhập...
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Đăng nhập với Google
                        </>
                    )}
                </button>

                <div className={styles.footer}>
                    <p>
                        Chưa có tài khoản?
                        <button type="button" onClick={onSwitchToRegister} className={styles.linkBtn}>
                            Đăng ký ngay
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;