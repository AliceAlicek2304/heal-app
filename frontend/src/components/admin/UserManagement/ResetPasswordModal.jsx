import React, { useState } from 'react';
import { FaTimes, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import adminService from '../../../services/adminService';
import styles from './ResetPasswordModal.module.css';

const ResetPasswordModal = ({ user, onReset, onClose }) => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { addToast } = useToast();

    const validateForm = () => {
        const newErrors = {};

        if (!formData.password) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await adminService.users.resetPassword(user.id, {
                password: formData.password
            });

            addToast('Đặt lại mật khẩu thành công', 'success');
            onReset();
        } catch (error) {
            console.error('Error resetting password:', error);
            addToast(error.message || 'Có lỗi xảy ra khi đặt lại mật khẩu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Đặt lại mật khẩu</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.userInfo}>
                    <p>Đặt lại mật khẩu cho: <strong>{user.fullName || user.username}</strong></p>
                    <p>Email: <strong>{user.email}</strong></p>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <FaKey className={styles.labelIcon} />
                            Mật khẩu mới
                        </label>
                        <div className={styles.passwordContainer}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                placeholder="Nhập mật khẩu mới"
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <FaKey className={styles.labelIcon} />
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                            placeholder="Nhập lại mật khẩu mới"
                        />
                        {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.saveButton}
                            disabled={loading}
                        >
                            {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordModal;
