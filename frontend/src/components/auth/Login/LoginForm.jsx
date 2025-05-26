import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import './LoginForm.css';

const LoginForm = ({ onClose, onSwitchToRegister, onLoginSuccess, onSwitchToForgotPassword }) => {
    const [formData, setFormData] = useState({
        username: '', // Có thể là username hoặc email
        password: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

    // Sử dụng AuthContext
    const { login } = useAuth();

    // Xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Xóa lỗi khi người dùng nhập lại
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
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

    // Xử lý đăng nhập
    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const response = await login({
                username: formData.username,
                password: formData.password,
            });

            if (response.success) {
                // Thêm log để kiểm tra
                console.log("Đăng nhập thành công!");
                console.log("Token:", localStorage.getItem('authToken')?.substring(0, 10) + "...");

                setMessage('Đăng nhập thành công!');

                // Gọi callback để đóng modal
                if (onLoginSuccess) {
                    onLoginSuccess();
                }

                // Đóng modal sau 1 giây
                setTimeout(() => {
                    onClose();
                }, 1000);
            } else {
                setMessage(response.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            setMessage('Có lỗi xảy ra trong quá trình đăng nhập');
            console.error('Error logging in:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-form">
            <div className="login-header">
                <h2>Đăng nhập</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <form onSubmit={handleLogin} className="login-form-content">
                <div className="form-group">
                    <label htmlFor="username">Tên đăng nhập hoặc Email *</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={errors.username ? 'error' : ''}
                        placeholder="Nhập tên đăng nhập hoặc email"
                    />
                    {errors.username && <span className="error-message">{errors.username}</span>}
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
                </div>

                <div className="form-actions">
                    <div className="forgot-password">
                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={onSwitchToForgotPassword}
                            disabled={isLoading}
                        >
                            Quên mật khẩu?
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`message ${message.includes('thành công') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-login"
                >
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                <div className="form-footer">
                    <p>
                        Chưa có tài khoản?{' '}
                        <button type="button" onClick={onSwitchToRegister} className="link-btn">
                            Đăng ký ngay
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;