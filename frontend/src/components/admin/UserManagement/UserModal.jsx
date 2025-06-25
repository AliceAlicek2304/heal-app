import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaCalendar, FaUserTag } from 'react-icons/fa';
import adminService from '../../../services/adminService';
import { useToast } from '../../../contexts/ToastContext';
import { parseDate } from '../../../utils/dateUtils';
import authService from '../../../services/authService';
import styles from './UserModal.module.css';

const UserModal = ({ user, mode, availableRoles, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        // For create mode - full info
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        birthDay: '',
        gender: 'Nam',
        // For edit mode - only role and status
        role: 'CUSTOMER',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { addToast } = useToast();

    // Helper function to build avatar URL
    const getAvatarUrl = (avatarPath) => {
        return authService.getAvatarUrl(avatarPath);
    };

    // Helper function to convert date to yyyy-MM-dd format for input[type="date"]
    const formatDateForInput = (dateInput) => {
        const date = parseDate(dateInput);
        if (!date) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }; useEffect(() => {
        if (user && (mode === 'edit' || mode === 'view')) {
            if (mode === 'edit') {
                // Edit mode: chỉ cho phép sửa role và status
                setFormData({
                    role: user.role || 'CUSTOMER',
                    isActive: user.isActive !== undefined ? user.isActive : true
                });
            } else {
                // View mode: hiển thị tất cả thông tin nhưng readonly
                setFormData({
                    username: user.username || '',
                    password: '', // Never show existing password
                    fullName: user.fullName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    birthDay: formatDateForInput(user.birthDay),
                    gender: user.gender || 'Nam',
                    role: user.role || 'CUSTOMER',
                    isActive: user.isActive !== undefined ? user.isActive : true
                });
            }
        } else if (mode === 'create') {
            // Create mode: reset form với default values
            setFormData({
                username: '',
                password: '',
                fullName: '',
                email: '',
                phone: '',
                birthDay: '',
                gender: 'Nam',
                role: 'CUSTOMER',
                isActive: true
            });
        }
    }, [user, mode]); const validateForm = () => {
        const newErrors = {};

        if (mode === 'create') {
            // Create mode: validate tất cả fields
            if (!formData.username.trim()) {
                newErrors.username = 'Username là bắt buộc';
            } else if (formData.username.length < 4) {
                newErrors.username = 'Username phải có ít nhất 4 ký tự';
            }

            if (!formData.password) {
                newErrors.password = 'Mật khẩu là bắt buộc';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            }

            if (!formData.fullName.trim()) {
                newErrors.fullName = 'Họ và tên là bắt buộc';
            }

            if (!formData.email.trim()) {
                newErrors.email = 'Email là bắt buộc';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Email không hợp lệ';
            }

            if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
                newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
            }
        } else if (mode === 'edit') {
            // Edit mode: chỉ validate role
            if (!formData.role) {
                newErrors.role = 'Vai trò là bắt buộc';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }; const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            let submitData;
            let result;

            if (mode === 'create') {
                // Create mode: gửi tất cả dữ liệu
                submitData = { ...formData };
                result = await adminService.users.create(submitData);
                addToast('Tạo người dùng thành công', 'success');
            } else if (mode === 'edit') {
                // Edit mode: chỉ gửi role và isActive
                submitData = {
                    role: formData.role,
                    isActive: formData.isActive
                };
                result = await adminService.users.update(user.id, submitData);
                addToast('Cập nhật người dùng thành công', 'success');
            }

            onSave();
        } catch (error) {
            console.error('Error saving user:', error);
            addToast(error.message || 'Có lỗi xảy ra khi lưu người dùng', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const getModalTitle = () => {
        switch (mode) {
            case 'create':
                return 'Thêm người dùng';
            case 'edit':
                return 'Chỉnh sửa người dùng';
            case 'view':
                return 'Thông tin người dùng';
            default:
                return 'Người dùng';
        }
    };

    const isReadOnly = mode === 'view';

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{getModalTitle()}</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formScrollContent}>                        {mode === 'view' && user && (
                        <div className={styles.userInfoSection}>
                            <div className={styles.userAvatar}>
                                {user.avatar ? (
                                    <img
                                        src={getAvatarUrl(user.avatar)}
                                        alt={user.fullName || user.username}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={styles.avatarPlaceholder}
                                    style={{ display: user.avatar ? 'none' : 'flex' }}
                                >
                                    {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                                </div>
                            </div>
                            <div className={styles.userDetails}>
                                <h4>{user.fullName || user.username}</h4>
                                <p>{user.email}</p>
                                {user.phone && <p>{user.phone}</p>}                            </div>
                        </div>
                    )}

                        {mode === 'create' && (
                            <div className={styles.formGrid}>
                                {/* Username */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FaUser className={styles.labelIcon} />
                                        Tên đăng nhập *
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                                        placeholder="Nhập tên đăng nhập"
                                    />
                                    {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
                                </div>

                                {/* Password */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FaUser className={styles.labelIcon} />
                                        Mật khẩu *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                        placeholder="Nhập mật khẩu"
                                    />
                                    {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                                </div>

                                {/* Full Name */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FaUser className={styles.labelIcon} />
                                        Họ và tên *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                                        placeholder="Nhập họ và tên"
                                    />
                                    {errors.fullName && <span className={styles.errorMessage}>{errors.fullName}</span>}
                                </div>

                                {/* Email */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FaEnvelope className={styles.labelIcon} />
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                        placeholder="Nhập email"
                                    />
                                    {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                                </div>

                                {/* Phone */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FaPhone className={styles.labelIcon} />
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                                        placeholder="Nhập số điện thoại"
                                    />
                                    {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                                </div>

                                {/* Birth Day */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FaCalendar className={styles.labelIcon} />
                                        Ngày sinh
                                    </label>
                                    <input
                                        type="date"
                                        name="birthDay"
                                        value={formData.birthDay}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                    />
                                </div>

                                {/* Gender */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Giới tính</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                            </div>)}

                        {mode === 'view' && user && (
                            <div className={styles.viewGrid}>
                                <div className={styles.viewItem}>
                                    <strong>Username:</strong> {user.username}
                                </div>
                                <div className={styles.viewItem}>
                                    <strong>Email:</strong> {user.email}
                                </div>
                                <div className={styles.viewItem}>
                                    <strong>Số điện thoại:</strong> {user.phone || 'Chưa có'}
                                </div>
                                <div className={styles.viewItem}>
                                    <strong>Giới tính:</strong> {user.gender || 'Chưa có'}
                                </div>
                                <div className={styles.viewItem}>
                                    <strong>Ngày sinh:</strong> {user.birthDay ? formatDateForInput(user.birthDay) : 'Chưa có'}
                                </div>
                            </div>
                        )}                        {/* Role - hiển thị trong create và edit mode, hoặc view mode */}
                        {(mode === 'create' || mode === 'edit' || mode === 'view') && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <FaUserTag className={styles.labelIcon} />
                                    Vai trò {mode !== 'view' ? '*' : ''}
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    disabled={isReadOnly}
                                >
                                    {Array.isArray(availableRoles) && availableRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                {errors.role && <span className={styles.errorMessage}>{errors.role}</span>}
                            </div>
                        )}

                        {/* Active Status - hiển thị trong create và edit mode, hoặc view mode */}
                        {(mode === 'create' || mode === 'edit' || mode === 'view') && (
                            <div className={styles.formGroup}>
                                <label className={`${styles.checkboxLabel} ${isReadOnly ? styles.disabled : ''}`}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        disabled={isReadOnly}
                                    />
                                    <span className={styles.checkmark}></span>
                                    <span>Tài khoản hoạt động</span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                            disabled={loading}
                        >
                            {isReadOnly ? 'Đóng' : 'Hủy'}
                        </button>

                        {!isReadOnly && (
                            <button
                                type="submit"
                                className={styles.saveButton}
                                disabled={loading}
                            >
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
