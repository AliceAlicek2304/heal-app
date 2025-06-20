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
import STIHistory from '../../components/profile/STIHistory';
import ManagerQuestion from '../../components/profile/ManagerQuestion';
import ManageSTIServices from '../../components/profile/ManageSTIServices';
import ManageSTIPackages from '../../components/profile/ManageSTIPackages/ManageSTIPackages';
import ManageSTITests from '../../components/profile/ManageSTITests';
import ManagerRating from '../../components/profile/ManagerRating';
import ConsultantProfile from '../../components/profile/ConsultantProfile';
import ConsultantSchedule from '../../components/profile/ConsultantSchedule';
import ConsultantSTITests from '../../components/profile/ConsultantSTITests';
import ManageBlogs from '../../components/profile/ManageBlogs';
import CategoryManagement from '../../components/profile/CategoryManagement/CategoryManagement';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './ProfilePage.module.css';

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
            <div className={styles.profilePageLoading}>
                <Navbar />
                <div className={styles.profileLoadingInner}>
                    <LoadingSpinner />
                    <p>Đang tải thông tin tài khoản…</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'personal-info':
                return (
                    <div className={styles.contentSection}>
                        <PersonalInfoForm />
                    </div>
                );
            case 'security':
                return (
                    <div className={styles.contentSection}>
                        <SecurityForm />
                    </div>
                );
            case 'consultation-history':
                return (
                    <div className={styles.contentSection}>
                        <ConsultationHistory />
                    </div>
                );
            case 'sti-history':
                return (
                    <div className={styles.contentSection}>
                        <STIHistory />
                    </div>
                );
            case 'menstrual-history':
                return (
                    <div className={styles.contentSection}>
                        <MenstrualHistoryComponent />
                    </div>
                );
            case 'blog-history':
                return (
                    <div className={styles.contentSection}>
                        <BlogHistory />
                    </div>
                );
            case 'my-questions':
                return (
                    <div className={styles.contentSection}>
                        <MyQuestions />
                    </div>
                ); case 'manage-questions':
                return (
                    <div className={styles.contentSection}>
                        <ManagerQuestion />
                    </div>
                );
            case 'manage-sti-services':
                return (
                    <div className={styles.contentSection}>
                        <ManageSTIServices />
                    </div>
                );
            case 'manage-sti-packages':
                return (
                    <div className={styles.contentSection}>
                        <ManageSTIPackages />
                    </div>
                );
            case 'manage-sti-tests':
                return (
                    <div className={styles.contentSection}>
                        <ManageSTITests />
                    </div>
                );
            case 'consultant-profile':
                return (
                    <div className={styles.contentSection}>
                        <ConsultantProfile />
                    </div>
                );
            case 'consultant-schedule':
                return (
                    <div className={styles.contentSection}>
                        <ConsultantSchedule />
                    </div>
                ); case 'consultant-sti-tests':
                return (
                    <div className={styles.contentSection}>
                        <ConsultantSTITests />
                    </div>
                );
            case 'manage-blogs':
                return (
                    <div className={styles.contentSection}>
                        <ManageBlogs />
                    </div>
                ); case 'manage-ratings':
                return (
                    <div className={styles.contentSection}>
                        <ManagerRating />
                    </div>
                );
            case 'manage-categories':
                return (
                    <div className={styles.contentSection}>
                        <CategoryManagement />
                    </div>
                );
            default:
                return (
                    <div className={styles.contentSection}>
                        <div className={styles.notFound}>
                            <h3>Trang không tồn tại</h3>
                            <p>Trang bạn đang tìm kiếm không tồn tại.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={styles.profilePage}>
            <Navbar />
            <div className={styles.profileContainer}>
                <div className={styles.profileContent}>
                    <div className={styles.sidebar}>
                        <SidebarNav activeTab={activeTab} />
                    </div>

                    <div className={styles.contentArea}>
                        {renderContent()}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProfilePage;