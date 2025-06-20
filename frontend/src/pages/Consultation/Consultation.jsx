import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ConsultantCard from '../../components/consultation/ConsultantCard/ConsultantCard';
import ConsultantDetailModal from '../../components/consultation/ConsultantDetailModal/ConsultantDetailModal';
import BookingModal from '../../components/consultation/BookingModal/BookingModal';
import LoginForm from '../../components/auth/Login/LoginForm';
import RegisterForm from '../../components/auth/Register/RegisterForm';
import { consultationService } from '../../services/consultationService';
import { useAuthModal } from '../../hooks/useAuthModal';
import styles from './Consultation.module.css';

const Consultation = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Auth modals
    const {
        showLoginModal,
        showRegisterModal,
        openLoginModal,
        closeModals,
        switchToLogin,
        switchToRegister
    } = useAuthModal();

    useEffect(() => {
        fetchData();
    }, []);

    const handleAuthRequired = () => {
        openLoginModal();
    }; const fetchData = async () => {
        try {
            setLoading(true);

            // Chỉ fetch danh sách consultants
            const consultantsRes = await consultationService.getAllConsultants(handleAuthRequired);

            if (consultantsRes.success) {
                setConsultants(consultantsRes.data || []);
            } else {
                // Không hiển thị toast error, chỉ log để debug
                console.warn('Could not load consultants:', consultantsRes.message);
                setConsultants([]);
            }

        } catch (error) {
            console.error('Error fetching consultation data:', error);
            // Không hiển thị toast error cho việc tải danh sách consultant
            setConsultants([]);
        } finally {
            setLoading(false);
        }
    }; const handleBookConsultation = (consultant) => {
        if (!user) {
            openLoginModal();
            return;
        }

        setSelectedConsultant(consultant);
        setShowBookingModal(true);
    };

    const handleViewDetails = (consultant) => {
        setSelectedConsultant(consultant);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedConsultant(null);
    };

    const handleCloseBookingModal = () => {
        setShowBookingModal(false);
        setSelectedConsultant(null);
    }; const handleBookingSuccess = (bookingData) => {
        setShowBookingModal(false);
        setSelectedConsultant(null);
        addToast('Đặt lịch tư vấn thành công! Chuyên gia sẽ xác nhận lịch trong vòng 24 giờ và gửi link tham gia qua email.', 'success');
    };

    const handleBookingError = (error) => {
        console.error('Booking error details:', error);

        // Xử lý các loại lỗi cụ thể từ backend
        let errorMessage = 'Có lỗi xảy ra khi đặt lịch tư vấn';

        if (error.message) {
            const message = error.message.toLowerCase();

            if (message.includes('check constraint') || message.includes('constraint')) {
                errorMessage = 'Có lỗi dữ liệu. Vui lòng thử lại sau ít phút.';
            } else if (message.includes('time slot') || message.includes('not available')) {
                errorMessage = 'Khung giờ đã được đặt. Vui lòng chọn khung giờ khác.';
            } else if (message.includes('consultant not found')) {
                errorMessage = 'Không tìm thấy chuyên gia. Vui lòng thử lại.';
            } else if (message.includes('network') || message.includes('connection')) {
                errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
            } else {
                errorMessage = error.message;
            }
        }

        addToast(errorMessage, 'error');
    };

    const handleViewMyConsultations = () => {
        if (!user) {
            openLoginModal();
            return;
        }
        navigate('/profile/consultation-history');
    }; const handleLoginSuccess = () => {
        closeModals();
        // Refresh data after login
        fetchData();
        // Không cần toast ở đây vì LoginForm đã có toast
    };

    const handleRetry = () => {
        fetchData();
    };

    if (loading) {
        return (
            <div className={styles.consultationPage}>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.consultationPage}>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.consultationHeader}>
                    <h1>Tư vấn trực tuyến</h1>
                    <p>Đặt lịch tư vấn với các chuyên gia y tế có kinh nghiệm</p>

                    <div className={styles.consultationInfo}>
                        <div className={styles.serviceInfo}>
                            <div className={styles.serviceFeature}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 9V5a3 3 0 0 0-6 0v4"></path>
                                    <rect x="2" y="9" width="20" height="12" rx="2" ry="2"></rect>
                                    <circle cx="12" cy="15" r="1"></circle>
                                </svg>
                                <span>Tư vấn trực tuyến 1-1</span>
                            </div>

                            <div className={styles.serviceFeature}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                <span>Thời lượng 2 giờ</span>
                            </div>

                            <div className={styles.serviceFeature}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 11l3 3L22 4"></path>
                                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                                </svg>
                                <span>Chuyên gia có kinh nghiệm</span>
                            </div>

                            <div className={styles.serviceFeature}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                                <span>Miễn phí tư vấn</span>
                            </div>
                        </div>

                        <button
                            className={styles.btnOutlinePrimary}
                            onClick={handleViewMyConsultations}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            {user ? 'Lịch tư vấn của tôi' : 'Đăng nhập để xem lịch tư vấn'}
                        </button>
                    </div>
                </div>

                <div className={styles.consultantsSection}>
                    <h2>Chọn chuyên gia tư vấn</h2>                    {consultants.length > 0 ? (
                        <div className={styles.consultantsGrid}>                            {consultants.map(consultant => (
                            <ConsultantCard
                                key={consultant.userId || consultant.profileId || consultant.id}
                                consultant={consultant}
                                onBookConsultation={handleBookConsultation}
                                onViewDetails={handleViewDetails}
                                onAuthRequired={handleAuthRequired}
                            />
                        ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </div>
                            <h3>Chưa có chuyên gia nào</h3>
                            <p>Hiện tại chưa có chuyên gia tư vấn. Vui lòng quay lại sau!</p>
                            <button onClick={handleRetry} className={styles.btnPrimary}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 4v6h-6"></path>
                                    <path d="M1 20v-6h6"></path>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                                Thử lại
                            </button>
                        </div>
                    )}
                </div>
            </div>            {/* Detail Modal */}
            {showDetailModal && selectedConsultant && (
                <ConsultantDetailModal
                    consultant={selectedConsultant}
                    onClose={handleCloseDetailModal}
                    onBookConsultation={handleBookConsultation}
                />
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedConsultant && (
                <BookingModal
                    consultant={selectedConsultant}
                    onClose={handleCloseBookingModal}
                    onSuccess={handleBookingSuccess}
                    onError={handleBookingError}
                    onAuthRequired={handleAuthRequired}
                />
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className={styles.modalOverlay} onClick={closeModals}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <LoginForm
                            onClose={closeModals}
                            onSwitchToRegister={switchToRegister}
                            onLoginSuccess={handleLoginSuccess}
                        />
                    </div>
                </div>
            )}

            {/* Register Modal */}
            {showRegisterModal && (
                <div className={styles.modalOverlay} onClick={closeModals}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <RegisterForm
                            onClose={closeModals}
                            onSwitchToLogin={switchToLogin}
                        />
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Consultation;