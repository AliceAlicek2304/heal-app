import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SidebarNav from '../../components/profile/SidebarNav';
import PersonalInfoForm from '../../components/profile/PersonalInfoForm';
import SecurityForm from '../../components/profile/SecurityForm';
import MenstrualHistoryComponent from '../../components/profile/MenstrualHistoryComponent';
import BlogHistory from '../../components/profile/BlogHistory';
import MyQuestions from '../../components/profile/MyQuestions';
import ConsultationHistory from '../../components/profile/ConsultationHistory';
import Navbar from '../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import './ProfilePage.css';

const ProfilePage = () => {
    const { tab } = useParams();
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const activeTab = tab || 'personal-info';

    // Chỉ redirect khi đã biết chắc user không tồn tại
    useEffect(() => {
        if (!isLoading && !user) {
            navigate('/', { replace: true });
        }
    }, [isLoading, user, navigate]);

    // Trong khi đang kiểm tra auth, hiển thị loading
    if (isLoading) {
        return (
            <div className="profile-page-loading">
                <Navbar />
                <div className="profile-loading-inner">
                    <LoadingSpinner />
                    <p>Đang tải thông tin tài khoản…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Navbar />
            <div className="profile-container">
                <div className="profile-header">
                    <h1>Thông tin tài khoản</h1>
                </div>

                <div className="profile-content">
                    <SidebarNav activeTab={activeTab} />

                    <div className="content-area">
                        {activeTab === 'personal-info' && (
                            <div className="content-section">
                                <h2>Thông tin cá nhân</h2>
                                <PersonalInfoForm />
                            </div>
                        )}
                        {activeTab === 'security' && (
                            <div className="content-section">
                                <h2>Bảo mật tài khoản</h2>
                                <SecurityForm />
                            </div>
                        )}
                        {activeTab === 'consultation-history' && (
                            <div className="content-section">
                                <ConsultationHistory />
                            </div>
                        )}
                        {activeTab === 'menstrual-history' && (
                            <div className="content-section">
                                <h2>Lịch sử chu kỳ kinh nguyệt</h2>
                                <MenstrualHistoryComponent />
                            </div>
                        )}
                        {activeTab === 'blog-history' && (
                            <div className="content-section">
                                <BlogHistory />
                            </div>
                        )}
                        {activeTab === 'my-questions' && (
                            <div className="content-section">
                                <MyQuestions />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;