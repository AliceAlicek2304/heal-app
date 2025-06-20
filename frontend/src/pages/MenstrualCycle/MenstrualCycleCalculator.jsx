import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { menstrualCycleService } from '../../services/menstrualCycleService';
import { format, addDays, isValid, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import { useAuthModal } from '../../hooks/useAuthModal';
import LoginForm from '../../components/auth/Login/LoginForm';
import RegisterForm from '../../components/auth/Register/RegisterForm';
import styles from './MenstrualCycleCalculator.module.css';

const MenstrualCycleCalculator = () => {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();

    // Auth modals
    const {
        showLoginModal,
        showRegisterModal,
        openLoginModal,
        closeModals,
        switchToLogin,
        switchToRegister
    } = useAuthModal();

    const [formData, setFormData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        numberOfDays: 5,
        cycleLength: 28,
    }); const [cycles, setCycles] = useState([]);
    const [selectedCycle, setSelectedCycle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calculationResult, setCalculationResult] = useState(null);

    const fetchCycles = useCallback(async () => {
        try {
            setLoading(true);
            const userId = user?.userId || user?.id;

            if (!userId) {
                // Fallback: sử dụng endpoint dựa trên authentication context
                // Backend sẽ tự động lấy user từ JWT token
                const response = await menstrualCycleService.getCurrentUserCycles();

                if (response.success && response.data) {
                    const sortedCycles = response.data.sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                        return dateB - dateA;
                    }); setCycles(sortedCycles);
                } else {
                    toast.error(response.message || "Không thể tải lịch sử chu kỳ kinh nguyệt");
                }
                return;
            }

            const response = await menstrualCycleService.getCyclesByUserId(userId);
            if (response.success && response.data) {
                // Sắp xếp theo ngày tạo mới nhất
                const sortedCycles = response.data.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateB - dateA;
                }); setCycles(sortedCycles);
            } else {
                toast.error(response.message || "Không thể tải lịch sử chu kỳ kinh nguyệt");
            }
        } catch (err) {
            console.error("Error fetching cycles:", err);
            toast.error("Đã xảy ra lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [user, toast]); useEffect(() => {
        if (isAuthenticated && user) {
            fetchCycles();
        }
    }, [isAuthenticated, user, fetchCycles]); // ← Add fetchCycles to dependencies

    const handleCalculate = async (e) => {
        e.preventDefault();

        try {
            // Validate input
            if (parseInt(formData.numberOfDays) <= 0) {
                toast.error("Số ngày hành kinh phải lớn hơn 0");
                return;
            }

            if (parseInt(formData.cycleLength) < 21 || parseInt(formData.cycleLength) > 45) {
                toast.error("Độ dài chu kỳ phải từ 21-45 ngày");
                return;
            }

            const startDate = new Date(formData.startDate);
            if (startDate > new Date()) {
                toast.error("Ngày bắt đầu không thể trong tương lai");
                return;
            }

            setLoading(true); const cycleData = {
                startDate: formData.startDate,
                numberOfDays: parseInt(formData.numberOfDays),
                cycleLength: parseInt(formData.cycleLength)
            };

            const response = await menstrualCycleService.addCycle(cycleData);

            if (response.success && response.data) {
                const result = response.data;

                // Tính toán các ngày quan trọng
                const calculatedDates = menstrualCycleService.calculateCycleDates(result);

                setCalculationResult({
                    ...result,
                    ...calculatedDates
                });

                // Refresh danh sách chu kỳ
                if (isAuthenticated) {
                    await fetchCycles();
                }

                toast.success("Đã tính toán chu kỳ kinh nguyệt thành công!");
            } else {
                toast.error(response.message || "Không thể tính toán chu kỳ kinh nguyệt");
            }
        } catch (err) {
            console.error("Error calculating cycle:", err);
            toast.error("Đã xảy ra lỗi khi tính toán chu kỳ");
        } finally {
            setLoading(false);
        }
    };

    const handleViewCycleDetails = (cycle) => {
        const enhancedCycle = menstrualCycleService.calculateCycleDates(cycle);
        setSelectedCycle({
            ...cycle,
            ...enhancedCycle
        });
    };

    const handleToggleReminder = async (cycleId, isEnabled) => {
        try {
            setLoading(true);
            const response = await menstrualCycleService.toggleReminder(cycleId, !isEnabled);

            if (response.success) {
                toast.success(response.message || "Đã cập nhật cài đặt nhắc nhở");
                await fetchCycles();
            } else {
                toast.error(response.message || "Không thể cập nhật cài đặt nhắc nhở");
            }
        } catch (err) {
            console.error("Error toggling reminder:", err);
            toast.error("Đã xảy ra lỗi khi cập nhật nhắc nhở");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCycle = async (cycleId) => {
        const cycle = cycles.find(c => c.id === cycleId);
        const cycleDate = cycle ? formatDate(cycle.startDate) : 'chu kỳ này';

        if (window.confirm(`Bạn có chắc chắn muốn xóa chu kỳ bắt đầu ngày ${cycleDate} không?\n\nHành động này không thể hoàn tác!`)) {
            try {
                setLoading(true);
                const response = await menstrualCycleService.deleteCycle(cycleId);

                if (response.success) {
                    toast.success("Đã xóa chu kỳ kinh nguyệt thành công!");
                    await fetchCycles();

                    // Đóng modal nếu đang xem chu kỳ bị xóa
                    if (selectedCycle && selectedCycle.id === cycleId) {
                        setSelectedCycle(null);
                    }
                } else {
                    toast.error(response.message || "Không thể xóa chu kỳ kinh nguyệt");
                }
            } catch (err) {
                console.error("Error deleting cycle:", err);
                toast.error("Đã xảy ra lỗi khi xóa chu kỳ");
            } finally {
                setLoading(false);
            }
        }
    };

    const formatCreatedAt = (dateTimeString) => {
        try {
            if (!dateTimeString) return 'N/A';

            let date;
            if (Array.isArray(dateTimeString)) {
                // Backend trả về LocalDateTime dạng [year, month, day, hour, minute, second]
                const [year, month, day, hour = 0, minute = 0, second = 0] = dateTimeString;
                date = new Date(year, month - 1, day, hour, minute, second);
            } else {
                date = new Date(dateTimeString);
            }

            if (!isValid(date)) {
                console.warn('Invalid datetime:', dateTimeString);
                return 'N/A';
            }

            return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
        } catch (error) {
            console.error('Error formatting datetime:', error, dateTimeString);
            return 'N/A';
        }
    };

    const getDaysUntilNextCycle = (cycle) => {
        try {
            const today = new Date();
            let startDate;

            if (Array.isArray(cycle.startDate)) {
                const [year, month, day] = cycle.startDate;
                startDate = new Date(year, month - 1, day);
            } else {
                startDate = new Date(cycle.startDate);
            }

            const nextCycleDate = addDays(startDate, cycle.cycleLength);
            const daysUntil = Math.ceil((nextCycleDate - today) / (1000 * 60 * 60 * 24));

            return Math.max(0, daysUntil);
        } catch (error) {
            console.error('Error calculating days until next cycle:', error);
            return 0;
        }
    };

    const getPregnancyProbabilityColor = (probability) => {
        if (probability >= 20) return '#e74c3c'; // Đỏ - rất cao
        if (probability >= 10) return '#f39c12'; // Cam - cao
        if (probability >= 5) return '#f1c40f';  // Vàng - trung bình
        return '#27ae60'; // Xanh - thấp
    };

    const getStatusText = (cycle) => {
        const daysUntil = getDaysUntilNextCycle(cycle);
        const isInFertile = menstrualCycleService.isInFertilePeriod(cycle.ovulationDate);

        if (daysUntil <= 0) {
            return { text: 'Chu kỳ mới đã bắt đầu', color: '#e74c3c' };
        } else if (isInFertile) {
            return { text: 'Thời kỳ dễ thụ thai', color: '#f39c12' };
        } else if (daysUntil <= 3) {
            return { text: 'Sắp đến chu kỳ mới', color: '#f1c40f' };
        } else {
            return { text: 'Bình thường', color: '#27ae60' };
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }; if (!isAuthenticated) {
        return (
            <div className={styles.authRequired}>
                <Navbar />
                <div className={styles.authMessage}>
                    <h2>Đăng nhập để sử dụng tính năng này</h2>
                    <p>Vui lòng đăng nhập để theo dõi chu kỳ kinh nguyệt của bạn.</p>
                    <button
                        className={styles.loginBtn}
                        onClick={openLoginModal}
                    >
                        Đăng nhập
                    </button>
                </div>

                {/* Login Modal */}
                {showLoginModal && (
                    <div className={styles.modalOverlay} onClick={closeModals}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <LoginForm
                                onClose={closeModals}
                                onSwitchToRegister={switchToRegister} onLoginSuccess={() => {
                                    closeModals();
                                    // Không cần toast ở đây vì LoginForm đã có toast
                                }}
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
    }

    return (
        <div className={styles.menstrualCalculator}>
            <Navbar />

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Tính toán chu kỳ kinh nguyệt
                    </h1>
                    <p className={styles.subtitle}>
                        Theo dõi chu kỳ kinh nguyệt và dự đoán ngày rụng trứng với độ chính xác cao
                    </p>
                </div>

                <div className={styles.content}>
                    {/* Form nhập liệu */}
                    <div className={styles.calculatorCard}>
                        <h2 className={styles.cardTitle}>Nhập thông tin chu kỳ</h2>

                        <form onSubmit={handleCalculate} className={styles.calculatorForm}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="startDate">Ngày bắt đầu chu kỳ gần nhất</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="numberOfDays">Số ngày hành kinh</label>
                                    <input
                                        type="number"
                                        id="numberOfDays"
                                        name="numberOfDays"
                                        value={formData.numberOfDays}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="10"
                                        required
                                    />
                                    <small>Thông thường từ 3-7 ngày</small>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="cycleLength">Độ dài chu kỳ (ngày)</label>
                                    <input
                                        type="number"
                                        id="cycleLength"
                                        name="cycleLength"
                                        value={formData.cycleLength}
                                        onChange={handleInputChange}
                                        min="21"
                                        max="45"
                                        required
                                    />
                                    <small>Thông thường từ 21-35 ngày</small>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.calculateBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        Đang tính toán...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        Tính toán chu kỳ
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Kết quả tính toán */}
                    {calculationResult && (
                        <div className={styles.resultCard}>
                            <h2 className={styles.cardTitle}>Kết quả tính toán</h2>

                            <div className={styles.resultGrid}>
                                <div className={styles.resultItem}>
                                    <div className={styles.resultIcon} style={{ color: '#e74c3c' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12,6 12,12 16,14"></polyline>
                                        </svg>
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <span className={styles.resultLabel}>Chu kỳ tiếp theo</span>
                                        <span className={styles.resultValue}>
                                            {formatDate(calculationResult.nextCycleDate)}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.resultItem}>
                                    <div className={styles.resultIcon} style={{ color: '#f39c12' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <span className={styles.resultLabel}>Ngày rụng trứng</span>
                                        <span className={styles.resultValue}>
                                            {formatDate(calculationResult.ovulationDate)}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.resultItem}>
                                    <div className={styles.resultIcon} style={{ color: '#27ae60' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                        </svg>
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <span className={styles.resultLabel}>Thời kỳ dễ thụ thai</span>
                                        <span className={styles.resultValue}>
                                            {formatDate(calculationResult.fertileStart)} - {formatDate(calculationResult.fertileEnd)}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.resultItem}>
                                    <div
                                        className={styles.resultIcon}
                                        style={{ color: getPregnancyProbabilityColor(calculationResult.currentPregnancyProbability) }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <span className={styles.resultLabel}>Xác suất mang thai hôm nay</span>
                                        <span
                                            className={styles.resultValue}
                                            style={{ color: getPregnancyProbabilityColor(calculationResult.currentPregnancyProbability) }}
                                        >
                                            {calculationResult.currentPregnancyProbability.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {calculationResult.isInFertilePeriod && (
                                <div className={styles.fertileAlert}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    <span>Bạn đang trong thời kỳ dễ thụ thai!</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lịch sử chu kỳ */}
                    {cycles.length > 0 && (
                        <div className={styles.historyCard}>
                            <h2 className={styles.cardTitle}>
                                Lịch sử chu kỳ kinh nguyệt
                                <span className={styles.cycleCount}>({cycles.length} chu kỳ)</span>
                            </h2>

                            <div className={styles.cyclesList}>
                                {cycles.map((cycle, index) => {
                                    const status = getStatusText(cycle);
                                    const daysUntil = getDaysUntilNextCycle(cycle);
                                    const probability = menstrualCycleService.calculateCurrentPregnancyProbability(cycle.ovulationDate);

                                    return (
                                        <div key={cycle.id} className={styles.cycleItem}>
                                            <div className={styles.cycleHeader}>
                                                <div className={styles.cycleInfo}>
                                                    <span className={styles.cycleName}>
                                                        Chu kỳ #{cycles.length - index}
                                                    </span>
                                                    <span className={styles.cycleDate}>
                                                        {formatDate(cycle.startDate)}
                                                    </span>
                                                </div>

                                                <div className={styles.cycleStatus}>
                                                    <span
                                                        className={styles.statusBadge}
                                                        style={{ backgroundColor: status.color + '20', color: status.color }}
                                                    >
                                                        {status.text}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.cycleDetails}>
                                                <div className={styles.cycleMetrics}>
                                                    <div className={styles.metric}>
                                                        <span className={styles.metricLabel}>Độ dài chu kỳ</span>
                                                        <span className={styles.metricValue}>{cycle.cycleLength} ngày</span>
                                                    </div>
                                                    <div className={styles.metric}>
                                                        <span className={styles.metricLabel}>Số ngày hành kinh</span>
                                                        <span className={styles.metricValue}>{cycle.numberOfDays} ngày</span>
                                                    </div>
                                                    <div className={styles.metric}>
                                                        <span className={styles.metricLabel}>Ngày rụng trứng</span>
                                                        <span className={styles.metricValue}>{formatDate(cycle.ovulationDate)}</span>
                                                    </div>
                                                    <div className={styles.metric}>
                                                        <span className={styles.metricLabel}>Xác suất mang thai</span>
                                                        <span
                                                            className={styles.metricValue}
                                                            style={{ color: getPregnancyProbabilityColor(probability) }}
                                                        >
                                                            {probability.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={styles.cycleActions}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => handleViewCycleDetails(cycle)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                        </svg>
                                                        Chi tiết
                                                    </button>

                                                    <button
                                                        className={`${styles.actionBtn} ${cycle.reminderEnabled ? styles.reminderActive : ''}`}
                                                        onClick={() => handleToggleReminder(cycle.id, cycle.reminderEnabled)}
                                                        disabled={loading}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                        </svg>
                                                        {cycle.reminderEnabled ? 'Tắt nhắc nhở' : 'Bật nhắc nhở'}
                                                    </button>

                                                    <button
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        onClick={() => handleDeleteCycle(cycle.id)}
                                                        disabled={loading}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3,6 5,6 21,6"></polyline>
                                                            <path d="M19,6V20a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2V6"></path>
                                                        </svg>
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>

                                            {daysUntil <= 3 && daysUntil > 0 && (
                                                <div className={styles.upcomingAlert}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12,6 12,12 16,14"></polyline>
                                                    </svg>
                                                    <span>Chu kỳ mới trong {daysUntil} ngày</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && cycles.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                            <h3>Chưa có dữ liệu chu kỳ</h3>
                            <p>Hãy nhập thông tin chu kỳ kinh nguyệt đầu tiên để bắt đầu theo dõi!</p>
                        </div>
                    )}
                </div>

                {/* Modal chi tiết chu kỳ */}
                {selectedCycle && (
                    <div className={styles.modal} onClick={() => setSelectedCycle(null)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3>Chi tiết chu kỳ kinh nguyệt</h3>
                                <button
                                    className={styles.closeBtn}
                                    onClick={() => setSelectedCycle(null)}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Ngày bắt đầu</span>
                                        <span className={styles.detailValue}>{formatDate(selectedCycle.startDate)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Ngày kết thúc</span>
                                        <span className={styles.detailValue}>{formatDate(selectedCycle.endDate)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Ngày rụng trứng</span>
                                        <span className={styles.detailValue}>{formatDate(selectedCycle.ovulationDate)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Chu kỳ tiếp theo</span>
                                        <span className={styles.detailValue}>{formatDate(selectedCycle.nextCycleDate)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Thời kỳ dễ thụ thai</span>
                                        <span className={styles.detailValue}>
                                            {formatDate(selectedCycle.fertileStart)} - {formatDate(selectedCycle.fertileEnd)}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Xác suất mang thai hiện tại</span>
                                        <span
                                            className={styles.detailValue}
                                            style={{ color: getPregnancyProbabilityColor(selectedCycle.currentPregnancyProbability) }}
                                        >
                                            {selectedCycle.currentPregnancyProbability.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Độ dài chu kỳ</span>
                                        <span className={styles.detailValue}>{selectedCycle.cycleLength} ngày</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Số ngày hành kinh</span>
                                        <span className={styles.detailValue}>{selectedCycle.numberOfDays} ngày</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Nhắc nhở</span>
                                        <span className={styles.detailValue}>
                                            {selectedCycle.reminderEnabled ? '✅ Đã bật' : '❌ Đã tắt'}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Ngày tạo</span>
                                        <span className={styles.detailValue}>{formatCreatedAt(selectedCycle.createdAt)}</span>
                                    </div>
                                </div>

                                {selectedCycle.isInFertilePeriod && (
                                    <div className={styles.fertileAlert}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                            <line x1="12" y1="9" x2="12" y2="13"></line>
                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        <span>Hiện tại đang trong thời kỳ dễ thụ thai!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading overlay */}
                {loading && (
                    <div className={styles.loadingOverlay}>
                        <LoadingSpinner />
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default MenstrualCycleCalculator;