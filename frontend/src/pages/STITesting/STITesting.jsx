import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Navbar from '../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import STIServiceCard from '../../components/sti/STIServiceCard/STIServiceCard';
import STIBookingModal from '../../components/sti/STIBookingModal/STIBookingModal';
import LoginForm from '../../components/auth/Login/LoginForm';
import RegisterForm from '../../components/auth/Register/RegisterForm';
import { stiService } from '../../services/stiService';
import { useAuthModal } from '../../hooks/useAuthModal';
import styles from './STITesting.module.css';

const STITesting = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

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
        fetchServices();
    }, []);

    const handleAuthRequired = () => {
        openLoginModal();
    };

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await stiService.getActiveServices();

            if (response.success) {
                setServices(response.data || []);
            } else {
                toast.error(response.message || 'Không thể tải danh sách dịch vụ');
            }
        } catch (error) {
            console.error('Error fetching STI services:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleBookTest = (service) => {
        if (!user) {
            openLoginModal();
            return;
        }

        setSelectedService(service);
        setShowBookingModal(true);
    };

    const handleCloseBookingModal = () => {
        setShowBookingModal(false);
        setSelectedService(null);
    };

    const handleBookingSuccess = (bookingData) => {
        setShowBookingModal(false);
        setSelectedService(null);

        if (bookingData && bookingData.paymentMethod === 'VISA') {
            toast.success('Thanh toán thành công! Đặt lịch xét nghiệm hoàn tất. Bạn có thể xem chi tiết trong "Lịch sử xét nghiệm"');
        } else if (bookingData && bookingData.paymentMethod === 'QR_CODE') {
            toast.success('Đặt lịch xét nghiệm thành công! Vui lòng quét mã QR để thanh toán. Bạn có thể xem chi tiết và trạng thái thanh toán trong "Lịch sử xét nghiệm"');
        } else if (bookingData && bookingData.paymentMethod === 'COD') {
            toast.success('Đặt lịch xét nghiệm thành công! Thanh toán khi nhận dịch vụ. Bạn có thể xem chi tiết trong "Lịch sử xét nghiệm"');
        } else {
            toast.success('Đặt lịch xét nghiệm thành công! Bạn có thể xem chi tiết trong "Lịch sử xét nghiệm"');
        }
    };

    const handleBookingError = (error) => {
        console.error('Booking error details:', error);

        let errorMessage = 'Có lỗi xảy ra khi đặt lịch xét nghiệm';

        if (error.message) {
            const message = error.message.toLowerCase();

            if (message.includes('payment failed') || message.includes('stripe')) {
                errorMessage = 'Thanh toán thất bại. Vui lòng kiểm tra thông tin thẻ và thử lại.';
            } else if (message.includes('qr') || message.includes('qr code')) {
                errorMessage = 'Không thể tạo mã QR thanh toán. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.';
            } else if (message.includes('appointment') || message.includes('time')) {
                errorMessage = 'Thời gian hẹn không hợp lệ. Vui lòng chọn thời gian ít nhất 2 giờ sau hiện tại.';
            } else if (message.includes('service not found')) {
                errorMessage = 'Không tìm thấy dịch vụ. Vui lòng thử lại.';
            } else if (message.includes('service is not available')) {
                errorMessage = 'Dịch vụ hiện không khả dụng. Vui lòng chọn dịch vụ khác.';
            } else if (message.includes('invalid payment method')) {
                errorMessage = 'Phương thức thanh toán không hợp lệ. Vui lòng chọn lại.';
            } else {
                errorMessage = error.message;
            }
        }

        toast.error(errorMessage);
    };

    const handleViewMyTests = () => {
        if (!user) {
            openLoginModal();
            return;
        }
        navigate('/profile/sti-history');
    };

    const handleLoginSuccess = () => {
        closeModals();
        fetchServices();
        toast.success('Đăng nhập thành công!');
    };

    const handleRetry = () => {
        fetchServices();
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className={styles.stiTestingPage}>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.stiHeader}>
                    <h1>Xét nghiệm nhiễm trùng lây truyền qua đường tình dục (STI)</h1>
                    <p>Đặt lịch xét nghiệm STI với các dịch vụ chuyên nghiệp, bảo mật</p>

                    <div className={styles.stiInfo}>
                        <div className={styles.infoHighlights}>
                            <div className={styles.highlightItem}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <span>Bảo mật tuyệt đối</span>
                            </div>
                            <div className={styles.highlightItem}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <polyline points="17 11 19 13 23 9"></polyline>
                                </svg>
                                <span>Chuyên gia y tế</span>
                            </div>
                            <div className={styles.highlightItem}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span>Kết quả nhanh chóng</span>
                            </div>
                            {/* ✅ Thêm highlight cho QR payment */}
                            <div className={styles.highlightItem}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <rect x="7" y="7" width="3" height="3"></rect>
                                    <rect x="14" y="7" width="3" height="3"></rect>
                                    <rect x="7" y="14" width="3" height="3"></rect>
                                    <path d="m14 14 3 3"></path>
                                    <path d="m14 17 3-3"></path>
                                </svg>
                                <span>Thanh toán QR tiện lợi</span>
                            </div>
                        </div>

                        <button
                            className={styles.btnOutlinePrimary}
                            onClick={handleViewMyTests}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            {user ? 'Lịch sử xét nghiệm' : 'Đăng nhập để xem lịch sử'}
                        </button>
                    </div>
                </div>

                <div className={styles.servicesSection}>
                    <h2>Chọn dịch vụ xét nghiệm</h2>

                    {services.length > 0 ? (
                        <div className={styles.servicesGrid}>
                            {services.map(service => (
                                <STIServiceCard
                                    key={service.serviceId}
                                    service={service}
                                    onBookTest={handleBookTest}
                                    onAuthRequired={handleAuthRequired}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                            </div>
                            <h3>Chưa có dịch vụ nào</h3>
                            <p>Hiện tại chưa có dịch vụ xét nghiệm. Vui lòng quay lại sau!</p>
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
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedService && (
                <STIBookingModal
                    service={selectedService}
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
        </div>
    );
};

export default STITesting;