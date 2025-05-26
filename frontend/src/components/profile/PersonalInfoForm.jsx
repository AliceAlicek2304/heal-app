import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { FaCamera } from 'react-icons/fa';
import './PersonalInfoForm.css';

const PersonalInfoForm = () => {
    const { user, updateUser, isLoading } = useAuth(); // Thêm isLoading
    const [formData, setFormData] = useState({
        fullName: '',
        birthDay: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    // Cập nhật useEffect để xử lý birthDay đúng cách
    useEffect(() => {
        if (!isLoading && user) {
            console.log('User data loaded:', user); // Debug log

            // Xử lý birthDay - backend có thể trả về array [year, month, day] hoặc string
            let formattedBirthDay = '';
            if (user.birthDay) {
                if (Array.isArray(user.birthDay)) {
                    // Nếu là array [year, month, day] từ LocalDate của Java
                    const [year, month, day] = user.birthDay;
                    formattedBirthDay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                } else {
                    // Nếu là string, parse thành date
                    try {
                        formattedBirthDay = new Date(user.birthDay).toISOString().split('T')[0];
                    } catch (e) {
                        console.error('Error parsing birthDay:', e);
                        formattedBirthDay = '';
                    }
                }
            }

            setFormData({
                fullName: user.fullName || '',
                birthDay: formattedBirthDay,
                phone: user.phone || '',
            });

            if (user.avatar) {
                setAvatarPreview(authService.getAvatarUrl(user.avatar));
            }
        }
    }, [user, isLoading]);

    useEffect(() => {
        // Tự động xóa thông báo sau 5 giây
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Reset thông báo khi người dùng thay đổi dữ liệu
        setError('');
        setSuccess('');
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setError('');
            setSuccess('');
        }
    };

    const handleAvatarSubmit = async (e) => {
        e.preventDefault();
        if (!avatarFile) return;

        try {
            setLoading(true);
            const response = await authService.updateAvatar(avatarFile);

            if (response.success) {
                setSuccess('Cập nhật ảnh đại diện thành công');
                if (user) {
                    const newUser = { ...user, avatar: response.data };
                    updateUser(newUser);
                }
                setAvatarFile(null); // Reset file sau khi upload thành công
            } else {
                setError(response.message || 'Lỗi khi cập nhật ảnh đại diện');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi cập nhật ảnh đại diện');
            console.error('Avatar update error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate dữ liệu
        if (!formData.fullName) {
            setError('Vui lòng nhập họ và tên');
            return;
        }

        try {
            setLoading(true);
            const response = await authService.updateBasicProfile(formData);

            if (response.success) {
                setSuccess('Cập nhật thông tin thành công');
                // Cập nhật thông tin user trong context với data từ response
                if (user && response.data) {
                    const newUser = {
                        ...user,
                        fullName: response.data.fullName,
                        birthDay: response.data.birthDay,
                        phone: response.data.phone
                    };
                    updateUser(newUser);
                }
            } else {
                setError(response.message || 'Lỗi khi cập nhật thông tin');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi cập nhật thông tin');
            console.error('Profile update error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Hiển thị loading nếu đang tải user data
    if (isLoading) {
        return (
            <div className="personal-info-form loading">
                <div>Đang tải thông tin người dùng...</div>
            </div>
        );
    }

    return (
        <div className="personal-info-form">
            <div className="avatar-section">
                <div className="avatar-container">
                    <img
                        src={avatarPreview || '/img/avatar/default.jpg'}
                        alt="Avatar"
                        className="avatar-image"
                    />
                    <label htmlFor="avatar-upload" className="avatar-upload-label">
                        <FaCamera />
                    </label>
                    <input
                        type="file"
                        id="avatar-upload"
                        className="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />
                </div>
                {avatarFile && (
                    <button
                        className="btn btn-primary avatar-save-btn"
                        onClick={handleAvatarSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu ảnh đại diện'}
                    </button>
                )}
            </div>

            {(success || error) && (
                <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
                    {error || success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="fullName">Họ và tên</label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Nhập họ và tên"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="birthDay">Ngày sinh</label>
                    <input
                        type="date"
                        id="birthDay"
                        name="birthDay"
                        value={formData.birthDay}
                        onChange={handleInputChange}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Nhập số điện thoại"
                    />
                </div>

                <div className="form-group read-only">
                    <label>Email</label>
                    <div className="read-only-value">
                        <span>{user?.email || ''}</span>
                        <a href="/profile/security" className="change-link">Thay đổi</a>
                    </div>
                </div>

                <div className="form-group read-only">
                    <label>Tài khoản</label>
                    <div className="read-only-value">
                        <span>{user?.username || ''}</span>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PersonalInfoForm;