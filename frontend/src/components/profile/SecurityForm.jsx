import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import './SecurityForm.css';

const SecurityForm = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
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
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Tự động xóa thông báo sau 5 giây
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const handleEmailInputChange = (e) => {
        const { name, value } = e.target;
        setEmailData({
            ...emailData,
            [name]: value,
        });
        setError('');
        setSuccess('');
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value,
        });
        setError('');
        setSuccess('');
    };

    const handleSendVerification = async (e) => {
        e.preventDefault();

        if (!emailData.newEmail) {
            setError('Vui lòng nhập email mới');
            return;
        }

        try {
            setLoading(true);
            const response = await profileService.sendEmailVerification({
                email: emailData.newEmail
            });

            if (response.success) {
                setSuccess('Mã xác thực đã được gửi đến email mới của bạn');
                setEmailStage('verify');
            } else {
                setError(response.message || 'Không thể gửi mã xác thực');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi gửi mã xác thực');
            console.error('Send verification error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();

        if (!emailData.verificationCode) {
            setError('Vui lòng nhập mã xác thực');
            return;
        }

        try {
            setLoading(true);
            const response = await profileService.updateEmail({
                newEmail: emailData.newEmail,
                verificationCode: emailData.verificationCode
            });

            if (response.success) {
                setSuccess('Email đã được cập nhật thành công. Vui lòng đăng nhập lại với email mới.');
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
                setError(response.message || 'Không thể cập nhật email');
            }
        } catch (err) {
            // Nếu lỗi 401/403 có thể do token invalid
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => {
                    logout();
                    navigate('/', { replace: true });
                }, 2000);
            } else {
                setError('Đã xảy ra lỗi khi cập nhật email');
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
            setError('Vui lòng nhập mật khẩu hiện tại');
            return;
        }

        if (!passwordData.newPassword) {
            setError('Vui lòng nhập mật khẩu mới');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setError('Mật khẩu mới phải có ít nhất 8 ký tự');
            return;
        }

        try {
            setLoading(true);
            const response = await profileService.changePassword(passwordData);

            if (response.success) {
                setSuccess('Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại với mật khẩu mới.');
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
                setError(response.message || 'Không thể thay đổi mật khẩu');
            }
        } catch (err) {
            // Nếu lỗi 401/403 có thể do token invalid
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => {
                    logout();
                    navigate('/', { replace: true });
                }, 2000);
            } else {
                setError('Đã xảy ra lỗi khi thay đổi mật khẩu');
            }
            console.error('Change password error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToEmailRequest = () => {
        setEmailStage('request');
        setError('');
        setSuccess('');
    };

    // Kiểm tra nếu user không tồn tại, redirect về home
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    if (!user) {
        return null; // Hoặc loading spinner
    }

    return (
        <div className="security-form">
            <div className="security-tabs">
                <button
                    className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
                    onClick={() => setActiveTab('email')}
                >
                    Thay đổi Email
                </button>
                <button
                    className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
                >
                    Thay đổi Mật khẩu
                </button>
            </div>

            {(success || error) && (
                <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
                    {error || success}
                    {(success.includes('đăng nhập lại') || error.includes('đăng nhập lại')) && (
                        <div className="auto-logout-info">
                            <small>Bạn sẽ được chuyển về trang chính trong vài giây...</small>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'email' && (
                <div className="tab-content">
                    <h3>Thay đổi Email</h3>

                    {emailStage === 'request' ? (
                        <form onSubmit={handleSendVerification}>
                            <div className="form-group">
                                <label>Email hiện tại</label>
                                <div className="current-value">{user?.email || ''}</div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="newEmail">Email mới</label>
                                <input
                                    type="email"
                                    id="newEmail"
                                    name="newEmail"
                                    value={emailData.newEmail}
                                    onChange={handleEmailInputChange}
                                    placeholder="Nhập email mới"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleUpdateEmail}>
                            <div className="form-group">
                                <label htmlFor="verificationCode">Mã xác thực</label>
                                <p className="form-info">
                                    Mã xác thực đã được gửi đến <strong>{emailData.newEmail}</strong>
                                </p>
                                <input
                                    type="text"
                                    id="verificationCode"
                                    name="verificationCode"
                                    value={emailData.verificationCode}
                                    onChange={handleEmailInputChange}
                                    placeholder="Nhập mã xác thực"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleBackToEmailRequest}
                                    disabled={loading}
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang cập nhật...' : 'Xác nhận'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {activeTab === 'password' && (
                <div className="tab-content">
                    <h3>Thay đổi Mật khẩu</h3>

                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Nhập mật khẩu hiện tại"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">Mật khẩu mới</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Nhập mật khẩu mới"
                                required
                                disabled={loading}
                            />
                            <p className="form-info">
                                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                            </p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Nhập lại mật khẩu mới"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Đang cập nhật...' : 'Thay đổi mật khẩu'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SecurityForm;