import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import './MenstrualHistoryComponent.css';

const MenstrualHistoryComponent = () => {
    const { user } = useAuth();
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedCycle, setSelectedCycle] = useState(null);

    // Tự động xóa thông báo sau 5 giây
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [success, error]);

    // Gọi fetchCycles khi component mount hoặc khi user thay đổi
    useEffect(() => {
        if (user && user.userId) {
            fetchCycles();
        }
    }, [user]);

    const fetchCycles = async () => {
        try {
            setLoading(true);
            setError('');

            // Kiểm tra nếu user không tồn tại
            if (!user || !user.userId) {
                console.log("Đang chờ thông tin người dùng...");
                // Không hiển thị lỗi ngay, chờ cho user load
                setLoading(false);
                return;
            }

            // Sử dụng userId thay vì id
            const response = await authService.getMenstrualCycles(user.userId);

            if (response.success) {
                // Sắp xếp chu kỳ theo thời gian bắt đầu giảm dần (mới nhất lên đầu)
                const sortedCycles = response.data.sort((a, b) => {
                    return new Date(b.startDate) - new Date(a.startDate);
                });

                setCycles(sortedCycles);
                console.log("Đã tải thành công lịch sử chu kỳ:", sortedCycles.length, "chu kỳ");
            } else {
                setError(response.message || "Không thể tải lịch sử chu kỳ kinh nguyệt");
            }
        } catch (err) {
            console.error("Error fetching cycles:", err);
            setError("Đã xảy ra lỗi khi tải dữ liệu: " + (err.message || "Lỗi không xác định"));
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

            const response = await authService.toggleCycleReminder(id, !isEnabled);

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

                setSuccess(`Đã ${!isEnabled ? 'bật' : 'tắt'} nhắc nhở chu kỳ`);
            } else {
                setError(response.message || "Không thể cập nhật trạng thái nhắc nhở");
            }
        } catch (err) {
            console.error("Error toggling reminder:", err);
            setError("Đã xảy ra lỗi khi cập nhật trạng thái nhắc nhở");
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

            const response = await authService.deleteMenstrualCycle(id);

            if (response.success) {
                // Cập nhật danh sách chu kỳ
                setCycles(prevCycles => prevCycles.filter(cycle => cycle.id !== id));

                // Đóng chi tiết nếu đang mở
                if (selectedCycle && selectedCycle.id === id) {
                    setSelectedCycle(null);
                }

                setSuccess("Đã xóa chu kỳ thành công");
            } else {
                setError(response.message || "Không thể xóa chu kỳ");
            }
        } catch (err) {
            console.error("Error deleting cycle:", err);
            setError("Đã xảy ra lỗi khi xóa chu kỳ");
        } finally {
            setLoading(false);
        }
    };

    // Hàm format ngày tháng
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Hàm tải lại dữ liệu
    const handleRefresh = (e) => {
        e.preventDefault();
        fetchCycles();
    };

    return (
        <div className="menstrual-history-profile">
            <div className="history-header">
                <h3>Lịch sử chu kỳ kinh nguyệt</h3>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary refresh-btn"
                        onClick={handleRefresh}
                        type="button"
                        disabled={loading}
                    >
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.href = '/menstrual-cycle'}
                    >
                        Tính chu kỳ mới
                    </button>
                </div>
            </div>

            {(success || error) && (
                <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
                    {error || success}
                </div>
            )}

            <div className="history-content">
                {loading && <div className="loading">Đang tải...</div>}

                {!loading && cycles.length === 0 && (
                    <div className="empty-history">
                        <p>Bạn chưa có chu kỳ nào được lưu.</p>
                        <a href="/menstrual-cycle" className="btn btn-primary">Tính chu kỳ ngay</a>
                    </div>
                )}

                {!loading && cycles.length > 0 && (
                    <div className="history-grid">
                        <div className="cycle-list">
                            <h4>Các chu kỳ đã lưu</h4>
                            {cycles.map(cycle => (
                                <div
                                    key={cycle.id}
                                    className={`cycle-item ${selectedCycle && selectedCycle.id === cycle.id ? 'active' : ''}`}
                                    onClick={() => handleViewCycleDetails(cycle)}
                                >
                                    <div className="cycle-date">
                                        {formatDate(cycle.startDate)}
                                    </div>
                                    <div className="cycle-info">
                                        <span>{cycle.numberOfDays} ngày</span>
                                        <span>Chu kỳ {cycle.cycleLength} ngày</span>
                                    </div>
                                    <div className="cycle-reminder-status">
                                        {cycle.reminderEnabled ? (
                                            <span className="reminder-enabled" title="Đã bật nhắc nhở">⏰</span>
                                        ) : (
                                            <span className="reminder-disabled" title="Đã tắt nhắc nhở">🔕</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cycle-details-container">
                            {selectedCycle ? (
                                <div className="cycle-details">
                                    <div className="details-header">
                                        <h4>Chi tiết chu kỳ</h4>
                                        <button
                                            className="close-details-btn"
                                            onClick={handleCloseDetails}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="details-content">
                                        <div className="detail-item">
                                            <span className="detail-label">Ngày bắt đầu:</span>
                                            <span className="detail-value">{formatDate(selectedCycle.startDate)}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Số ngày hành kinh:</span>
                                            <span className="detail-value">{selectedCycle.numberOfDays} ngày</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Độ dài chu kỳ:</span>
                                            <span className="detail-value">{selectedCycle.cycleLength} ngày</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Ngày rụng trứng:</span>
                                            <span className="detail-value highlight">
                                                {formatDate(selectedCycle.ovulationDate)}
                                            </span>
                                        </div>

                                        {selectedCycle.fertileStart && selectedCycle.fertileEnd && (
                                            <div className="detail-item">
                                                <span className="detail-label">Khoảng thời gian dễ thụ thai:</span>
                                                <span className="detail-value">
                                                    {formatDate(selectedCycle.fertileStart)} - {formatDate(selectedCycle.fertileEnd)}
                                                </span>
                                            </div>
                                        )}

                                        {selectedCycle.nextCycleDate && (
                                            <div className="detail-item">
                                                <span className="detail-label">Chu kỳ tiếp theo dự kiến bắt đầu:</span>
                                                <span className="detail-value">
                                                    {formatDate(selectedCycle.nextCycleDate)}
                                                </span>
                                            </div>
                                        )}

                                        {selectedCycle.pregnancyProbability !== undefined && (
                                            <div className="detail-item">
                                                <span className="detail-label">Xác suất mang thai:</span>
                                                <span className="detail-value">
                                                    {selectedCycle.pregnancyProbability}%
                                                </span>
                                            </div>
                                        )}

                                        <div className="detail-item">
                                            <span className="detail-label">Nhắc nhở:</span>
                                            <span className="detail-value">
                                                {selectedCycle.reminderEnabled ? 'Đã bật' : 'Đã tắt'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="details-actions">
                                        <button
                                            className={`btn ${selectedCycle.reminderEnabled ? 'btn-warning' : 'btn-success'}`}
                                            onClick={() => handleToggleReminder(selectedCycle.id, selectedCycle.reminderEnabled)}
                                            disabled={loading}
                                        >
                                            {selectedCycle.reminderEnabled ? 'Tắt nhắc nhở' : 'Bật nhắc nhở'}
                                        </button>

                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteCycle(selectedCycle.id)}
                                            disabled={loading}
                                        >
                                            Xóa chu kỳ
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-cycle-selected">
                                    <p>Chọn một chu kỳ để xem chi tiết</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenstrualHistoryComponent;