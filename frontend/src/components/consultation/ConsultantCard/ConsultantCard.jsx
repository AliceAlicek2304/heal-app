import React, { useState, useEffect } from 'react';
import { consultationService } from '../../../services/consultationService';
import { authService } from '../../../services/authService';
import './ConsultantCard.css';

const ConsultantCard = ({ consultant, consultationPrice, onBookConsultation }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConsultantProfile();
    }, [consultant.id]);

    const fetchConsultantProfile = async () => {
        try {
            const response = await consultationService.getConsultantProfile(consultant.id);
            if (response.success) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('Error fetching consultant profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDisplayName = () => {
        return consultant.fullName || consultant.username || 'Chuyên gia';
    };

    const getSpecialization = () => {
        return profile?.qualifications || 'Tư vấn tổng quát';
    };

    const getExperience = () => {
        return profile?.experience || 'Kinh nghiệm chuyên môn';
    };

    const getBio = () => {
        return profile?.bio || 'Thông tin chi tiết';
    };

    return (
        <div className="consultant-card">
            <div className="consultant-avatar">
                <img
                    src={authService.getAvatarUrl(consultant.avatar)}
                    alt={getDisplayName()}
                    onError={(e) => {
                        e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                    }}
                />
            </div>

            <div className="consultant-info">
                <h3 className="consultant-name">{getDisplayName()}</h3>

                <div className="consultant-details">
                    <div className="detail-item">
                        <i className="fas fa-user-md"></i>
                        <span>{getSpecialization()}</span>
                    </div>

                    <div className="detail-item">
                        <i className="fas fa-clock"></i>
                        <span>{getExperience()}</span>
                    </div>

                    <div className="detail-item">
                        <i className="fas fa-info-circle"></i>
                        <span>{getBio()}</span>
                    </div>
                </div>

                <div className="consultant-price">
                    <span className="price-text">Giá tư vấn:</span>
                    <span className="price-amount">
                        {consultationPrice.toLocaleString('vi-VN')} VNĐ/giờ
                    </span>
                </div>

                <div className="consultant-actions">
                    <button
                        className="btn btn-primary book-btn"
                        onClick={() => onBookConsultation(consultant)}
                        disabled={loading}
                    >
                        <i className="fas fa-calendar-plus"></i>
                        Đặt lịch tư vấn
                    </button>
                </div>
            </div>

            {loading && (
                <div className="card-loading">
                    <div className="loading-spinner"></div>
                </div>
            )}
        </div>
    );
};

export default ConsultantCard;