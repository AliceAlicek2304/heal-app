import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { consultationService } from '../../services/consultationService';
import { authService } from '../../services/authService';
import styles from './ConsultantProfile.module.css';

const ConsultantProfile = () => {
    const { user, logout } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        qualifications: '',
        experience: '',
        bio: ''
    });
    const [hasChanges, setHasChanges] = useState(false);

    const isConsultant = user?.role === 'CONSULTANT';

    useEffect(() => {
        if (isConsultant) {
            fetchProfile();
        }
    }, [isConsultant]);    const fetchProfile = async () => {
        try {
            setLoading(true);

            const response = await consultationService.getCurrentConsultantProfile(user, () => {
                // onAuthRequired callback
                toast.error('Phiên đăng nhập hết hạn. Đang đăng xuất...');
                setTimeout(() => {
                    logout();
                    window.location.hash = '#/';
                }, 1500);
            });

            // Kiểm tra cấu trúc response data
            if (response.success && response.data) {
                // Xử lý giá trị "To be updated" từ backend
                const processFieldValue = (value) => {
                    if (!value || value === 'To be updated' || value.trim() === '') {
                        return '';
                    }
                    return value;
                };

                setProfile({
                    qualifications: processFieldValue(response.data.qualifications),
                    experience: processFieldValue(response.data.experience),
                    bio: processFieldValue(response.data.bio)
                });

                setHasChanges(false); // Reset hasChanges after successful fetch
                console.log('✅ Profile loaded successfully');
            } else {
                // Profile might not exist yet - that's ok for new consultants
                console.log('ℹ️ No profile found, starting with empty form');
                setProfile({
                    qualifications: '',
                    experience: '',
                    bio: ''
                });
                setHasChanges(false);
            }
        } catch (error) {
            console.error('❌ Error fetching consultant profile:', error);
            
            // Check if it's an auth-related error
            if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
                // Don't show toast here as it's already handled by the service
                // Just logout the user
                setTimeout(() => {
                    logout();
                    window.location.hash = '#/';
                }, 1000);
            } else {
                toast.error('Có lỗi xảy ra khi tải thông tin hồ sơ');
            }
        } finally {
            setLoading(false);
        }
    };const handleInputChange = (field, value) => {
        // Validation độ dài
        const maxLengths = {
            qualifications: 1000,
            experience: 1000,
            bio: 2000
        };

        if (value.length > maxLengths[field]) {
            toast.error(`${field === 'qualifications' ? 'Chuyên môn' :
                field === 'experience' ? 'Kinh nghiệm' : 'Thông tin giới thiệu'} 
                         không được vượt quá ${maxLengths[field]} ký tự`);
            return;
        }

        setProfile(prev => ({
            ...prev,
            [field]: value
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const response = await consultationService.updateConsultantProfile(profile);

            if (response.success) {
                toast.success('Cập nhật hồ sơ chuyên gia thành công!');
                setHasChanges(false);
                // Refresh profile data
                await fetchProfile();
            } else {
                toast.error(response.message || 'Không thể cập nhật hồ sơ');
            }
        } catch (error) {
            console.error('Error updating consultant profile:', error);
            toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        fetchProfile();
        setHasChanges(false);
    };

    if (!isConsultant) {
        return (
            <div className={styles.container}>
                <div className={styles.accessDenied}>
                    <div className={styles.accessDeniedIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="m4.9 4.9 14.2 14.2"></path>
                        </svg>
                    </div>
                    <h3>Không có quyền truy cập</h3>
                    <p>Chức năng này chỉ dành cho chuyên gia tư vấn.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                    <p>Đang tải thông tin hồ sơ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h2 className={styles.title}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Hồ sơ chuyên gia
                    </h2>
                    <p className={styles.description}>
                        Cập nhật thông tin chuyên môn và kinh nghiệm của bạn
                    </p>
                </div>

                {hasChanges && (
                    <div className={styles.actionButtons}>
                        <button
                            className={styles.resetButton}
                            onClick={handleReset}
                            disabled={saving}
                        >
                            Hủy thay đổi
                        </button>
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17,21 17,13 7,13 7,21"></polyline>
                                        <polyline points="7,3 7,8 15,8"></polyline>
                                    </svg>
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.formSection}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="qualifications" className={styles.label}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                            </svg>
                            Chuyên Môn
                        </label>                        <textarea
                            id="qualifications"
                            className={styles.textarea}
                            placeholder="Ví dụ: Bác sĩ Đa khoa, Chứng chỉ Tâm lý học lâm sàng, Thạc sĩ Y học..."
                            value={profile.qualifications}
                            onChange={(e) => handleInputChange('qualifications', e.target.value)}
                            rows={4}
                        />
                        <div className={styles.fieldHint}>
                            Liệt kê các bằng cấp, chứng chỉ chuyên môn và thành tích học tập
                            <span className={styles.charCount}>({profile.qualifications.length}/1000)</span>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="experience" className={styles.label}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                            </svg>
                            Kinh nghiệm làm việc
                        </label>                        <textarea
                            id="experience"
                            className={styles.textarea}
                            placeholder="Ví dụ: 5 năm kinh nghiệm tại Bệnh viện Đại học Y Hà Nội, chuyên khoa Tim mạch..."
                            value={profile.experience}
                            onChange={(e) => handleInputChange('experience', e.target.value)}
                            rows={4}
                        />
                        <div className={styles.fieldHint}>
                            Mô tả kinh nghiệm làm việc, các vị trí đã đảm nhận và thời gian
                            <span className={styles.charCount}>({profile.experience.length}/1000)</span>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="bio" className={styles.label}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10,9 9,9 8,9"></polyline>
                            </svg>
                            Thông tin giới thiệu
                        </label>                        <textarea
                            id="bio"
                            className={styles.textarea}
                            placeholder="Giới thiệu về bản thân, chuyên môn và phương pháp tư vấn..."
                            value={profile.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={6}
                        />
                        <div className={styles.fieldHint}>
                            Viết giới thiệu ngắn gọn về bản thân và phương pháp tư vấn của bạn
                            <span className={styles.charCount}>({profile.bio.length}/2000)</span>
                        </div>
                    </div>
                </div>

                {!hasChanges && (
                    <div className={styles.savePrompt}>
                        <div className={styles.savePromptIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                        </div>
                        <div className={styles.savePromptContent}>
                            <h4>Hồ sơ của bạn đã được lưu!</h4>
                            <p>Thông tin này sẽ được hiển thị cho khách hàng khi họ chọn bạn làm chuyên gia tư vấn.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultantProfile;