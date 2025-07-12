import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import styles from './PersonalInfoForm.module.css';

const PersonalInfoForm = () => {
    const { user, updateUser, isLoading } = useAuth();
    const toast = useToast(); const [formData, setFormData] = useState({
        fullName: '',
        birthDay: '',
        gender: '',
    });
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    // Helper function to build avatar URL (dùng chung toàn app, giống authService)
    const getAvatarUrl = (avatarPath) => {
        return authService.getAvatarUrl(avatarPath);
    };

    const setUserDataToForm = useCallback((userData) => {
        // Xử lý birthDay
        let formattedBirthDay = '';
        if (userData.birthDay) {
            if (Array.isArray(userData.birthDay)) {
                const [year, month, day] = userData.birthDay;
                formattedBirthDay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } else {
                try {
                    formattedBirthDay = new Date(userData.birthDay).toISOString().split('T')[0];
                } catch (e) {
                    formattedBirthDay = '';
                }
            }
        } const newFormData = {
            fullName: userData.fullName || '',
            birthDay: formattedBirthDay,
            gender: userData.gender || '',
        };

        setFormData(newFormData);

        // Set avatar preview
        if (userData.avatar) {
            const newAvatarUrl = authService.getAvatarUrl(userData.avatar);
            setAvatarPreview(newAvatarUrl);
        } else {
            setAvatarPreview('');
        }
    }, []);

    useEffect(() => {
        if (!isLoading && user) {
            setUserDataToForm(user);

            // Check if user data is incomplete (missing fullName, avatar, etc.)
            if (!user.fullName && !user.avatar && user.username && user.email) {
                handleRefreshUserData();
            }
        }
    }, [user, isLoading, setUserDataToForm]);

    const handleRefreshUserData = async () => {
        try {
            const result = await authService.refreshUserProfile();
            if (result.success && result.data) {
                updateUser(result.data);
            }
        } catch (error) {
            // Silent fail - không cần toast vì đây là background operation
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Kiểm tra file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 5MB');
                return;
            }

            // Kiểm tra file type
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh hợp lệ');
                return;
            }

            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarSubmit = async (e) => {
        e.preventDefault();
        if (!avatarFile) return;

        try {
            setLoading(true);
            const response = await profileService.updateAvatar(avatarFile);

            if (response.success) {
                toast.success('Cập nhật ảnh đại diện thành công');
                if (user) {
                    const newUser = { ...user, avatar: response.data };
                    updateUser(newUser);
                }
                setAvatarFile(null);
            } else {
                toast.error(response.message || 'Lỗi khi cập nhật ảnh đại diện');
            }
        } catch (err) {
            toast.error('Đã xảy ra lỗi khi cập nhật ảnh đại diện');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate dữ liệu
        if (!formData.fullName.trim()) {
            toast.error('Vui lòng nhập họ và tên');
            return;
        } if (formData.gender && !['Nam', 'Nữ', 'Khác'].includes(formData.gender)) {
            toast.error('Giới tính không hợp lệ');
            return;
        }

        try {
            setLoading(true);
            const response = await profileService.updateBasicProfile(formData);

            if (response.success) {
                toast.success('Cập nhật thông tin thành công');
                if (user && response.data) {
                    const newUser = {
                        ...user,
                        fullName: response.data.fullName,
                        birthDay: response.data.birthDay,
                        gender: response.data.gender
                    };
                    updateUser(newUser);
                }
            } else {
                toast.error(response.message || 'Lỗi khi cập nhật thông tin');
            }
        } catch (err) {
            toast.error('Đã xảy ra lỗi khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAvatar = () => {
        setAvatarFile(null);
        if (user?.avatar) {
            setAvatarPreview(authService.getAvatarUrl(user.avatar));
        } else {
            setAvatarPreview('');
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải thông tin người dùng...</p>
            </div>
        );
    }

    return (
        <div className={styles.personalInfoForm}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Thông tin cá nhân
                </h2>
                <p className={styles.subtitle}>
                    Cập nhật thông tin cá nhân và ảnh đại diện của bạn
                </p>
            </div>

            <div className={styles.content}>
                {/* Avatar Section */}
                <div className={styles.avatarSection}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatarImageWrapper}>
                            <img
                                src={avatarPreview || getAvatarUrl(user?.avatar)}
                                alt="Avatar"
                                className={styles.avatarImage}
                                onError={(e) => {
                                    const backendDefault = getAvatarUrl();
                                    if (e.target.src !== backendDefault) {
                                        e.target.src = backendDefault;
                                    }
                                }}
                            />
                            <label htmlFor="avatar-upload" className={styles.avatarUploadLabel}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </label>
                            <input
                                type="file"
                                id="avatar-upload"
                                className={styles.avatarUpload}
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <div className={styles.avatarInfo}>
                            <h4>Ảnh đại diện</h4>
                            <p>Chọn ảnh có kích thước tối đa 5MB</p>
                            <p>Định dạng: JPG, PNG, GIF</p>
                        </div>
                    </div>

                    {avatarFile && (
                        <div className={styles.avatarActions}>
                            <button
                                className={`${styles.btn} ${styles.primaryBtn}`}
                                onClick={handleAvatarSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                        </svg>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20,6 9,17 4,12"></polyline>
                                        </svg>
                                        Lưu ảnh đại diện
                                    </>
                                )}
                            </button>
                            <button
                                className={`${styles.btn} ${styles.secondaryBtn}`}
                                onClick={handleCancelAvatar}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                        </div>
                    )}
                </div>

                {/* Form Section */}
                <div className={styles.formSection}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="fullName" className={styles.label}>
                                    Họ và tên <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Nhập họ và tên"
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="birthDay" className={styles.label}>
                                    Ngày sinh
                                </label>
                                <input
                                    type="date"
                                    id="birthDay"
                                    name="birthDay"
                                    value={formData.birthDay}
                                    onChange={handleInputChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    className={styles.input}
                                />
                            </div>                            <div className={styles.formGroup}>
                                <label htmlFor="gender" className={styles.label}>
                                    Giới tính
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className={`${styles.input} ${styles.selectInput}`}
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <div className={styles.readOnlyField}>
                                    <span className={styles.readOnlyValue}>{user?.email || ''}</span>
                                    {user?.provider === 'LOCAL' && (
                                        <a href="#/profile/security" className={styles.changeLink}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                            Thay đổi
                                        </a>
                                    )}
                                    {user?.provider === 'GOOGLE' && (
                                        <span className={styles.oauthBadge}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                            </svg>
                                            Đăng nhập bằng Google
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tài khoản</label>
                                <div className={styles.readOnlyField}>
                                    <span className={styles.readOnlyValue}>{user?.username || ''}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="submit"
                                className={`${styles.btn} ${styles.primaryBtn} ${styles.submitBtn}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                        </svg>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20,6 9,17 4,12"></polyline>
                                        </svg>
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PersonalInfoForm;