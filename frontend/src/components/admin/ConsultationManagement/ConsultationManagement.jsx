import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaCalendarAlt, FaUserMd, FaUser } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import consultationService from '../../../services/consultationService';
import { formatDateTime } from '../../../utils/dateUtils';
import ConsultationDetailModal from './ConsultationDetailModal';
import Pagination from '../../common/Pagination/Pagination';
import styles from './ConsultationManagement.module.css';

const ITEMS_PER_PAGE = 15;

const STATUS_CONFIG = {
    PENDING: { label: 'Chờ xử lý', className: 'statusPending', color: '#f59e0b' },
    CONFIRMED: { label: 'Đã xác nhận', className: 'statusConfirmed', color: '#10b981' },
    COMPLETED: { label: 'Hoàn thành', className: 'statusCompleted', color: '#6366f1' },
    CANCELLED: { label: 'Đã hủy', className: 'statusCancelled', color: '#ef4444' }
};

const ConsultationManagement = () => {
    const [consultations, setConsultations] = useState([]);
    const [filteredConsultations, setFilteredConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState(null);

    const { addToast } = useToast();

    useEffect(() => {
        loadConsultations();
    }, []);

    useEffect(() => {
        filterConsultations();
    }, [consultations, searchTerm, selectedStatus]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredConsultations.length / ITEMS_PER_PAGE));
    }, [filteredConsultations]);
    const loadConsultations = async () => {
        setLoading(true);
        try {
            const response = await consultationService.getAllConsultations();
            if (response.success) {
                setConsultations(response.data || []);
            } else {
                addToast(response.message || 'Không thể tải danh sách tư vấn', 'error');
                setConsultations([]);
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
            setConsultations([]);
        } finally {
            setLoading(false);
        }
    };

    const filterConsultations = () => {
        if (!Array.isArray(consultations)) {
            setFilteredConsultations([]);
            return;
        }

        let filtered = [...consultations];        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(consultation =>
                consultation.consultationId?.toString().includes(term) ||
                consultation.customerName?.toLowerCase().includes(term) ||
                consultation.consultantName?.toLowerCase().includes(term) ||
                consultation.note?.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (selectedStatus) {
            filtered = filtered.filter(consultation => consultation.status === selectedStatus);
        }

        // Sort by ID DESC (newest first)
        filtered.sort((a, b) => b.consultationId - a.consultationId);

        setFilteredConsultations(filtered);
        setCurrentPage(1);
    }; const getCurrentPageItems = () => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredConsultations.slice(start, end);
    }; const handleViewDetail = (consultation) => {
        // Validate consultation object
        if (!consultation || !consultation.consultationId) {
            addToast('Dữ liệu cuộc tư vấn không hợp lệ', 'error');
            return;
        }

        // Use data directly from the list (like ConsultationHistory)
        setSelectedConsultation(consultation);
        setShowDetailModal(true);
    };

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || { label: status, className: 'statusDefault', color: '#6b7280' };
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải danh sách tư vấn...</p>
            </div>
        );
    }

    return (
        <div className={styles.consultationManagement}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <FaCalendarAlt className={styles.titleIcon} />
                        Quản lý Tư vấn
                    </h2>
                    <p className={styles.subtitle}>
                        Xem và theo dõi tất cả các cuộc tư vấn trong hệ thống
                    </p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{filteredConsultations.length}</span>
                        <span className={styles.statLabel}>Tổng số</span>
                    </div>

                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />                    <input
                        type="text"
                        placeholder="Tìm kiếm theo ID, tên khách hàng, tư vấn viên, ghi chú..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={styles.statusFilter}
                >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Khách hàng</th>
                            <th>Tư vấn viên</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getCurrentPageItems().length === 0 ? (
                            <tr>
                                <td colSpan="8" className={styles.emptyState}>
                                    <FaCalendarAlt className={styles.emptyIcon} />
                                    <p>Không có cuộc tư vấn nào</p>
                                </td>
                            </tr>
                        ) : (
                            getCurrentPageItems().map((consultation) => {
                                const statusConfig = getStatusConfig(consultation.status);
                                return (
                                    <tr key={consultation.consultationId}>
                                        <td className={styles.idCell}>#{consultation.consultationId}</td>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <FaUser className={styles.userIcon} />
                                                <span>{consultation.customerName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <FaUserMd className={styles.userIcon} />
                                                <span>{consultation.consultantName}</span>
                                            </div>                                        </td>
                                        <td className={styles.timeCell}>
                                            {consultation.startTime && consultation.endTime ? (
                                                <div>
                                                    <div>{formatDateTime(consultation.startTime)}</div>
                                                    <small>đến {formatDateTime(consultation.endTime)}</small>
                                                </div>
                                            ) : (
                                                'Chưa xác định'
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`${styles.statusBadge} ${styles[statusConfig.className]}`}
                                                style={{ backgroundColor: statusConfig.color }}
                                            >
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className={styles.noteCell}>
                                            {consultation.note ? (
                                                <div className={styles.notePreview}>
                                                    <span className={styles.noteText}>
                                                        {consultation.note.length > 50
                                                            ? `${consultation.note.substring(0, 50)}...`
                                                            : consultation.note}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={styles.noNote}>Không có ghi chú</span>
                                            )}
                                        </td>
                                        <td className={styles.dateCell}>
                                            {formatDateTime(consultation.createdAt)}
                                        </td>
                                        <td>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => handleViewDetail(consultation)}
                                                title="Xem chi tiết"
                                            >
                                                <FaEye />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
            {/* Detail Modal */}
            {showDetailModal && selectedConsultation && (
                <ConsultationDetailModal
                    consultation={selectedConsultation}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedConsultation(null);
                    }}
                />
            )}
        </div>
    );
};

export default ConsultationManagement;
