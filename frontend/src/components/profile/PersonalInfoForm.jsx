import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import styles from './PersonalInfoForm.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const PersonalInfoForm = () => {
    const { user, updateUser, isLoading } = useAuth();
    const toast = useToast();
    const [formData, setFormData] = useState({
        fullName: '',
        birthDay: '',
        phone: '',
        gender: '',
    });
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    const setUserDataToForm = useCallback((userData) => {
        console.log('🔄 Setting user data to form:', userData);

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
                    console.error('Error parsing birthDay:', e);
                    formattedBirthDay = '';
                }
            }
        }

        const newFormData = {
            fullName: userData.fullName || '',
            birthDay: formattedBirthDay,
            phone: userData.phone || '',
            gender: userData.gender || '',
        };

        console.log('✅ Form data set to:', newFormData);
        setFormData(newFormData);

        // Set avatar preview
        if (userData.avatar) {
            const newAvatarUrl = authService.getAvatarUrl(userData.avatar);
            console.log('🖼️ Setting avatar preview:', newAvatarUrl);
            setAvatarPreview(newAvatarUrl);
        } else {
            console.log('🖼️ No avatar found, clearing preview');
            setAvatarPreview('');
        }
    }, []); // No dependencies needed as this is just a data transformation

    useEffect(() => {
        console.log('🔍 PersonalInfoForm useEffect triggered:', {
            isLoading,
            hasUser: !!user,
            userKeys: user ? Object.keys(user) : null,
            userPreview: user ? {
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar,
                birthDay: user.birthDay,
                phone: user.phone,
                gender: user.gender
            } : null
        });

        if (!isLoading && user) {
            console.log('✅ Setting form data from user');
            setUserDataToForm(user);
            
            // Check if user data is incomplete (missing fullName, avatar, etc.)
            if (!user.fullName && !user.avatar && user.username && user.email) {
                console.log('⚠️ User data seems incomplete, attempting to refresh...');
                handleRefreshUserData();
            }
        } else {
            console.log('⏳ Waiting for user data...', { isLoading, hasUser: !!user });
        }
    }, [user, isLoading, setUserDataToForm]);

    const handleRefreshUserData = async () => {
        try {
            const result = await authService.refreshUserProfile();
            if (result.success && result.data) {
                console.log('✅ User profile refreshed successfully');
                updateUser(result.data);
            } else {
                console.warn('❌ Failed to refresh user profile:', result.message);
            }
        } catch (error) {
            console.error('❌ Error refreshing user profile:', error);
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
    }; const handleAvatarSubmit = async (e) => {
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
                setAvatarFile(null); // Reset file sau khi upload thành công
            } else {
                toast.error(response.message || 'Lỗi khi cập nhật ảnh đại diện');
            }
        } catch (err) {
            toast.error('Đã xảy ra lỗi khi cập nhật ảnh đại diện');
            console.error('Avatar update error:', err);
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
        }

        if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
            toast.error('Số điện thoại không hợp lệ');
            return;
        }

        if (formData.gender && !['Nam', 'Nữ', 'Khác'].includes(formData.gender)) {
            toast.error('Giới tính không hợp lệ');
            return;
        } try {
            setLoading(true);
            const response = await profileService.updateBasicProfile(formData);

            if (response.success) {
                toast.success('Cập nhật thông tin thành công');
                // Cập nhật thông tin user trong context với data từ response
                if (user && response.data) {
                    const newUser = {
                        ...user,
                        fullName: response.data.fullName,
                        birthDay: response.data.birthDay,
                        phone: response.data.phone,
                        gender: response.data.gender
                    };
                    updateUser(newUser);
                }
            } else {
                toast.error(response.message || 'Lỗi khi cập nhật thông tin');
            }
        } catch (err) {
            toast.error('Đã xảy ra lỗi khi cập nhật thông tin');
            console.error('Profile update error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAvatar = () => {
        setAvatarFile(null);
        // Reset preview về avatar hiện tại
        if (user?.avatar) {
            setAvatarPreview(authService.getAvatarUrl(user.avatar));
        } else {
            setAvatarPreview('');
        }
    };

    // Hiển thị loading nếu đang tải user data
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
                
                {/* Add refresh button if user data is incomplete */}
                {user && !user.fullName && !user.avatar && (
                    <div style={{ marginTop: '10px' }}>
                        <button 
                            onClick={handleRefreshUserData}
                            style={{ 
                                background: '#007bff', 
                                color: 'white', 
                                border: 'none', 
                                padding: '8px 16px', 
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🔄 Tải lại thông tin cá nhân
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.content}>
                {/* Avatar Section */}
                <div className={styles.avatarSection}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatarImageWrapper}>                            <img
                            src={avatarPreview || authService.getAvatarUrl(user?.avatar || null)}
                            alt="Avatar"
                            className={styles.avatarImage}
                            onError={(e) => {
                                // Prevent infinite loop by checking if already set to backend default
                                const backendDefault = `http://localhost:8080/img/avatar/default.jpg`;
                                console.log('🖼️ Image error, current src:', e.target.src, 'fallback:', backendDefault);
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
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="phone" className={styles.label}>
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Nhập số điện thoại"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
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
                                    <a href="/profile/security" className={styles.changeLink}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        Thay đổi
                                    </a>
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