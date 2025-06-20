import React from 'react';
import styles from './DateFilter.module.css';

const DateFilter = ({
    selectedPeriod,
    onPeriodChange,
    showCustomRange = false,
    customStartDate,
    customEndDate,
    onCustomDateChange
}) => {
    const periods = [
        { value: 'today', label: 'Hôm nay' },
        { value: '7days', label: '7 ngày' },
        { value: '30days', label: '30 ngày' },
        { value: '3months', label: '3 tháng' },
        { value: '6months', label: '6 tháng' },
        { value: '1year', label: '1 năm' },
        { value: 'custom', label: 'Tùy chỉnh' }
    ];

    const handlePeriodChange = (e) => {
        const period = e.target.value;
        onPeriodChange(period);
    };

    const handleCustomDateChange = (type, value) => {
        if (onCustomDateChange) {
            onCustomDateChange(type, value);
        }
    };

    return (
        <div className={styles.dateFilter}>
            <div className={styles.periodSelector}>
                <label className={styles.label}>Thời gian:</label>
                <select
                    value={selectedPeriod}
                    onChange={handlePeriodChange}
                    className={styles.select}
                >
                    {periods.map(period => (
                        <option key={period.value} value={period.value}>
                            {period.label}
                        </option>
                    ))}
                </select>
            </div>

            {selectedPeriod === 'custom' && (
                <div className={styles.customRange}>
                    <div className={styles.dateInput}>
                        <label className={styles.label}>Từ ngày:</label>
                        <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                            className={styles.dateField}
                        />
                    </div>
                    <div className={styles.dateInput}>
                        <label className={styles.label}>Đến ngày:</label>
                        <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                            className={styles.dateField}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateFilter;
