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
import './STITesting.css';

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
        } else {
            toast.success('Đặt lịch xét nghiệm thành công! Bạn có thể xem chi tiết trong "Lịch sử xét nghiệm"');
        }
    };

    const handleBookingError = (error) => {
        console.error('Booking error details:', error);

        let errorMessage = 'Có lỗi xảy ra khi đặt lịch xét nghiệm';

        if (error.message) {
            const message = error.message.toLowerCase();

            if (message.includes('payment failed') || message.includes('payment')) {
                errorMessage = 'Thanh toán thất bại. Vui lòng kiểm tra thông tin thẻ và thử lại.';
            } else if (message.includes('appointment') || message.includes('time')) {
                errorMessage = 'Thời gian hẹn không hợp lệ. Vui lòng chọn thời gian khác.';
            } else if (message.includes('service not found')) {
                errorMessage = 'Không tìm thấy dịch vụ. Vui lòng thử lại.';
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
        <div className="sti-testing-page">
            <Navbar />
            <div className="container">
                <div className="sti-header">
                    <h1>Xét nghiệm nhiễm trùng lây truyền qua đường tình dục (STI)</h1>
                    <p>Đặt lịch xét nghiệm STI với các dịch vụ chuyên nghiệp, bảo mật</p>

                    <div className="sti-info">
                        <div className="info-highlights">
                            <div className="highlight-item">
                                <i className="fas fa-shield-alt"></i>
                                <span>Bảo mật tuyệt đối</span>
                            </div>
                            <div className="highlight-item">
                                <i className="fas fa-user-md"></i>
                                <span>Chuyên gia y tế</span>
                            </div>
                            <div className="highlight-item">
                                <i className="fas fa-clock"></i>
                                <span>Kết quả nhanh chóng</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-outline-primary"
                            onClick={handleViewMyTests}
                        >
                            <i className="fas fa-history"></i>
                            {user ? 'Lịch sử xét nghiệm' : 'Đăng nhập để xem lịch sử'}
                        </button>
                    </div>
                </div>

                <div className="services-section">
                    <h2>Chọn dịch vụ xét nghiệm</h2>

                    {services.length > 0 ? (
                        <div className="services-grid">
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
                        <div className="empty-state">
                            <h3>Chưa có dịch vụ nào</h3>
                            <p>Hiện tại chưa có dịch vụ xét nghiệm. Vui lòng quay lại sau!</p>
                            <button onClick={handleRetry} className="btn btn-primary">
                                <i className="fas fa-refresh"></i>
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
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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