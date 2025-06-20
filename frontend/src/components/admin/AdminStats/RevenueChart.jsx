import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { getRevenueStats, compareRevenueStats } from '../../../services/adminStatsService';
import styles from './RevenueChart.module.css';

const RevenueChart = () => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        period: 'yearly',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });
    const [chartType, setChartType] = useState('line');
    const [compareData, setCompareData] = useState(null);

    useEffect(() => {
        fetchRevenueData();
    }, [filters]);

    const fetchRevenueData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                period: filters.period,
                year: filters.year
            };

            if (filters.period === 'monthly' || filters.period === 'quarterly') {
                params.month = filters.month;
            }

            const response = await getRevenueStats(
                params.period,
                params.year,
                params.month
            );

            if (response.chartData && response.chartData.length > 0) {
                // Format dữ liệu cho chart
                const formattedData = response.chartData.map(item => ({
                    ...item,
                    revenueNumber: parseFloat(item.revenue) || 0,
                    transactionsNumber: parseInt(item.transactions) || 0,
                    // Format cho display
                    revenueDisplay: formatCurrency(item.revenue),
                    period: item.period || item.monthNameVN || item.weekName || `Tháng ${item.month}`
                }));

                setChartData(formattedData);
            } else {
                setChartData([]);
            }

        } catch (error) {
            console.error('Error fetching revenue data:', error);
            setError('Không thể tải dữ liệu biểu đồ');
        } finally {
            setLoading(false);
        }
    };

    const handleCompareRevenue = async () => {
        try {
            setLoading(true);

            // So sánh với năm trước hoặc tháng trước
            const compareYear = filters.period === 'yearly' ?
                filters.year - 1 : filters.year;
            const compareMonth = filters.period === 'monthly' ?
                (filters.month === 1 ? 12 : filters.month - 1) : filters.month;

            const response = await compareRevenueStats(
                filters.period,
                filters.year,
                filters.month,
                compareYear,
                compareMonth
            );

            setCompareData(response);
        } catch (error) {
            console.error('Error comparing revenue:', error);
            setError('Không thể so sánh doanh thu');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num || 0);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.tooltip}>
                    <p className={styles.tooltipLabel}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.dataKey === 'revenueNumber' ?
                                `Doanh thu: ${formatCurrency(entry.value)}` :
                                `Giao dịch: ${formatNumber(entry.value)}`
                            }
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        if (chartType === 'line') {
            return (
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        yAxisId="revenue"
                        orientation="left"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis
                        yAxisId="transactions"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="revenueNumber"
                        stroke="#059669"
                        strokeWidth={3}
                        name="Doanh thu"
                        dot={{ fill: '#059669', r: 4 }}
                    />
                    <Line
                        yAxisId="transactions"
                        type="monotone"
                        dataKey="transactionsNumber"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Số giao dịch"
                        dot={{ fill: '#3b82f6', r: 3 }}
                    />
                </LineChart>
            );
        } else {
            return (
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey="revenueNumber"
                        fill="#059669"
                        name="Doanh thu"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            );
        }
    };

    return (
        <div className={styles.revenueChart}>
            <div className={styles.chartHeader}>
                <h3>📊 Biểu đồ doanh thu</h3>

                {/* Filter Controls */}
                <div className={styles.filterControls}>
                    <div className={styles.filterGroup}>
                        <label>Kỳ:</label>
                        <select
                            value={filters.period}
                            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                        >
                            <option value="monthly">Tháng</option>
                            <option value="quarterly">Quý</option>
                            <option value="yearly">Năm</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Năm:</label>
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                        >
                            {[2023, 2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {(filters.period === 'monthly' || filters.period === 'quarterly') && (
                        <div className={styles.filterGroup}>
                            <label>Tháng:</label>
                            <select
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <option key={month} value={month}>Tháng {month}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.filterGroup}>
                        <label>Loại biểu đồ:</label>
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                        >
                            <option value="line">Đường</option>
                            <option value="bar">Cột</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCompareRevenue}
                        className={styles.compareButton}
                        disabled={loading}
                    >
                        So sánh
                    </button>
                </div>
            </div>

            {/* Comparison Results */}
            {compareData && (
                <div className={styles.comparisonResults}>
                    <h4>📈 So sánh doanh thu</h4>
                    <div className={styles.comparisonCards}>
                        <div className={styles.comparisonCard}>
                            <div className={styles.cardLabel}>Kỳ hiện tại</div>
                            <div className={styles.cardPeriod}>{compareData.currentPeriod}</div>
                            <div className={styles.cardValue}>{formatCurrency(compareData.currentRevenue)}</div>
                        </div>
                        <div className={styles.comparisonCard}>
                            <div className={styles.cardLabel}>Kỳ so sánh</div>
                            <div className={styles.cardPeriod}>{compareData.comparePeriod}</div>
                            <div className={styles.cardValue}>{formatCurrency(compareData.compareRevenue)}</div>
                        </div>
                        <div className={styles.comparisonCard}>
                            <div className={styles.cardLabel}>Thay đổi</div>
                            <div className={`${styles.cardChange} ${compareData.isIncrease ? styles.increase : styles.decrease}`}>
                                {compareData.isIncrease ? '📈' : '📉'} {formatCurrency(Math.abs(compareData.changeAmount))}
                            </div>
                            <div className={`${styles.cardPercent} ${compareData.isIncrease ? styles.increase : styles.decrease}`}>
                                ({compareData.changePercent > 0 ? '+' : ''}{parseFloat(compareData.changePercent).toFixed(1)}%)
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className={styles.chartContainer}>
                {loading && (
                    <div className={styles.chartLoading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                )}

                {error && (
                    <div className={styles.chartError}>
                        <p>{error}</p>
                        <button onClick={fetchRevenueData} className={styles.retryButton}>
                            Thử lại
                        </button>
                    </div>
                )}

                {!loading && !error && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={400}>
                        {renderChart()}
                    </ResponsiveContainer>
                )}

                {!loading && !error && chartData.length === 0 && (
                    <div className={styles.noData}>
                        <p>Không có dữ liệu để hiển thị</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueChart;
