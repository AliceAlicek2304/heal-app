import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { consultationService } from '../../../services/consultationService';
import { authService } from '../../../services/authService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { formatDate } from '../../../utils/dateUtils';
import styles from './BookingModal.module.css';

const BookingModal = ({
    consultant,
    onClose,
    onSuccess,
    onError,
    onAuthRequired
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Select DateTime, 2: Confirm

    // Form data
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Time slots
    const timeSlots = [
        { value: '8-10', label: '08:00 - 10:00' },
        { value: '10-12', label: '10:00 - 12:00' },
        { value: '13-15', label: '13:00 - 15:00' },
        { value: '15-17', label: '15:00 - 17:00' }
    ];

    // Get min date (tomorrow)
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // Get max date (30 days from now)
    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        return maxDate.toISOString().split('T')[0];
    };

    const getConsultantAvatarUrl = (avatar) => {
        if (!avatar) return '/img/avatar/default.jpg';

        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
            return avatar;
        }

        return authService.getAvatarUrl(avatar);
    };

    const handleAvatarError = (e) => {
        e.target.src = '/img/avatar/default.jpg';
    };    // Fetch available slots when date changes
    useEffect(() => {
        if (selectedDate && (consultant.userId || consultant.id)) {
            fetchAvailableSlots();
        }
    }, [selectedDate, consultant.userId, consultant.id]);

    const fetchAvailableSlots = async () => {
        if (!selectedDate) return;

        setLoadingSlots(true); try {

            const response = await consultationService.getAvailableTimeSlots(
                consultant.userId || consultant.id,
                selectedDate,
                onAuthRequired
            ); if (response.success) {
                const slots = response.data || [];
                setAvailableSlots(slots);
            } else {
                console.log('🔍 Failed to get slots:', response.message);
                setAvailableSlots([]);
                onError(new Error(response.message || 'Không thể tải khung giờ trống'));
            }
        } catch (error) {
            setAvailableSlots([]);
            onError(error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);
        setSelectedTimeSlot(''); // Reset time slot when date changes
    };

    const handleTimeSlotChange = (timeSlot) => {
        setSelectedTimeSlot(timeSlot);
    };

    const handleNext = () => {
        if (!selectedDate || !selectedTimeSlot) {
            onError(new Error('Vui lòng chọn ngày và khung giờ tư vấn'));
            return;
        }
        const selectedSlot = availableSlots.find(slot => slot.slot === selectedTimeSlot);
        if (!selectedSlot || !selectedSlot.available) {
            onError(new Error('Khung giờ đã chọn không còn trống. Vui lòng chọn khung giờ khác.'));
            return;
        }

        setStep(2);
    };

    const handleConfirmBooking = async () => {
        if (!user) {
            onAuthRequired();
            return;
        }

        setLoading(true); try {
            const bookingData = {
                consultantId: consultant.userId || consultant.id,
                date: selectedDate,
                timeSlot: selectedTimeSlot
            };

            console.log('Booking consultation with data:', bookingData);

            const response = await consultationService.createConsultation(
                bookingData,
                onAuthRequired
            );

            if (response.success) {
                onSuccess(response.data);
            } else {
                onError(new Error(response.message || 'Không thể đặt lịch tư vấn'));
            }
        } catch (error) {
            console.error('Error creating consultation:', error);
            onError(error);
        } finally {
            setLoading(false);
        }
    };

    const getTimeSlotLabel = (value) => {
        const slot = timeSlots.find(slot => slot.value === value);
        return slot ? slot.label : value;
    };

    if (loading) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <div className={styles.loadingContainer}>
                        <LoadingSpinner />
                        <p>Đang xử lý đặt lịch...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>
                        {step === 1 ? 'Chọn thời gian tư vấn' : 'Xác nhận đặt lịch'}
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Consultant Info */}
                    <div className={styles.consultantInfo}>
                        <div className={styles.consultantAvatar}>
                            {consultant.avatar ? (
                                <img
                                    src={getConsultantAvatarUrl(consultant.avatar)}
                                    alt={consultant.fullName}
                                    onError={handleAvatarError}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {consultant.fullName?.charAt(0)?.toUpperCase() || 'C'}
                                </div>
                            )}
                        </div>
                        <div className={styles.consultantDetails}>
                            <h3>{consultant.fullName}</h3>

                            {consultant.qualifications && (
                                <div className={styles.qualifications}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                    </svg>
                                    <span>{consultant.qualifications}</span>
                                </div>
                            )}

                            {consultant.experience && (
                                <div className={styles.experience}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                    <span>{consultant.experience} năm kinh nghiệm</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {step === 1 && (
                        <div className={styles.dateTimeSelection}>
                            {/* Date Selection */}
                            <div className={styles.formGroup}>
                                <label htmlFor="consultationDate">Chọn ngày tư vấn</label>
                                <input
                                    type="date"
                                    id="consultationDate"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    min={getMinDate()}
                                    max={getMaxDate()}
                                    className={styles.dateInput}
                                />
                            </div>

                            {/* Time Slot Selection */}
                            {selectedDate && (
                                <div className={styles.formGroup}>
                                    <label>Chọn khung giờ</label>
                                    {loadingSlots ? (
                                        <div className={styles.loadingSlots}>
                                            <LoadingSpinner size="small" />
                                            <span>Đang tải khung giờ trống...</span>
                                        </div>
                                    ) : (<div className={styles.timeSlots}>
                                        {timeSlots.map(slot => {
                                            const availableSlot = availableSlots.find(
                                                as => as.slot === slot.value
                                            );

                                            // Nếu không có dữ liệu từ server, mặc định là available
                                            // Chỉ khi server trả về slot với available: false thì mới disable
                                            const isAvailable = availableSlot ? availableSlot.available : true;
                                            const isSelected = selectedTimeSlot === slot.value;

                                            return (
                                                <button
                                                    key={slot.value}
                                                    type="button"
                                                    className={`${styles.timeSlotButton} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                                    onClick={() => isAvailable && handleTimeSlotChange(slot.value)}
                                                    disabled={!isAvailable}
                                                >
                                                    <span className={styles.timeLabel}>{slot.label}</span>
                                                    <span className={styles.status}>
                                                        {isAvailable ? 'Trống' : 'Đã đặt'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className={styles.confirmationDetails}>
                            <h3>Chi tiết lịch tư vấn</h3>

                            <div className={styles.detailItem}>
                                <span className={styles.label}>Ngày tư vấn:</span>
                                <span className={styles.value}>{formatDate(selectedDate)}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <span className={styles.label}>Thời gian:</span>
                                <span className={styles.value}>{getTimeSlotLabel(selectedTimeSlot)}</span>
                            </div>

                            <div className={styles.detailItem}>
                                <span className={styles.label}>Chuyên gia tư vấn:</span>
                                <span className={styles.value}>{consultant.fullName}</span>
                            </div>

                            <div className={styles.importantNote}>
                                <div className={styles.noteIcon}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                </div>
                                <div className={styles.noteContent}>
                                    <h4>Lưu ý quan trọng:</h4>
                                    <ul>
                                        <li>Lịch tư vấn sẽ được chuyên gia xác nhận trong vòng 24 giờ</li>
                                        <li>Link tham gia buổi tư vấn sẽ được gửi qua email sau khi được xác nhận</li>
                                        <li>Vui lòng chuẩn bị sẵn các câu hỏi và tài liệu cần thiết</li>
                                        <li>Bạn có thể hủy lịch tối thiểu 24 giờ trước buổi tư vấn</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    {step === 1 ? (
                        <div className={styles.step1Actions}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={onClose}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className={styles.nextButton}
                                onClick={handleNext}
                                disabled={!selectedDate || !selectedTimeSlot || loadingSlots}
                            >
                                Tiếp tục
                            </button>
                        </div>
                    ) : (
                        <div className={styles.step2Actions}>
                            <button
                                type="button"
                                className={styles.backButton}
                                onClick={() => setStep(1)}
                            >
                                Quay lại
                            </button>
                            <button
                                type="button"
                                className={styles.confirmButton}
                                onClick={handleConfirmBooking}
                                disabled={loading}
                            >
                                {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;