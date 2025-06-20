import React, { useState, useEffect } from 'react';
import styles from './AdvancedFilter.module.css';

const AdvancedFilter = ({
    onFilterChange,
    statusOptions = [],
    showDateFilter = true,
    showStatusFilter = true,
    placeholder = "Tìm kiếm...",
    className = "",
    initialFilters = {}
}) => {
    const [filters, setFilters] = useState({
        searchText: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        ...initialFilters
    });

    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            searchText: '',
            status: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.searchText || filters.status || filters.dateFrom || filters.dateTo;
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const getLastWeekDate = () => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    };

    const getLastMonthDate = () => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    };

    const setQuickDateRange = (range) => {
        const today = getTodayDate();

        switch (range) {
            case 'today':
                setFilters(prev => ({
                    ...prev,
                    dateFrom: today,
                    dateTo: today
                }));
                break;
            case 'week':
                setFilters(prev => ({
                    ...prev,
                    dateFrom: getLastWeekDate(),
                    dateTo: today
                }));
                break;
            case 'month':
                setFilters(prev => ({
                    ...prev,
                    dateFrom: getLastMonthDate(),
                    dateTo: today
                }));
                break;
            default:
                break;
        }
    };

    return (
        <div className={`${styles.filterContainer} ${className}`}>
            {/* Search and toggle filters */}
            <div className={styles.searchRow}>
                <div className={styles.searchInputGroup}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={filters.searchText}
                        onChange={(e) => handleFilterChange('searchText', e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`${styles.filterToggle} ${showFilters ? styles.active : ''} ${hasActiveFilters() ? styles.hasFilters : ''}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
                    </svg>
                    Bộ lọc
                    {hasActiveFilters() && <span className={styles.filterBadge}></span>}
                </button>

                {hasActiveFilters() && (
                    <button
                        onClick={clearFilters}
                        className={styles.clearButton}
                        title="Xóa tất cả bộ lọc"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
            </div>

            {/* Advanced filters */}
            {showFilters && (
                <div className={styles.advancedFilters}>
                    <div className={styles.filterRow}>
                        {/* Status filter */}
                        {showStatusFilter && statusOptions.length > 0 && (
                            <div className={styles.filterGroup}>
                                <label>Trạng thái</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className={styles.filterSelect}
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date range filter */}
                        {showDateFilter && (
                            <>
                                <div className={styles.filterGroup}>
                                    <label>Từ ngày</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                        className={styles.filterInput}
                                    />
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>Đến ngày</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                        className={styles.filterInput}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick date range buttons */}
                    {showDateFilter && (
                        <div className={styles.quickDateRange}>
                            <span className={styles.quickLabel}>Nhanh:</span>
                            <button
                                onClick={() => setQuickDateRange('today')}
                                className={styles.quickBtn}
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => setQuickDateRange('week')}
                                className={styles.quickBtn}
                            >
                                7 ngày qua
                            </button>
                            <button
                                onClick={() => setQuickDateRange('month')}
                                className={styles.quickBtn}
                            >
                                30 ngày qua
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdvancedFilter;
