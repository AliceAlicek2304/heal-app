import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaCalendar, FaGraduationCap, FaBriefcase } from 'react-icons/fa';
import adminService from '../../../services/adminService';
import { useToast } from '../../../contexts/ToastContext';
import { parseDate } from '../../../utils/dateUtils';
import styles from './ConsultantModal.module.css';

const ConsultantModal = ({ consultant, mode, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        // Basic info for create mode
        fullName: '',
        email: '',
        username: '',
        phone: '',
        birthDay: '',
        gender: 'Nam',
        // Professional info
        qualifications: '',
        experience: '',
        bio: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { addToast } = useToast();

    // Helper function to build avatar URL
    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null;

        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

        // Nếu đã là http thì trả về nguyên xi
        if (avatarPath.startsWith('http')) return avatarPath;
        // Nếu đã là /uploads/avatar hoặc /img/avatar thì render nguyên xi
        if (avatarPath.startsWith('/uploads/avatar') || avatarPath.startsWith('/img/avatar')) {
            return `${API_BASE_URL}${avatarPath}`;
        }
        // Còn lại thì nối như file
        return `${API_BASE_URL}/uploads/avatar/${avatarPath}`;
    }; useEffect(() => {
        if (mode === 'create') {
            // Reset form for create mode
            setFormData({
                fullName: '',
                email: '',
                username: '',
                phone: '',
                birthDay: '',
                gender: 'Nam',
                qualifications: '',
                experience: '',
                bio: ''
            });
        } else if (consultant && (mode === 'edit' || mode === 'view')) {
            // Fill form for edit/view mode - only professional info is editable
            setFormData({
                fullName: consultant.fullName || '',
                email: consultant.email || '',
                username: '', // Not available in consultant profile
                phone: consultant.phone || '',
                birthDay: '', // Not available in consultant profile or need formatting
                gender: consultant.gender || 'Nam',
                qualifications: consultant.qualifications || '',
                experience: consultant.experience || '',
                bio: consultant.bio || ''
            });
        }
    }, [consultant, mode]); const validateForm = () => {
        const newErrors = {};

        if (mode === 'create') {
            // Basic info validation for create mode
            if (!formData.fullName.trim()) {
                newErrors.fullName = 'Họ và tên là bắt buộc';
            }

            if (!formData.email.trim()) {
                newErrors.email = 'Email là bắt buộc';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Email không hợp lệ';
            }

            if (!formData.username.trim()) {
                newErrors.username = 'Username là bắt buộc';
            } else if (formData.username.length < 4) {
                newErrors.username = 'Username phải có ít nhất 4 ký tự';
            }

            if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
                newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
            }
        }

        // Professional info validation for both create and edit mode
        if (!formData.qualifications.trim()) {
            newErrors.qualifications = 'Bằng cấp/Chứng chỉ là bắt buộc';
        }

        if (!formData.experience.trim()) {
            newErrors.experience = 'Kinh nghiệm làm việc là bắt buộc';
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
            const submitData = { ...formData }; let result;
            if (mode === 'create') {
                // Create full consultant account with user and profile
                result = await adminService.consultants.create(submitData);
                addToast('Tạo tài khoản chuyên viên tư vấn thành công', 'success');
            } else if (mode === 'edit') {
                // Only update professional info (qualifications, experience, bio)
                const profileData = {
                    qualifications: submitData.qualifications,
                    experience: submitData.experience,
                    bio: submitData.bio
                }; result = await adminService.consultants.updateProfile(consultant.userId, profileData);
                addToast('Cập nhật thông tin chuyên viên tư vấn thành công', 'success');
            }

            onSave();
        } catch (error) {
            console.error('Error saving consultant:', error);
            addToast(error.message || 'Có lỗi xảy ra khi lưu thông tin chuyên viên', 'error');
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
    }; const getModalTitle = () => {
        switch (mode) {
            case 'create':
                return 'Tạo tài khoản chuyên viên tư vấn';
            case 'edit':
                return 'Chỉnh sửa thông tin chuyên môn';
            case 'view':
                return 'Thông tin chuyên viên tư vấn';
            default:
                return 'Chuyên viên tư vấn';
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
                </div>                {consultant && (
                    <div className={styles.consultantInfo}>
                        <div className={styles.avatar}>
                            {consultant.avatar ? (
                                <img
                                    src={getAvatarUrl(consultant.avatar)}
                                    alt={consultant.fullName}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className={styles.avatarPlaceholder}
                                style={{ display: consultant.avatar ? 'none' : 'flex' }}
                            >
                                {consultant.fullName?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                        </div>
                        <div className={styles.consultantDetails}>
                            <h4>{consultant.fullName}</h4>
                            <p>{consultant.email}</p>
                            {consultant.phone && <p>{consultant.phone}</p>}
                            {consultant.gender && <p>Giới tính: {consultant.gender}</p>}
                        </div>
                    </div>
                )}                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formScrollContent}>
                        {mode === 'create' && (
                            <>
                                <div className={styles.sectionTitle}>Thông tin cơ bản</div>
                                <div className={styles.formGrid}>
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

                                    {/* Username */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            <FaUser className={styles.labelIcon} />
                                            Username *
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                                            placeholder="Nhập username"
                                        />
                                        {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
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
                                </div>
                            </>
                        )}

                        <div className={styles.sectionTitle}>Thông tin chuyên môn</div><div className={styles.formGrid}>
                            {/* Qualifications */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <FaGraduationCap className={styles.labelIcon} />
                                    Bằng cấp/Chứng chỉ *
                                </label>
                                <input
                                    type="text"
                                    name="qualifications"
                                    value={formData.qualifications}
                                    onChange={handleInputChange}
                                    className={`${styles.input} ${errors.qualifications ? styles.inputError : ''}`}
                                    disabled={isReadOnly}
                                    placeholder="Ví dụ: Thạc sĩ Tâm lý học, Bác sĩ chuyên khoa..."
                                />
                                {errors.qualifications && <span className={styles.errorMessage}>{errors.qualifications}</span>}
                            </div>

                            {/* Experience */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <FaBriefcase className={styles.labelIcon} />
                                    Kinh nghiệm làm việc *
                                </label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleInputChange}
                                    className={`${styles.input} ${errors.experience ? styles.inputError : ''}`}
                                    disabled={isReadOnly}
                                    placeholder="Ví dụ: 5 năm làm việc tại Bệnh viện ABC..."
                                />
                                {errors.experience && <span className={styles.errorMessage}>{errors.experience}</span>}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <FaUser className={styles.labelIcon} />
                                Tiểu sử
                            </label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                className={styles.textarea}
                                disabled={isReadOnly}
                                rows="4"
                                placeholder="Mô tả ngắn về chuyên viên"
                            ></textarea>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                            disabled={loading}
                        >
                            {isReadOnly ? 'Đóng' : 'Hủy'}
                        </button>                        {!isReadOnly && (
                            <button
                                type="submit"
                                className={styles.saveButton}
                                disabled={loading}
                            >
                                {loading ? (mode === 'create' ? 'Đang tạo...' : 'Đang lưu...') : (mode === 'create' ? 'Tạo tài khoản' : 'Lưu')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConsultantModal;
