import React, { useState } from 'react';
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
    const [errors, setErrors] = useState({}); const { login } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

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