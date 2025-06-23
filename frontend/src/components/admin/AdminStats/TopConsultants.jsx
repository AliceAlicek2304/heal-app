import React, { useState, useEffect } from 'react';
import { getTopConsultants, getDateRange } from '../../../services/adminStatsService';
import Pagination from '../../common/Pagination/Pagination';
import DateFilter from './DateFilter';
import styles from './TopConsultants.module.css';

const TopConsultants = () => {
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(20);
    const [dateFilter, setDateFilter] = useState('30days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const itemsPerPage = 10; useEffect(() => {
        fetchConsultants();
    }, [dateFilter, customStartDate, customEndDate]); const fetchConsultants = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get date range from filter
            let startDate, endDate;
            if (dateFilter === 'custom') {
                startDate = customStartDate;
                endDate = customEndDate;
            } else {
                const dateRange = getDateRange(dateFilter);
                startDate = dateRange.startDate;
                endDate = dateRange.endDate;
            }

            const data = await getTopConsultants(limit, startDate, endDate);

            if (Array.isArray(data)) {
                setConsultants(data);
            } else {
                console.warn('Invalid consultants data:', data);
                setConsultants([]);
            }
        } catch (error) {
            console.error('Error fetching top consultants:', error);
            setError('Không thể tải dữ liệu tư vấn viên');
            setConsultants([]);
        } finally {
            setLoading(false);
        }
    };

    const getRatingStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push('⭐');
        }
        if (hasHalfStar) {
            stars.push('⭐');
        }

        return stars.join('') || '⭐'.repeat(0);
    }; const handleDateFilterChange = (period) => {
        setDateFilter(period);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handleCustomDateChange = (type, value) => {
        if (type === 'startDate') {
            setCustomStartDate(value);
        } else if (type === 'endDate') {
            setCustomEndDate(value);
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(consultants.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentConsultants = consultants.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className={styles.topConsultants}>
                <div className={styles.header}>
                    <h3>Top Tư vấn viên</h3>
                </div>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Đang tải...</span>
                </div>
            </div>
        );
    }

    return (<div className={styles.topConsultants}>
        <div className={styles.header}>
            <h3>Top Tư vấn viên</h3>
            <div className={styles.headerActions}>                    <DateFilter
                selectedPeriod={dateFilter}
                onPeriodChange={handleDateFilterChange}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onCustomDateChange={handleCustomDateChange}
            />
                <button onClick={fetchConsultants} className={styles.refreshBtn} disabled={loading}>
                    🔄
                </button>
            </div>
        </div>

        {error && (
            <div className={styles.error}>
                {error}
                <button onClick={fetchConsultants} className={styles.retryBtn}>
                    Thử lại
                </button>
            </div>
        )}

        <div className={styles.consultantsList}>
            {currentConsultants.length === 0 ? (
                <div className={styles.noData}>
                    <span>Không có dữ liệu tư vấn viên</span>
                </div>) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tư vấn viên</th>
                                <th>SL</th>
                                <th>Đánh giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentConsultants.map((consultant, index) => (
                                <tr key={consultant.id} className={styles.tableRow}>
                                    <td className={styles.rank}>
                                        {startIndex + index + 1}
                                    </td>
                                    <td className={styles.consultantInfo}>
                                        <div className={styles.consultantDetails}>
                                            <img
                                                src={consultant.avatar ? getAvatarUrl(consultant.avatar) : '/image/default-avatar.png'}
                                                alt={consultant.fullName}
                                                className={styles.avatar}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div
                                                className={styles.avatarPlaceholder}
                                                style={{ display: consultant.avatar ? 'none' : 'flex' }}
                                            >
                                                {consultant.fullName?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className={styles.name}>{consultant.fullName}</div>
                                                <div className={styles.email}>{consultant.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.bookingCount}>
                                        <span className={styles.countBadge}>
                                            {consultant.bookingCount}
                                        </span>
                                    </td>
                                    <td className={styles.rating}>
                                        <div className={styles.ratingContainer}>
                                            <span className={styles.stars}>
                                                {getRatingStars(consultant.avgRating)}
                                            </span>
                                            <span className={styles.ratingValue}>
                                                {consultant.avgRating}/5
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Pagination */}
        {consultants.length > itemsPerPage && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        )}
    </div>
    );
};

export default TopConsultants;

// Helper function (add to this file or import from utils if shared)
const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    if (avatarPath.startsWith('http')) return avatarPath;
    if (avatarPath.startsWith('/uploads/avatar') || avatarPath.startsWith('/img/avatar')) {
        return `${API_BASE_URL}${avatarPath}`;
    }
    return `${API_BASE_URL}/uploads/avatar/${avatarPath}`;
};
