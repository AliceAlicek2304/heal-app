import React, { useState, useEffect } from 'react';
import { getTopSTIPackages, getDateRange } from '../../../services/adminStatsService';
import Pagination from '../../common/Pagination/Pagination';
import DateFilter from './DateFilter';
import styles from './TopSTIPackages.module.css';

const TopSTIPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(20);
    const [dateFilter, setDateFilter] = useState('30days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const itemsPerPage = 10; useEffect(() => {
        fetchPackages();
    }, [dateFilter, customStartDate, customEndDate]); const fetchPackages = async () => {
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

            const data = await getTopSTIPackages(limit, startDate, endDate);

            if (Array.isArray(data)) {
                setPackages(data);
            } else {
                console.warn('Invalid packages data:', data);
                setPackages([]);
            }
        } catch (error) {
            console.error('Error fetching top STI packages:', error);
            setError('Không thể tải dữ liệu gói STI');
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(price);
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
    const totalPages = Math.ceil(packages.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPackages = packages.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className={styles.topSTIPackages}>
                <div className={styles.header}>
                    <h3>Top Gói STI</h3>
                </div>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Đang tải...</span>
                </div>
            </div>
        );
    }

    return (<div className={styles.topSTIPackages}>
        <div className={styles.header}>
            <h3>Top Gói STI</h3>
            <div className={styles.headerActions}>                    <DateFilter
                selectedPeriod={dateFilter}
                onPeriodChange={handleDateFilterChange}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onCustomDateChange={handleCustomDateChange}
            />
                <button onClick={fetchPackages} className={styles.refreshBtn} disabled={loading}>
                    🔄
                </button>
            </div>
        </div>

        {error && (
            <div className={styles.error}>
                {error}
                <button onClick={fetchPackages} className={styles.retryBtn}>
                    Thử lại
                </button>
            </div>
        )}

        <div className={styles.packagesList}>
            {currentPackages.length === 0 ? (
                <div className={styles.noData}>
                    <span>Không có dữ liệu gói STI</span>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên gói</th>
                                <th>Giá</th>
                                <th>SL</th>
                                <th>Đánh giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPackages.map((packageItem, index) => (
                                <tr key={packageItem.packageId} className={styles.tableRow}>
                                    <td className={styles.rank}>
                                        {startIndex + index + 1}
                                    </td>
                                    <td className={styles.packageName}>
                                        {packageItem.packageName}
                                    </td>
                                    <td className={styles.price}>
                                        {formatPrice(packageItem.totalPrice)}
                                    </td>
                                    <td className={styles.bookingCount}>
                                        <span className={styles.countBadge}>
                                            {packageItem.bookingCount}
                                        </span>
                                    </td>
                                    <td className={styles.rating}>
                                        <div className={styles.ratingValue}>
                                            {(packageItem.avgRating || 0).toFixed(1)}/5
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
        {packages.length > itemsPerPage && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        )}
    </div>
    );
};

export default TopSTIPackages;
