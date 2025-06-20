import React, { useState, useEffect } from 'react';
import { getTopSTIServices, getDateRange } from '../../../services/adminStatsService';
import Pagination from '../../common/Pagination/Pagination';
import DateFilter from './DateFilter';
import styles from './TopSTIServices.module.css';

const TopSTIServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(20);
    const [dateFilter, setDateFilter] = useState('30days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const itemsPerPage = 10; useEffect(() => {
        fetchServices();
    }, [dateFilter, customStartDate, customEndDate]); const fetchServices = async () => {
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

            const data = await getTopSTIServices(limit, startDate, endDate);

            if (Array.isArray(data)) {
                setServices(data);
            } else {
                console.warn('Invalid services data:', data);
                setServices([]);
            }
        } catch (error) {
            console.error('Error fetching top STI services:', error);
            setError('Không thể tải dữ liệu dịch vụ STI');
            setServices([]);
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
    const totalPages = Math.ceil(services.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentServices = services.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className={styles.topSTIServices}>
                <div className={styles.header}>
                    <h3>Top Dịch vụ STI</h3>
                </div>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Đang tải...</span>
                </div>
            </div>
        );
    }

    return (<div className={styles.topSTIServices}>
        <div className={styles.header}>
            <h3>Top Dịch vụ STI</h3>
            <div className={styles.headerActions}>                    <DateFilter
                selectedPeriod={dateFilter}
                onPeriodChange={handleDateFilterChange}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onCustomDateChange={handleCustomDateChange}
            />
                <button onClick={fetchServices} className={styles.refreshBtn} disabled={loading}>
                    🔄
                </button>
            </div>
        </div>

        {error && (
            <div className={styles.error}>
                {error}
                <button onClick={fetchServices} className={styles.retryBtn}>
                    Thử lại
                </button>
            </div>
        )}

        <div className={styles.servicesList}>
            {currentServices.length === 0 ? (
                <div className={styles.noData}>
                    <span>Không có dữ liệu dịch vụ STI</span>
                </div>) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên dịch vụ</th>
                                <th>Giá</th>
                                <th>SL</th>
                                <th>Đánh giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentServices.map((service, index) => (
                                <tr key={service.serviceId} className={styles.tableRow}>
                                    <td className={styles.rank}>
                                        {startIndex + index + 1}
                                    </td>
                                    <td className={styles.serviceName}>
                                        {service.serviceName}
                                    </td>
                                    <td className={styles.price}>
                                        {formatPrice(service.price)}
                                    </td>
                                    <td className={styles.bookingCount}>
                                        <span className={styles.countBadge}>
                                            {service.bookingCount}
                                        </span>
                                    </td>
                                    <td className={styles.rating}>
                                        <div className={styles.ratingValue}>
                                            {(service.avgRating || 0).toFixed(1)}/5
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
        {services.length > itemsPerPage && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        )}
    </div>
    );
};

export default TopSTIServices;
