import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaEye, FaSearch, FaUserMd } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import adminService from '../../../services/adminService';
import { formatDate } from '../../../utils/dateUtils';
import ConsultantModal from './ConsultantModal';
import Pagination from '../../common/Pagination/Pagination';
import styles from './ConsultantManagement.module.css';
import authService from '../../../services/authService';

const ITEMS_PER_PAGE = 15;

const ConsultantManagement = () => {
    const [consultants, setConsultants] = useState([]);
    const [filteredConsultants, setFilteredConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        total: 0
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [showConsultantModal, setShowConsultantModal] = useState(false);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // create, edit, view

    const { addToast } = useToast();

    // Helper function to build avatar URL
    const getAvatarUrl = (avatarPath) => {
        return authService.getAvatarUrl(avatarPath);
    };

    useEffect(() => {
        loadConsultants();
    }, []);

    useEffect(() => {
        filterConsultants();
    }, [consultants, searchTerm]);

    useEffect(() => {
        paginateConsultants();
    }, [filteredConsultants, currentPage]);

    const loadConsultants = async () => {
        try {
            setLoading(true); const consultantData = await adminService.consultants.getAll();

            // adminService đã xử lý và trả về array
            const consultantList = Array.isArray(consultantData) ? consultantData : [];
            setConsultants(consultantList);
            setFilteredConsultants(consultantList);// Calculate stats - consultant profiles don't have status, just count total
            const total = consultantList.length;
            setStats({ total });
        } catch (error) {
            console.error('Error loading consultants:', error);
            addToast('Không thể tải danh sách chuyên viên tư vấn', 'error');
            setConsultants([]);
            setFilteredConsultants([]);
        } finally {
            setLoading(false);
        }
    }; const filterConsultants = () => {
        if (!Array.isArray(consultants)) {
            setFilteredConsultants([]);
            return;
        }

        let filtered = [...consultants];

        // Search filter based on ConsultantProfileResponse fields
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(consultant =>
                consultant.fullName?.toLowerCase().includes(term) ||
                consultant.email?.toLowerCase().includes(term) ||
                consultant.phone?.includes(term) ||
                consultant.qualifications?.toLowerCase().includes(term) ||
                consultant.experience?.toLowerCase().includes(term) ||
                consultant.bio?.toLowerCase().includes(term)
            );
        }

        // Sort by newest first (createdAt or id descending)
        filtered.sort((a, b) => {
            // Try createdAt first, then fall back to id
            const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);

            if (aDate.getTime() !== bDate.getTime()) {
                return bDate.getTime() - aDate.getTime(); // Newest first
            }

            // Fall back to id if dates are equal
            return (b.id || 0) - (a.id || 0);
        });

        setFilteredConsultants(filtered);
        // Reset to page 1 when filter changes
        setCurrentPage(1);
    };

    const handleCreateConsultant = () => {
        setSelectedConsultant(null);
        setModalMode('create');
        setShowConsultantModal(true);
    };

    const handleEditConsultant = (consultant) => {
        setSelectedConsultant(consultant);
        setModalMode('edit');
        setShowConsultantModal(true);
    };

    const handleViewConsultant = (consultant) => {
        setSelectedConsultant(consultant);
        setModalMode('view');
        setShowConsultantModal(true);
    }; const handleConsultantSaved = () => {
        setShowConsultantModal(false);
        loadConsultants();
    };

    // Pagination logic
    const paginateConsultants = () => {
        setTotalPages(Math.ceil(filteredConsultants.length / ITEMS_PER_PAGE));
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const paginatedConsultantsData = () => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredConsultants.slice(start, end);
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className={styles.consultantManagement}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>Quản lý chuyên viên tư vấn</h2>
                <button className={styles.createButton} onClick={handleCreateConsultant}>
                    <FaPlus />
                    Thêm chuyên viên
                </button>
            </div>            {/* Stats */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FaUserMd /></div>
                    <div className={styles.statInfo}>
                        <h3>{stats.total}</h3>
                        <p>Tổng chuyên viên</p>
                    </div>
                </div>
            </div>            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchContainer}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm chuyên viên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>            {/* Consultants Table */}
            <div className={styles.tableContainer}>
                <table className={styles.consultantsTable}>
                    <thead>
                        <tr>
                            <th>Thông tin chuyên viên</th>
                            <th>Chuyên môn</th>
                            <th>Ngày tạo</th>
                            <th>Ngày cập nhật</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!Array.isArray(filteredConsultants) || filteredConsultants.length === 0 ? (
                            <tr>
                                <td colSpan="5" className={styles.noData}>
                                    Không tìm thấy chuyên viên tư vấn nào
                                </td>
                            </tr>
                        ) : (
                            paginatedConsultantsData().map(consultant => (
                                <tr key={consultant.profileId || consultant.userId}>
                                    <td>
                                        <div className={styles.consultantInfo}>
                                            <div className={styles.avatar}>
                                                {consultant.avatar ? (
                                                    <img
                                                        src={getAvatarUrl(consultant.avatar)}
                                                        alt={consultant.fullName}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className={styles.avatarPlaceholder}
                                                    style={{ display: consultant.avatar ? 'none' : 'flex' }}
                                                >
                                                    {consultant.fullName?.charAt(0)?.toUpperCase() || 'C'}
                                                </div>
                                            </div>
                                            <div className={styles.consultantDetails}>
                                                <div className={styles.consultantName}>{consultant.fullName}</div>
                                                <div className={styles.consultantContact}>
                                                    <span>{consultant.email}</span>
                                                    {consultant.phone && <span> • {consultant.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.qualifications}>
                                            {consultant.qualifications || 'Chưa có thông tin'}
                                        </div>
                                    </td>
                                    <td>{formatDate(consultant.createdAt)}</td>
                                    <td>{formatDate(consultant.updatedAt)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleViewConsultant(consultant)}
                                                title="Xem chi tiết"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleEditConsultant(consultant)}
                                                title="Chỉnh sửa"
                                            >
                                                <FaEdit />
                                            </button>
                                        </div>
                                    </td>
                                </tr>))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Modal */}
            {showConsultantModal && (
                <ConsultantModal
                    consultant={selectedConsultant}
                    mode={modalMode}
                    onSave={handleConsultantSaved}
                    onClose={() => setShowConsultantModal(false)}
                />
            )}
        </div>
    );
};

export default ConsultantManagement;
