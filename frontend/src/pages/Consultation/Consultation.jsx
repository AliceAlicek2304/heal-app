import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Navbar from '../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ConsultantCard from '../../components/consultation/ConsultantCard/ConsultantCard';
import BookingModal from '../../components/consultation/BookingModal/BookingModal';
import LoginForm from '../../components/auth/Login/LoginForm';
import RegisterForm from '../../components/auth/Register/RegisterForm';
import { consultationService } from '../../services/consultationService';
import { useAuthModal } from '../../hooks/useAuthModal';
import './Consultation.css';

const Consultation = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [consultationPrice, setConsultationPrice] = useState(150000);

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
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch consultants và price parallel
            const [consultantsRes, priceRes] = await Promise.all([
                consultationService.getAllConsultants(handleAuthRequired),
                consultationService.getConsultationPrice(handleAuthRequired)
            ]);

            if (consultantsRes.success) {
                setConsultants(consultantsRes.data || []);
            } else {
                toast.error(consultantsRes.message || 'Không thể tải danh sách chuyên gia');
            }

            // Handle price response với fallback
            if (priceRes.success && priceRes.data) {
                setConsultationPrice(priceRes.data);
            } else {
                console.warn('Failed to get consultation price, using fallback:', priceRes.message);
                setConsultationPrice(150000);
                toast.warning('Không thể tải giá tư vấn, sử dụng giá mặc định');
            }

        } catch (error) {
            console.error('Error fetching consultation data:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
            setConsultationPrice(150000);
        } finally {
            setLoading(false);
        }
    };

    const handleBookConsultation = (consultant) => {
        if (!user) {
            openLoginModal();
            return;
        }

        setSelectedConsultant(consultant);
        setShowBookingModal(true);
    };

    const handleCloseBookingModal = () => {
        setShowBookingModal(false);
        setSelectedConsultant(null);
    };

    const handleBookingSuccess = (bookingData) => {
        setShowBookingModal(false);
        setSelectedConsultant(null);

        // Hiển thị thông báo thành công với thông tin chi tiết
        if (bookingData && bookingData.paymentMethod === 'VISA') {
            toast.success('Thanh toán thành công! Đặt lịch tư vấn hoàn tất. Bạn có thể xem chi tiết trong mục "Lịch tư vấn của tôi"');
        } else {
            toast.success('Đặt lịch tư vấn thành công! Bạn có thể xem chi tiết trong mục "Lịch tư vấn của tôi"');
        }
    };

    const handleBookingError = (error) => {
        console.error('Booking error details:', error);

        // Xử lý các loại lỗi cụ thể từ backend
        let errorMessage = 'Có lỗi xảy ra khi đặt lịch tư vấn';

        if (error.message) {
            const message = error.message.toLowerCase();

            if (message.includes('check constraint') || message.includes('constraint')) {
                errorMessage = 'Có lỗi dữ liệu. Vui lòng thử lại sau ít phút.';
            } else if (message.includes('payment failed') || message.includes('payment')) {
                errorMessage = 'Thanh toán thất bại. Vui lòng kiểm tra thông tin thẻ và thử lại.';
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

        toast.error(errorMessage);
    };

    const handleViewMyConsultations = () => {
        if (!user) {
            openLoginModal();
            return;
        }
        navigate('/profile/consultation-history');
    };

    const handleLoginSuccess = () => {
        closeModals();
        // Refresh data after login
        fetchData();
        toast.success('Đăng nhập thành công!');
    };

    const handleRetry = () => {
        fetchData();
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="consultation-page">
            <Navbar />
            <div className="container">
                <div className="consultation-header">
                    <h1>Tư vấn trực tuyến</h1>
                    <p>Đặt lịch tư vấn với các chuyên gia y tế có kinh nghiệm</p>

                    <div className="consultation-info">
                        <div className="price-info">
                            <span className="price-label">Giá tư vấn:</span>
                            <span className="price-value">
                                {consultationPrice.toLocaleString('vi-VN')} VNĐ/giờ
                            </span>
                        </div>

                        <button
                            className="btn btn-outline-primary"
                            onClick={handleViewMyConsultations}
                        >
                            <i className="fas fa-calendar-alt"></i>
                            {user ? 'Lịch tư vấn của tôi' : 'Đăng nhập để xem lịch tư vấn'}
                        </button>
                    </div>
                </div>

                <div className="consultants-section">
                    <h2>Chọn chuyên gia tư vấn</h2>

                    {consultants.length > 0 ? (
                        <div className="consultants-grid">
                            {consultants.map(consultant => (
                                <ConsultantCard
                                    key={consultant.id}
                                    consultant={consultant}
                                    consultationPrice={consultationPrice}
                                    onBookConsultation={handleBookConsultation}
                                    onAuthRequired={handleAuthRequired}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3>Chưa có chuyên gia nào</h3>
                            <p>Hiện tại chưa có chuyên gia tư vấn. Vui lòng quay lại sau!</p>
                            <button onClick={handleRetry} className="btn btn-primary">
                                <i className="fas fa-refresh"></i>
                                Thử lại
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedConsultant && (
                <BookingModal
                    consultant={selectedConsultant}
                    consultationPrice={consultationPrice}
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

export default Consultation;