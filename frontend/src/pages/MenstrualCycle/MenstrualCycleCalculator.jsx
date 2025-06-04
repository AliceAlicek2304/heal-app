import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Navbar from '../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './MenstrualCycleCalculator.module.css';

const MenstrualCycleCalculator = () => {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const [formData, setFormData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        numberOfDays: 5,
        cycleLength: 28,
    });
    const [cycles, setCycles] = useState([]);
    const [selectedCycle, setSelectedCycle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calculationResult, setCalculationResult] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchCycles();
        }
    }, [isAuthenticated, user]);

    const fetchCycles = async () => {
        try {
            setLoading(true);
            const userId = user?.userId;

            if (!userId) {
                toast.error("Không thể xác định người dùng");
                setLoading(false);
                return;
            }

            const response = await authService.getMenstrualCycles(userId);
            if (response.success) {
                const sortedCycles = response.data.sort((a, b) => {
                    // Ưu tiên sắp xếp theo createdAt nếu có
                    if (a.createdAt && b.createdAt) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return b.id - a.id;
                });

                setCycles(sortedCycles);
                console.log('✅ Loaded cycles:', sortedCycles.length);
            } else {
                toast.error(response.message || "Không thể tải lịch sử chu kỳ kinh nguyệt");
            }
        } catch (err) {
            console.error("Error fetching cycles:", err);
            toast.error("Đã xảy ra lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

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

            setLoading(true);

            const cycleData = {
                startDate: formData.startDate instanceof Date
                    ? formData.startDate.toISOString().split('T')[0]
                    : formData.startDate,
                numberOfDays: parseInt(formData.numberOfDays),
                cycleLength: parseInt(formData.cycleLength)
            };

            console.log('🔍 Sending cycle data:', cycleData);

            const response = await authService.addMenstrualCycle(cycleData);

            if (response.success) {
                const result = response.data;

                console.log('✅ Calculation result:', result);

                setCalculationResult({
                    id: result.id,
                    startDate: new Date(result.startDate),
                    endDate: new Date(new Date(result.startDate).setDate(
                        new Date(result.startDate).getDate() + result.numberOfDays - 1
                    )),
                    ovulationDate: new Date(result.ovulationDate),
                    nextCycleDate: new Date(new Date(result.startDate).setDate(
                        new Date(result.startDate).getDate() + result.cycleLength
                    )),
                    fertileStart: new Date(new Date(result.ovulationDate).setDate(
                        new Date(result.ovulationDate).getDate() - 5
                    )),
                    fertileEnd: new Date(new Date(result.ovulationDate).setDate(
                        new Date(result.ovulationDate).getDate() + 1
                    )),
                    pregnancyProbability: calculateCurrentPregnancyProbability(result.ovulationDate),
                    cycleLength: result.cycleLength,
                    numberOfDays: result.numberOfDays,
                    reminderEnabled: result.reminderEnabled,
                    createdAt: result.createdAt
                });

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

    const calculateCurrentPregnancyProbability = (ovulationDate) => {
        const today = new Date();
        const ovulation = new Date(ovulationDate);
        const daysDiff = Math.round((today - ovulation) / (1000 * 60 * 60 * 24));

        switch (daysDiff) {
            case -5: return 6.4;   // 5 ngày trước rụng trứng
            case -4: return 7.8;   // 4 ngày trước rụng trứng
            case -3: return 10.7;  // 3 ngày trước rụng trứng
            case -2: return 19.3;  // 2 ngày trước rụng trứng
            case -1: return 23.5;  // 1 ngày trước rụng trứng
            case 0: return 15.7;  // Ngày rụng trứng
            case 1: return 5.7;   // 1 ngày sau rụng trứng
            default: return 1.0;   // Các ngày khác
        }
    };

    const handleViewCycleDetails = (cycle) => {
        const enhancedCycle = {
            ...cycle,
            // Tính khoảng thời gian dễ thụ thai
            fertileStart: new Date(new Date(cycle.ovulationDate).setDate(
                new Date(cycle.ovulationDate).getDate() - 5
            )),
            fertileEnd: new Date(new Date(cycle.ovulationDate).setDate(
                new Date(cycle.ovulationDate).getDate() + 1
            )),
            // Tính xác suất mang thai hiện tại
            currentPregnancyProbability: calculateCurrentPregnancyProbability(cycle.ovulationDate),
            // Tính chu kỳ tiếp theo
            nextCycleDate: new Date(new Date(cycle.startDate).setDate(
                new Date(cycle.startDate).getDate() + cycle.cycleLength
            ))
        };

        setSelectedCycle(enhancedCycle);
    };

    const handleToggleReminder = async (cycleId, isEnabled) => {
        try {
            setLoading(true);
            const response = await authService.toggleCycleReminder(cycleId, !isEnabled);

            if (response.success) {
                // Cập nhật state local
                setCycles(prevCycles =>
                    prevCycles.map(cycle =>
                        cycle.id === cycleId
                            ? { ...cycle, reminderEnabled: !isEnabled }
                            : cycle
                    )
                );

                // Cập nhật selectedCycle nếu đang xem
                if (selectedCycle && selectedCycle.id === cycleId) {
                    setSelectedCycle({
                        ...selectedCycle,
                        reminderEnabled: !isEnabled
                    });
                }

                toast.success(`Đã ${!isEnabled ? 'bật' : 'tắt'} nhắc nhở cho chu kỳ`);
            } else {
                toast.error(response.message || "Không thể cập nhật trạng thái nhắc nhở");
            }
        } catch (err) {
            console.error("Error toggling reminder:", err);
            toast.error("Đã xảy ra lỗi khi cập nhật trạng thái nhắc nhở");
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
                const response = await authService.deleteMenstrualCycle(cycleId);

                if (response.success) {
                    // Cập nhật danh sách chu kỳ
                    setCycles(prevCycles => prevCycles.filter(cycle => cycle.id !== cycleId));

                    // Đóng chi tiết nếu đang xem chu kỳ bị xóa
                    if (selectedCycle && selectedCycle.id === cycleId) {
                        setSelectedCycle(null);
                    }

                    toast.success("Đã xóa chu kỳ thành công");
                } else {
                    toast.error(response.message || "Không thể xóa chu kỳ");
                }
            } catch (err) {
                console.error("Error deleting cycle:", err);
                toast.error("Đã xảy ra lỗi khi xóa chu kỳ");
            } finally {
                setLoading(false);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return format(date, 'dd MMMM yyyy', { locale: vi });
    };

    const formatCreatedAt = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    };

    const isInFertilePeriod = (cycle) => {
        const today = new Date();
        const fertileStart = new Date(new Date(cycle.ovulationDate).setDate(
            new Date(cycle.ovulationDate).getDate() - 5
        ));
        const fertileEnd = new Date(new Date(cycle.ovulationDate).setDate(
            new Date(cycle.ovulationDate).getDate() + 1
        ));

        return today >= fertileStart && today <= fertileEnd;
    };

    return (
        <div className={styles.menstrualCyclePage}>
            <Navbar />
            <div className={styles.menstrualCycleContainer}>
                <h1 className={styles.pageTitle}>Tính chu kỳ kinh nguyệt</h1>

                <div className={styles.menstrualCycleContent}>
                    <div className={styles.calculatorSection}>
                        <div className={styles.calculatorFormContainer}>
                            <h2>Nhập thông tin chu kỳ</h2>
                            <form onSubmit={handleCalculate} className={styles.calculatorForm}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="startDate">Ngày bắt đầu chu kỳ gần nhất</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        value={formData.startDate instanceof Date
                                            ? formData.startDate.toISOString().split('T')[0]
                                            : formData.startDate}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                startDate: e.target.value
                                            });
                                        }}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={styles.dateInput}
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
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            numberOfDays: parseInt(e.target.value) || 0
                                        })}
                                        min="1"
                                        max="15"
                                        required
                                    />
                                    <small className={styles.formText}>
                                        Thông thường từ 3-7 ngày
                                    </small>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="cycleLength">Độ dài chu kỳ (ngày)</label>
                                    <input
                                        type="number"
                                        id="cycleLength"
                                        name="cycleLength"
                                        value={formData.cycleLength}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            cycleLength: parseInt(e.target.value) || 0
                                        })}
                                        min="21"
                                        max="45"
                                        required
                                    />
                                    <small className={styles.formText}>
                                        Thông thường từ 21-35 ngày (trung bình 28 ngày)
                                    </small>
                                </div>

                                <div className={styles.formActions}>
                                    <button
                                        type="submit"
                                        className={styles.btnPrimary}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                                </svg>
                                                Đang tính toán...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                Tính toán chu kỳ
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {calculationResult && (
                            <div className={styles.calculationResult}>
                                <h2>Kết quả tính toán</h2>
                                <div className={styles.resultCard}>
                                    <div className={styles.resultItem}>
                                        <span className={styles.resultLabel}>Ngày hành kinh:</span>
                                        <span className={styles.resultValue}>
                                            {formatDate(calculationResult.startDate)} - {formatDate(calculationResult.endDate)}
                                        </span>
                                    </div>

                                    <div className={styles.resultItem}>
                                        <span className={styles.resultLabel}>Ngày rụng trứng dự kiến:</span>
                                        <span className={`${styles.resultValue} ${styles.highlight}`}>
                                            {formatDate(calculationResult.ovulationDate)}
                                        </span>
                                    </div>

                                    <div className={styles.resultItem}>
                                        <span className={styles.resultLabel}>Khoảng thời gian dễ thụ thai:</span>
                                        <span className={`${styles.resultValue} ${styles.fertile}`}>
                                            {formatDate(calculationResult.fertileStart)} - {formatDate(calculationResult.fertileEnd)}
                                        </span>
                                    </div>

                                    <div className={styles.resultItem}>
                                        <span className={styles.resultLabel}>Chu kỳ tiếp theo dự kiến:</span>
                                        <span className={styles.resultValue}>
                                            {formatDate(calculationResult.nextCycleDate)}
                                        </span>
                                    </div>

                                    <div className={styles.resultItem}>
                                        <span className={styles.resultLabel}>Xác suất mang thai hiện tại:</span>
                                        <span className={`${styles.resultValue} ${styles.probability}`}>
                                            {calculationResult.pregnancyProbability}%
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.resultNote}>
                                    <div className={styles.noteHeader}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        <strong>Lưu ý quan trọng:</strong>
                                    </div>
                                    <ul>
                                        <li>Kết quả tính toán chỉ mang tính tham khảo, không thay thế ý kiến chuyên gia</li>
                                        <li>Chu kỳ có thể thay đổi do stress, thay đổi cân nặng, tập luyện hoặc vấn đề sức khỏe</li>
                                        <li>Xác suất mang thai cao nhất trong khoảng 5 ngày trước và 1 ngày sau rụng trứng</li>
                                        <li>Nếu chu kỳ bất thường hoặc có vấn đề sức khỏe, hãy tham khảo ý kiến bác sĩ</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.historySection}>
                        <div className={styles.historyHeader}>
                            <h2>Lịch sử chu kỳ</h2>
                            {cycles.length > 0 && (
                                <span className={styles.cycleCount}>
                                    {cycles.length} chu kỳ đã lưu
                                </span>
                            )}
                        </div>

                        {!isAuthenticated ? (
                            <div className={styles.authPrompt}>
                                <div className={styles.authIcon}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 12l2 2 4-4"></path>
                                        <path d="M21 12c.552 0 1-.448 1-1V8c0-.552-.448-1-1-1h-1c-.552 0-1-.448-1-1V4c0-.552-.448-1-1-1H8c-.552 0-1 .448-1 1v2c0 .552-.448 1-1 1H5c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1"></path>
                                    </svg>
                                </div>
                                <h3>Đăng nhập để lưu lịch sử</h3>
                                <p>Đăng nhập để lưu trữ và theo dõi lịch sử chu kỳ kinh nguyệt của bạn</p>
                            </div>
                        ) : loading ? (
                            <div className={styles.loading}>
                                <LoadingSpinner />
                                <p>Đang tải lịch sử chu kỳ...</p>
                            </div>
                        ) : cycles.length === 0 ? (
                            <div className={styles.emptyHistory}>
                                <div className={styles.emptyIcon}>
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M2 12h20"></path>
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                    </svg>
                                </div>
                                <h3>Chưa có chu kỳ nào được lưu</h3>
                                <p>Hãy tính toán chu kỳ đầu tiên để bắt đầu theo dõi!</p>
                            </div>
                        ) : (
                            <div className={styles.cycleHistoryList}>
                                {cycles.map(cycle => {
                                    const isCurrentFertile = isInFertilePeriod(cycle);

                                    return (
                                        <div
                                            key={cycle.id}
                                            className={`${styles.cycleItem} ${selectedCycle && selectedCycle.id === cycle.id ? styles.active : ''} ${isCurrentFertile ? styles.fertile : ''}`}
                                            onClick={() => handleViewCycleDetails(cycle)}
                                        >
                                            <div className={styles.cycleDate}>
                                                <div className={styles.mainDate}>
                                                    {formatDate(cycle.startDate)}
                                                </div>
                                                {cycle.createdAt && (
                                                    <div className={styles.createdDate}>
                                                        Lưu: {formatCreatedAt(cycle.createdAt)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.cycleInfo}>
                                                <span className={styles.duration}>
                                                    {cycle.numberOfDays} ngày kinh
                                                </span>
                                                <span className={styles.length}>
                                                    Chu kỳ {cycle.cycleLength} ngày
                                                </span>
                                                {isCurrentFertile && (
                                                    <span className={styles.fertileTag}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 2a10 10 0 1 0 10 10c0-5.93-4.64-10.75-10.5-10S1.07 6.57 1.07 12.5"></path>
                                                        </svg>
                                                        Dễ thụ thai
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles.cycleActions}>
                                                <div className={styles.reminderStatus}>
                                                    {cycle.reminderEnabled ? (
                                                        <span className={styles.reminderEnabled} title="Nhắc nhở đã bật">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                            </svg>
                                                        </span>
                                                    ) : (
                                                        <span className={styles.reminderDisabled} title="Nhắc nhở đã tắt">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                                <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
                                                                <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path>
                                                                <path d="M18 8a6 6 0 0 0-9.33-5"></path>
                                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>

                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.expandIcon}>
                                                    <polyline points="9,18 15,12 9,6"></polyline>
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {selectedCycle && (
                            <div className={styles.cycleDetails}>
                                <div className={styles.detailsHeader}>
                                    <h3>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M2 12h20"></path>
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                        </svg>
                                        Chi tiết chu kỳ
                                    </h3>
                                    <button
                                        className={styles.closeDetailsBtn}
                                        onClick={() => setSelectedCycle(null)}
                                        title="Đóng"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>

                                <div className={styles.detailsContent}>
                                    <div className={styles.detailsGrid}>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Ngày bắt đầu:</span>
                                            <span className={styles.detailValue}>{formatDate(selectedCycle.startDate)}</span>
                                        </div>

                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Số ngày hành kinh:</span>
                                            <span className={styles.detailValue}>{selectedCycle.numberOfDays} ngày</span>
                                        </div>

                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Độ dài chu kỳ:</span>
                                            <span className={styles.detailValue}>{selectedCycle.cycleLength} ngày</span>
                                        </div>

                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Ngày rụng trứng:</span>
                                            <span className={`${styles.detailValue} ${styles.highlight}`}>
                                                {formatDate(selectedCycle.ovulationDate)}
                                            </span>
                                        </div>

                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Thời gian dễ thụ thai:</span>
                                            <span className={`${styles.detailValue} ${styles.fertile}`}>
                                                {formatDate(selectedCycle.fertileStart)} - {formatDate(selectedCycle.fertileEnd)}
                                            </span>
                                        </div>

                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Chu kỳ tiếp theo:</span>
                                            <span className={styles.detailValue}>
                                                {formatDate(selectedCycle.nextCycleDate)}
                                            </span>
                                        </div>

                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Xác suất mang thai hiện tại:</span>
                                            <span className={`${styles.detailValue} ${styles.probability}`}>
                                                {selectedCycle.currentPregnancyProbability}%
                                            </span>
                                        </div>

                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Nhắc nhở:</span>
                                            <span className={styles.detailValue}>
                                                {selectedCycle.reminderEnabled ? (
                                                    <span className={styles.enabled}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                        </svg>
                                                        Đã bật
                                                    </span>
                                                ) : (
                                                    <span className={styles.disabled}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                            <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
                                                            <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path>
                                                            <path d="M18 8a6 6 0 0 0-9.33-5"></path>
                                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                                        </svg>
                                                        Đã tắt
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        {selectedCycle.createdAt && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Ngày tạo:</span>
                                                <span className={styles.detailValue}>
                                                    {formatCreatedAt(selectedCycle.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.detailsActions}>
                                    <button
                                        className={`${styles.btn} ${selectedCycle.reminderEnabled ? styles.btnWarning : styles.btnSuccess}`}
                                        onClick={() => handleToggleReminder(selectedCycle.id, selectedCycle.reminderEnabled)}
                                        disabled={loading}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            {selectedCycle.reminderEnabled ? (
                                                <>
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                    <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
                                                    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path>
                                                    <path d="M18 8a6 6 0 0 0-9.33-5"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                </>
                                            ) : (
                                                <>
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                </>
                                            )}
                                        </svg>
                                        {selectedCycle.reminderEnabled ? 'Tắt nhắc nhở' : 'Bật nhắc nhở'}
                                    </button>

                                    <button
                                        className={`${styles.btn} ${styles.btnDanger}`}
                                        onClick={() => handleDeleteCycle(selectedCycle.id)}
                                        disabled={loading}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3,6 5,6 21,6"></polyline>
                                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                        Xóa chu kỳ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenstrualCycleCalculator;