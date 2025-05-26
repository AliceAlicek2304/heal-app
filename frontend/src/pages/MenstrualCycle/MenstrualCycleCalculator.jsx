import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Navbar from '../../components/layout/Navbar/Navbar';
import './MenstrualCycleCalculator.css';

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

    // Fetch lịch sử chu kỳ khi component mount và khi user thay đổi
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchCycles();
        }
    }, [isAuthenticated, user]);

    // Lấy lịch sử chu kỳ kinh nguyệt
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
                // Sắp xếp chu kỳ theo thời gian tạo giảm dần (mới nhất lên đầu)
                const sortedCycles = response.data.sort((a, b) => {
                    // Ưu tiên sắp xếp theo createdAt nếu có
                    if (a.createdAt && b.createdAt) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    // Nếu không có createdAt, sắp xếp theo ID (ID cao hơn thường là bản ghi mới hơn)
                    return b.id - a.id;
                });
                setCycles(sortedCycles);
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

    // Xử lý thay đổi form input
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Xử lý tính toán và lưu chu kỳ
    const handleCalculate = async (e) => {
        e.preventDefault();

        try {
            // Đảm bảo các giá trị hợp lệ
            if (parseInt(formData.numberOfDays) <= 0) {
                toast.error("Số ngày hành kinh phải lớn hơn 0");
                return;
            }

            if (parseInt(formData.cycleLength) <= 0) {
                toast.error("Độ dài chu kỳ phải lớn hơn 0");
                return;
            }

            // Gọi API để tính toán và hiển thị kết quả tính toán
            setLoading(true);

            // Chuẩn bị dữ liệu gửi đi
            const cycleData = {
                startDate: formData.startDate instanceof Date
                    ? formData.startDate.toISOString().split('T')[0]
                    : formData.startDate,
                numberOfDays: parseInt(formData.numberOfDays),
                cycleLength: parseInt(formData.cycleLength)
            };

            // Lấy kết quả tính toán từ API mà không lưu vào lịch sử
            const response = await authService.addMenstrualCycle(cycleData);

            if (response.success) {
                // Sử dụng kết quả từ API để hiển thị
                const result = response.data;
                setCalculationResult({
                    startDate: new Date(result.startDate),
                    endDate: new Date(new Date(result.startDate).setDate(new Date(result.startDate).getDate() + result.numberOfDays - 1)),
                    ovulationDate: new Date(result.ovulationDate),
                    nextCycleDate: new Date(new Date(result.startDate).setDate(new Date(result.startDate).getDate() + result.cycleLength)),
                    fertileStart: new Date(new Date(result.ovulationDate).setDate(new Date(result.ovulationDate).getDate() - 3)),
                    fertileEnd: new Date(new Date(result.ovulationDate).setDate(new Date(result.ovulationDate).getDate() + 3)),
                    cycleId: result.id, // Lưu ID chu kỳ để có thể hiển thị vào lịch sử
                    pregnancyProbability: result.pregnancyProbability
                });

                // Nếu người dùng đã đăng nhập, cập nhật lịch sử chu kỳ
                if (isAuthenticated) {
                    fetchCycles();
                }

                // Hiển thị thông báo thành công
                toast.success("Đã tính toán chu kỳ kinh nguyệt thành công");
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

    // Xem chi tiết chu kỳ
    const handleViewCycleDetails = (cycle) => {
        setSelectedCycle(cycle);
    };

    // Đóng chi tiết chu kỳ
    const handleCloseDetails = () => {
        setSelectedCycle(null);
    };

    // Bật/tắt nhắc nhở
    const handleToggleReminder = async (cycleId, isEnabled) => {
        try {
            setLoading(true);
            const response = await authService.toggleCycleReminder(cycleId, !isEnabled);

            if (response.success) {
                // Cập nhật lại danh sách chu kỳ
                fetchCycles();

                // Cập nhật lại chu kỳ đang xem chi tiết nếu có
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

    // Xóa chu kỳ
    const handleDeleteCycle = async (cycleId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa chu kỳ này không?")) {
            try {
                setLoading(true);
                const response = await authService.deleteMenstrualCycle(cycleId);

                if (response.success) {
                    // Cập nhật lại danh sách chu kỳ
                    fetchCycles();

                    // Nếu đang xem chi tiết chu kỳ bị xóa thì đóng chi tiết
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

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'dd MMMM yyyy', { locale: vi });
    };

    return (
        <div className="menstrual-cycle-page">
            <Navbar />
            <div className="menstrual-cycle-container">
                <h1 className="page-title">Tính chu kỳ kinh nguyệt</h1>

                <div className="menstrual-cycle-content">
                    <div className="calculator-section">
                        <div className="calculator-form-container">
                            <h2>Nhập thông tin chu kỳ</h2>
                            <form onSubmit={handleCalculate} className="calculator-form">
                                <div className="form-group">
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
                                        className="date-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="numberOfDays">Số ngày hành kinh</label>
                                    <input
                                        type="number"
                                        id="numberOfDays"
                                        name="numberOfDays"
                                        value={formData.numberOfDays}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="15"
                                        required
                                    />
                                </div>

                                <div className="form-group">
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
                                    <small className="form-text">
                                        Thông thường từ 21-35 ngày (trung bình 28 ngày)
                                    </small>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Đang tính...' : 'Tính toán'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {calculationResult && (
                            <div className="calculation-result">
                                <h2>Kết quả tính toán</h2>
                                <div className="result-card">
                                    <div className="result-item">
                                        <span className="result-label">Ngày hành kinh:</span>
                                        <span className="result-value">
                                            {formatDate(calculationResult.startDate)} - {formatDate(calculationResult.endDate)}
                                        </span>
                                    </div>

                                    <div className="result-item">
                                        <span className="result-label">Ngày rụng trứng dự kiến:</span>
                                        <span className="result-value highlight">
                                            {formatDate(calculationResult.ovulationDate)}
                                        </span>
                                    </div>

                                    <div className="result-item">
                                        <span className="result-label">Khoảng thời gian dễ thụ thai:</span>
                                        <span className="result-value">
                                            {formatDate(calculationResult.fertileStart)} - {formatDate(calculationResult.fertileEnd)}
                                        </span>
                                    </div>

                                    <div className="result-item">
                                        <span className="result-label">Chu kỳ tiếp theo dự kiến bắt đầu:</span>
                                        <span className="result-value">
                                            {formatDate(calculationResult.nextCycleDate)}
                                        </span>
                                    </div>

                                    {calculationResult.pregnancyProbability !== undefined && (
                                        <div className="result-item">
                                            <span className="result-label">Xác suất mang thai hiện tại:</span>
                                            <span className="result-value highlight">
                                                {calculationResult.pregnancyProbability}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="result-note">
                                    <p>
                                        <strong>Lưu ý:</strong> Các kết quả tính toán chỉ mang tính tham khảo.
                                        Chu kỳ kinh nguyệt của mỗi người có thể thay đổi do nhiều yếu tố như stress,
                                        thay đổi cân nặng, tập luyện quá mức, hoặc các vấn đề sức khỏe.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="history-section">
                        <h2>Lịch sử chu kỳ</h2>

                        {!isAuthenticated ? (
                            <div className="auth-prompt">
                                <p>Vui lòng đăng nhập để xem lịch sử chu kỳ</p>
                            </div>
                        ) : loading ? (
                            <div className="loading">Đang tải...</div>
                        ) : cycles.length === 0 ? (
                            <div className="empty-history">
                                <p>Chưa có chu kỳ nào được lưu</p>
                            </div>
                        ) : (
                            <div className="cycle-history-list">
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
                                                <span className="reminder-enabled">⏰</span>
                                            ) : (
                                                <span className="reminder-disabled">🔕</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedCycle && (
                            <div className="cycle-details">
                                <div className="details-header">
                                    <h3>Chi tiết chu kỳ</h3>
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

                                    <div className="detail-item">
                                        <span className="detail-label">Xác suất mang thai:</span>
                                        <span className="detail-value">
                                            {selectedCycle.pregnancyProbability}%
                                        </span>
                                    </div>

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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenstrualCycleCalculator;