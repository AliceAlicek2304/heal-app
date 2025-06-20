import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { menstrualCycleService } from '../../services/menstrualCycleService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import styles from './MenstrualHistoryComponent.module.css';

const MenstrualHistoryComponent = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState(null);    // Gọi fetchCycles khi component mount hoặc khi user thay đổi
    useEffect(() => {
        if (user && (user.userId || user.id)) {
            fetchCycles();
        } else {
            console.log(' MenstrualHistory - No user or user ID available');
        }
    }, [user]);

    const fetchCycles = async () => {
        try {
            setLoading(true);

            // Kiểm tra nếu user không tồn tại
            if (!user) {
                setLoading(false);
                return;
            }

            // Sử dụng userId hoặc id
            const userId = user.userId || user.id;
            if (!userId) {
                toast.error("Không thể xác định thông tin người dùng");
                setLoading(false);
                return;
            }
            // Sử dụng userId thay vì id
            const response = await menstrualCycleService.getCyclesByUserId(userId);

            if (response.success) {
                // Sắp xếp chu kỳ theo thời gian bắt đầu giảm dần (mới nhất lên đầu)
                const sortedCycles = (response.data || []).sort((a, b) => {
                    return new Date(b.startDate) - new Date(a.startDate);
                });

                setCycles(sortedCycles);

                // Chỉ log, không hiển thị lỗi cho trường hợp dữ liệu rỗng
                if (sortedCycles.length === 0) {
                    console.log('No menstrual cycles found for this user');
                }
            } else {
                // Chỉ hiển thị lỗi nếu thực sự có lỗi server, không phải do không có data
                setCycles([]);
                console.error('Error from server:', response.message);
                // Chỉ hiển thị toast error nếu không phải lỗi "không có dữ liệu"
                if (response.message && !response.message.includes('không có chu kỳ')) {
                    toast.error(response.message || "Không thể tải lịch sử chu kỳ kinh nguyệt");
                }
            }
        } catch (err) {
            console.error("Error fetching cycles:", err);
            toast.error("Đã xảy ra lỗi khi tải dữ liệu: " + (err.message || "Lỗi không xác định"));
        } finally {
            setLoading(false);
        }
    };

    const handleViewCycleDetails = (cycle) => {
        setSelectedCycle(cycle);
    };

    const handleCloseDetails = () => {
        setSelectedCycle(null);
    };

    const handleToggleReminder = async (id, isEnabled) => {
        try {
            setLoading(true);

            const response = await menstrualCycleService.toggleReminder(id, !isEnabled);

            if (response.success) {
                // Cập nhật danh sách chu kỳ
                setCycles(prevCycles =>
                    prevCycles.map(cycle =>
                        cycle.id === id
                            ? { ...cycle, reminderEnabled: !isEnabled }
                            : cycle
                    )
                );

                // Cập nhật chu kỳ đang chọn nếu có
                if (selectedCycle && selectedCycle.id === id) {
                    setSelectedCycle({ ...selectedCycle, reminderEnabled: !isEnabled });
                }

                toast.success(`Đã ${!isEnabled ? 'bật' : 'tắt'} nhắc nhở chu kỳ`);
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

    const handleDeleteCycle = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa chu kỳ này?")) {
            return;
        }

        try {
            setLoading(true);

            const response = await menstrualCycleService.deleteCycle(id);

            if (response.success) {
                // Cập nhật danh sách chu kỳ
                setCycles(prevCycles => prevCycles.filter(cycle => cycle.id !== id));

                // Đóng chi tiết nếu đang mở
                if (selectedCycle && selectedCycle.id === id) {
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
    };

    // Hàm tính màu sắc dựa trên tỷ lệ mang thai
    const getPregnancyProbabilityColor = (probability) => {
        if (probability >= 20) return '#e74c3c'; // Đỏ - rất cao
        if (probability >= 10) return '#f39c12'; // Cam - cao
        if (probability >= 5) return '#f1c40f';  // Vàng - trung bình
        return '#27ae60'; // Xanh - thấp
    };

    // Hàm tải lại dữ liệu
    const handleRefresh = (e) => {
        e.preventDefault();
        toast.info('Đang tải lại dữ liệu...');
        fetchCycles();
    };

    if (loading && cycles.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải lịch sử chu kỳ kinh nguyệt...</p>
            </div>
        );
    }

    return (
        <div className={styles.menstrualHistory}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M2 12h20"></path>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        Lịch sử chu kỳ kinh nguyệt
                    </h2>
                    <p className={styles.subtitle}>
                        Theo dõi và quản lý các chu kỳ kinh nguyệt của bạn
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.refreshBtn}
                        onClick={handleRefresh}
                        disabled={loading}
                        title="Làm mới dữ liệu"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23,4 23,10 17,10"></polyline>
                            <polyline points="1,20 1,14 7,14"></polyline>
                            <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,4.36L23,14"></path>
                        </svg>
                    </button>
                    <a
                        href="/menstrual-cycle"
                        className={styles.newCycleBtn}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Tính chu kỳ mới
                    </a>
                </div>
            </div>

            {cycles.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M2 12h20"></path>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                    </div>
                    <h3>Chưa có chu kỳ nào được lưu</h3>
                    <p>Bạn chưa có chu kỳ kinh nguyệt nào được lưu trữ. Hãy bắt đầu tính chu kỳ để theo dõi sức khỏe của mình!</p>
                    <a href="/menstrual-cycle" className={styles.createBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Tính chu kỳ ngay
                    </a>
                </div>
            ) : (
                <div className={styles.content}>
                    {/* Mobile Card View */}
                    <div className={styles.mobileView}>
                        {cycles.map(cycle => (
                            <div
                                key={cycle.id}
                                className={`${styles.cycleCard} ${selectedCycle && selectedCycle.id === cycle.id ? styles.active : ''}`}
                                onClick={() => handleViewCycleDetails(cycle)}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.cycleDate}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        {formatDate(cycle.startDate)}
                                    </div>
                                    <div className={styles.reminderStatus}>
                                        {cycle.reminderEnabled ? (
                                            <span className={styles.reminderEnabled} title="Đã bật nhắc nhở">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                </svg>
                                            </span>
                                        ) : (
                                            <span className={styles.reminderDisabled} title="Đã tắt nhắc nhở">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M6.87 6.87a8 8 0 0 0-1.4 4.8c0 7-3 9-3 9h13"></path>
                                                    <path d="M19.93 14c.9-.5 1.5-1.2 1.5-2"></path>
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                </div>                                <div className={styles.cycleInfo}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Số ngày hành kinh:</span>
                                        <span className={styles.infoValue}>{cycle.numberOfDays} ngày</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Chu kỳ:</span>
                                        <span className={styles.infoValue}>{cycle.cycleLength} ngày</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Xác suất mang thai hôm nay:</span>
                                        <span
                                            className={styles.infoValue}
                                            style={{
                                                color: getPregnancyProbabilityColor(
                                                    menstrualCycleService.calculateCurrentPregnancyProbability(cycle.ovulationDate)
                                                ),
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {menstrualCycleService.calculateCurrentPregnancyProbability(cycle.ovulationDate).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Grid View */}
                    <div className={styles.desktopView}>
                        <div className={styles.cycleGrid}>
                            <div className={styles.cycleList}>
                                <h4 className={styles.sectionTitle}>Các chu kỳ đã lưu ({cycles.length})</h4>
                                <div className={styles.cycleItems}>
                                    {cycles.map(cycle => (
                                        <div
                                            key={cycle.id}
                                            className={`${styles.cycleItem} ${selectedCycle && selectedCycle.id === cycle.id ? styles.active : ''}`}
                                            onClick={() => handleViewCycleDetails(cycle)}
                                        >
                                            <div className={styles.itemHeader}>
                                                <div className={styles.itemDate}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                    {formatDate(cycle.startDate)}
                                                </div>
                                                <div className={styles.itemReminder}>
                                                    {cycle.reminderEnabled ? (
                                                        <span className={styles.reminderEnabled} title="Đã bật nhắc nhở">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                            </svg>
                                                        </span>
                                                    ) : (
                                                        <span className={styles.reminderDisabled} title="Đã tắt nhắc nhở">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M6.87 6.87a8 8 0 0 0-1.4 4.8c0 7-3 9-3 9h13"></path>
                                                                <path d="M19.93 14c.9-.5 1.5-1.2 1.5-2"></path>
                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>                                            <div className={styles.itemInfo}>
                                                <span>{cycle.numberOfDays} ngày hành kinh</span>
                                                <span>Chu kỳ {cycle.cycleLength} ngày</span>
                                                <span
                                                    style={{
                                                        color: getPregnancyProbabilityColor(
                                                            menstrualCycleService.calculateCurrentPregnancyProbability(cycle.ovulationDate)
                                                        ),
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Xác suất: {menstrualCycleService.calculateCurrentPregnancyProbability(cycle.ovulationDate).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.cycleDetails}>
                                {selectedCycle ? (
                                    <div className={styles.detailsContent}>
                                        <div className={styles.detailsHeader}>
                                            <h4>Chi tiết chu kỳ</h4>
                                            <button
                                                className={styles.closeBtn}
                                                onClick={handleCloseDetails}
                                                title="Đóng chi tiết"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>

                                        <div className={styles.detailsBody}>
                                            <div className={styles.detailSection}>
                                                <h5>Thông tin cơ bản</h5>
                                                <div className={styles.detailGrid}>
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
                                                        <span className={styles.detailLabel}>Nhắc nhở:</span>
                                                        <span className={`${styles.detailValue} ${selectedCycle.reminderEnabled ? styles.enabled : styles.disabled}`}>
                                                            {selectedCycle.reminderEnabled ? 'Đã bật' : 'Đã tắt'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.detailSection}>
                                                <h5>Dự đoán chu kỳ</h5>
                                                <div className={styles.detailGrid}>
                                                    <div className={styles.detailItem}>
                                                        <span className={styles.detailLabel}>Ngày rụng trứng:</span>
                                                        <span className={`${styles.detailValue} ${styles.highlight}`}>
                                                            {formatDate(selectedCycle.ovulationDate)}
                                                        </span>
                                                    </div>
                                                    {selectedCycle.fertileStart && selectedCycle.fertileEnd && (
                                                        <div className={styles.detailItem}>
                                                            <span className={styles.detailLabel}>Thời gian dễ thụ thai:</span>
                                                            <span className={styles.detailValue}>
                                                                {formatDate(selectedCycle.fertileStart)} - {formatDate(selectedCycle.fertileEnd)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedCycle.nextCycleDate && (
                                                        <div className={styles.detailItem}>
                                                            <span className={styles.detailLabel}>Chu kỳ tiếp theo:</span>
                                                            <span className={styles.detailValue}>
                                                                {formatDate(selectedCycle.nextCycleDate)}
                                                            </span>
                                                        </div>)}
                                                    <div className={styles.detailItem}>
                                                        <span className={styles.detailLabel}>Xác suất mang thai hôm nay:</span>
                                                        <span
                                                            className={styles.detailValue}
                                                            style={{
                                                                color: getPregnancyProbabilityColor(
                                                                    menstrualCycleService.calculateCurrentPregnancyProbability(selectedCycle.ovulationDate)
                                                                ),
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {menstrualCycleService.calculateCurrentPregnancyProbability(selectedCycle.ovulationDate).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    {selectedCycle.pregnancyProbability !== undefined && (
                                                        <div className={styles.detailItem}>
                                                            <span className={styles.detailLabel}>Xác suất mang thai:</span>
                                                            <span className={styles.detailValue}>
                                                                {selectedCycle.pregnancyProbability}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.detailsFooter}>
                                            <button
                                                className={`${styles.actionBtn} ${selectedCycle.reminderEnabled ? styles.warningBtn : styles.successBtn}`}
                                                onClick={() => handleToggleReminder(selectedCycle.id, selectedCycle.reminderEnabled)}
                                                disabled={loading}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    {selectedCycle.reminderEnabled ? (
                                                        <>
                                                            <path d="M6.87 6.87a8 8 0 0 0-1.4 4.8c0 7-3 9-3 9h13"></path>
                                                            <path d="M19.93 14c.9-.5 1.5-1.2 1.5-2"></path>
                                                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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
                                                className={`${styles.actionBtn} ${styles.dangerBtn}`}
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
                                ) : (
                                    <div className={styles.noSelection}>
                                        <div className={styles.noSelectionIcon}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <path d="M2 12h20"></path>
                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                            </svg>
                                        </div>
                                        <h4>Chọn một chu kỳ để xem chi tiết</h4>
                                        <p>Nhấp vào một chu kỳ bên trái để xem thông tin chi tiết và các tùy chọn quản lý.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenstrualHistoryComponent;