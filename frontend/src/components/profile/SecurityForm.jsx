import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { profileService } from '../../services/profileService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import styles from './SecurityForm.module.css';

const SecurityForm = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('email');

    // State cho thay đổi email
    const [emailData, setEmailData] = useState({
        newEmail: '',
        verificationCode: '',
    });
    const [emailStage, setEmailStage] = useState('request'); // 'request' hoặc 'verify'

    // State cho thay đổi mật khẩu
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // State chung
    const [loading, setLoading] = useState(false);

    const handleEmailInputChange = (e) => {
        const { name, value } = e.target;
        setEmailData({
            ...emailData,
            [name]: value,
        });
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value,
        });
    };

    const handleSendVerification = async (e) => {
        e.preventDefault();

        if (!emailData.newEmail) {
            toast.error('Vui lòng nhập email mới');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailData.newEmail)) {
            toast.error('Email không hợp lệ');
            return;
        }

        try {
            setLoading(true);
            const response = await profileService.sendEmailVerification({
                email: emailData.newEmail
            });

            if (response.success) {
                toast.success('Mã xác thực đã được gửi đến email mới của bạn');
                setEmailStage('verify');
            } else {
                toast.error(response.message || 'Không thể gửi mã xác thực');
            }
        } catch (err) {
            toast.error('Đã xảy ra lỗi khi gửi mã xác thực');
            console.error('Send verification error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();

        if (!emailData.verificationCode) {
            toast.error('Vui lòng nhập mã xác thực');
            return;
        }

        try {
            setLoading(true);
            const response = await profileService.updateEmail({
                newEmail: emailData.newEmail,
                verificationCode: emailData.verificationCode
            });

            if (response.success) {
                toast.success('Email đã được cập nhật thành công. Vui lòng đăng nhập lại với email mới.');
                setEmailStage('request');
                setEmailData({
                    newEmail: '',
                    verificationCode: '',
                });

                // Logout sau 3 giây để user đọc thông báo
                setTimeout(() => {
                    logout();
                    navigate('/', { replace: true });
                }, 3000);
            } else {
                toast.error(response.message || 'Không thể cập nhật email');
            }
        } catch (err) {
            // Nếu lỗi 401/403 có thể do token invalid
            if (err.response?.status === 401 || err.response?.status === 403) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => {
                    logout();
                    navigate('/', { replace: true });
                }, 2000);
            } else {
                toast.error('Đã xảy ra lỗi khi cập nhật email');
            }
            console.error('Update email error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Kiểm tra dữ liệu
        if (!passwordData.currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại');
            return;
        }

        if (!passwordData.newPassword) {
            toast.error('Vui lòng nhập mật khẩu mới');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
            return;
        }

        // Validate password strength
        const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
        const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
        const hasNumbers = /\d/.test(passwordData.newPassword);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            toast.error('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
            return;
        }

        try {
            setLoading(true);
            const response = await profileService.changePassword(passwordData);

            if (response.success) {
                toast.success('Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại với mật khẩu mới.');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });

                // Logout sau 3 giây để user đọc thông báo
                setTimeout(() => {
                    logout();
                    navigate('/', { replace: true });
                }, 3000);
            } else {
                toast.error(response.message || 'Không thể thay đổi mật khẩu');
            }
        } catch (err) {
            // Nếu lỗi 401/403 có thể do token invalid
            if (err.response?.status === 401 || err.response?.status === 403) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => {
                    logout();
                    navigate('/', { replace: true });
                }, 2000);
            } else {
                toast.error('Đã xảy ra lỗi khi thay đổi mật khẩu');
            }
            console.error('Change password error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToEmailRequest = () => {
        setEmailStage('request');
    };

    // Password strength checker
    const getPasswordStrength = (password) => {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        Object.values(checks).forEach(check => {
            if (check) score++;
        });

        if (score < 3) return { level: 'weak', color: '#ef4444', text: 'Yếu' };
        if (score < 4) return { level: 'medium', color: '#f59e0b', text: 'Trung bình' };
        if (score < 5) return { level: 'good', color: '#10b981', text: 'Tốt' };
        return { level: 'strong', color: '#059669', text: 'Mạnh' };
    };

    // Kiểm tra nếu user không tồn tại, redirect về home
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    if (!user) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải...</p>
            </div>
        );
    }

    const passwordStrength = passwordData.newPassword ? getPasswordStrength(passwordData.newPassword) : null;

    return (
        <div className={styles.securityForm}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <circle cx="12" cy="16" r="1"></circle>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Bảo mật tài khoản
                </h2>
                <p className={styles.subtitle}>
                    Thay đổi email và mật khẩu để bảo vệ tài khoản của bạn
                </p>
            </div>

            <div className={styles.tabContainer}>
                <div className={styles.tabList}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'email' ? styles.active : ''}`}
                        onClick={() => setActiveTab('email')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Thay đổi Email
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'password' ? styles.active : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <circle cx="12" cy="16" r="1"></circle>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Thay đổi Mật khẩu
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'email' && (
                        <div className={styles.emailTab}>
                            <div className={styles.tabHeader}>
                                <h3>Thay đổi Email</h3>
                                <p>Cập nhật địa chỉ email của bạn. Bạn sẽ cần xác thực email mới.</p>
                            </div>

                            {emailStage === 'request' ? (
                                <form onSubmit={handleSendVerification} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Email hiện tại</label>
                                        <div className={styles.currentValue}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                <polyline points="22,6 12,13 2,6"></polyline>
                                            </svg>
                                            {user?.email || ''}
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="newEmail" className={styles.label}>
                                            Email mới <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="newEmail"
                                            name="newEmail"
                                            value={emailData.newEmail}
                                            onChange={handleEmailInputChange}
                                            placeholder="Nhập email mới"
                                            className={styles.input}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className={styles.formActions}>
                                        <button
                                            type="submit"
                                            className={`${styles.btn} ${styles.primaryBtn}`}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                                    </svg>
                                                    Đang gửi...
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                    </svg>
                                                    Gửi mã xác thực
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleUpdateEmail} className={styles.form}>
                                    <div className={styles.verificationInfo}>
                                        <div className={styles.infoIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <path d="M12 16v-4"></path>
                                                <path d="M12 8h.01"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p>Mã xác thực đã được gửi đến:</p>
                                            <strong>{emailData.newEmail}</strong>
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="verificationCode" className={styles.label}>
                                            Mã xác thực <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="verificationCode"
                                            name="verificationCode"
                                            value={emailData.verificationCode}
                                            onChange={handleEmailInputChange}
                                            placeholder="Nhập mã xác thực"
                                            className={styles.input}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className={styles.formActions}>
                                        <button
                                            type="button"
                                            className={`${styles.btn} ${styles.secondaryBtn}`}
                                            onClick={handleBackToEmailRequest}
                                            disabled={loading}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="15,18 9,12 15,6"></polyline>
                                            </svg>
                                            Quay lại
                                        </button>
                                        <button
                                            type="submit"
                                            className={`${styles.btn} ${styles.primaryBtn}`}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                                    </svg>
                                                    Đang cập nhật...
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20,6 9,17 4,12"></polyline>
                                                    </svg>
                                                    Xác nhận
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className={styles.passwordTab}>
                            <div className={styles.tabHeader}>
                                <h3>Thay đổi Mật khẩu</h3>
                                <p>Cập nhật mật khẩu để tăng cường bảo mật tài khoản của bạn.</p>
                            </div>

                            <form onSubmit={handleChangePassword} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="currentPassword" className={styles.label}>
                                        Mật khẩu hiện tại <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordInputChange}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        className={styles.input}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword" className={styles.label}>
                                        Mật khẩu mới <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordInputChange}
                                        placeholder="Nhập mật khẩu mới"
                                        className={styles.input}
                                        required
                                        disabled={loading}
                                    />
                                    {passwordStrength && (
                                        <div className={styles.passwordStrength}>
                                            <div className={styles.strengthBar}>
                                                <div
                                                    className={styles.strengthFill}
                                                    style={{
                                                        width: `${(passwordStrength.level === 'weak' ? 25 : passwordStrength.level === 'medium' ? 50 : passwordStrength.level === 'good' ? 75 : 100)}%`,
                                                        backgroundColor: passwordStrength.color
                                                    }}
                                                ></div>
                                            </div>
                                            <span
                                                className={styles.strengthText}
                                                style={{ color: passwordStrength.color }}
                                            >
                                                {passwordStrength.text}
                                            </span>
                                        </div>
                                    )}
                                    <div className={styles.passwordHints}>
                                        <p>Mật khẩu phải có:</p>
                                        <ul>
                                            <li className={passwordData.newPassword.length >= 8 ? styles.valid : ''}>
                                                Ít nhất 8 ký tự
                                            </li>
                                            <li className={/[A-Z]/.test(passwordData.newPassword) ? styles.valid : ''}>
                                                Chữ cái viết hoa
                                            </li>
                                            <li className={/[a-z]/.test(passwordData.newPassword) ? styles.valid : ''}>
                                                Chữ cái viết thường
                                            </li>
                                            <li className={/\d/.test(passwordData.newPassword) ? styles.valid : ''}>
                                                Số
                                            </li>
                                            <li className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? styles.valid : ''}>
                                                Ký tự đặc biệt
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="confirmPassword" className={styles.label}>
                                        Xác nhận mật khẩu mới <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordInputChange}
                                        placeholder="Nhập lại mật khẩu mới"
                                        className={`${styles.input} ${passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                                                ? styles.inputError : ''
                                            }`}
                                        required
                                        disabled={loading}
                                    />
                                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                        <p className={styles.errorText}>Mật khẩu không khớp</p>
                                    )}
                                </div>

                                <div className={styles.formActions}>
                                    <button
                                        type="submit"
                                        className={`${styles.btn} ${styles.primaryBtn}`}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                                </svg>
                                                Đang cập nhật...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <circle cx="12" cy="16" r="1"></circle>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                                Thay đổi mật khẩu
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityForm;