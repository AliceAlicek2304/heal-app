import React, { useState, useEffect } from 'react';
import { getRevenueDistribution } from '../../../services/adminStatsService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import styles from './RevenuePieChart.module.css';

const RevenuePieChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRevenueDistribution();
    }, []);

    const fetchRevenueDistribution = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getRevenueDistribution();
            setData(result);
        } catch (error) {
            console.error('Error fetching revenue distribution:', error);
            setError('Không thể tải dữ liệu phân bổ doanh thu');
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

    const formatPercent = (percent) => {
        return `${percent.toFixed(1)}%`;
    };

    // Calculate total revenue
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

    // Colors for different service types
    const colors = [
        '#3b82f6', // Blue for consultations
        '#f59e0b', // Amber for STI services
        '#10b981', // Emerald for STI packages
        '#ef4444', // Red for other services
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
    ];

    // Calculate angles for pie chart
    const chartData = data.map((item, index) => {
        const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
        return {
            ...item,
            percentage,
            color: colors[index % colors.length]
        };
    });    // Create SVG path for pie slice
    const createPath = (startAngle, endAngle, radius = 90) => {
        const centerX = 120;
        const centerY = 120;

        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);

        const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    // Calculate label position
    const getLabelPosition = (startAngle, endAngle, radius = 65) => {
        const centerX = 120;
        const centerY = 120;
        const midAngle = (startAngle + endAngle) / 2;
        const midAngleRad = (midAngle * Math.PI) / 180;

        return {
            x: centerX + radius * Math.cos(midAngleRad),
            y: centerY + radius * Math.sin(midAngleRad)
        };
    };

    if (loading) {
        return (
            <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                    <h3>📊 Phân bổ doanh thu theo dịch vụ</h3>
                </div>
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                    <h3>📊 Phân bổ doanh thu theo dịch vụ</h3>
                </div>
                <div className={styles.errorContainer}>
                    <p>{error}</p>
                    <button onClick={fetchRevenueDistribution} className={styles.retryBtn}>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                    <h3>📊 Phân bổ doanh thu theo dịch vụ</h3>
                </div>
                <div className={styles.noDataContainer}>
                    <p>Chưa có dữ liệu doanh thu</p>
                </div>
            </div>
        );
    }

    // Calculate cumulative angles
    let cumulativeAngle = 0;
    const pieSlices = chartData.map((item, index) => {
        const angle = (item.percentage / 100) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle += angle; return {
            ...item,
            startAngle,
            endAngle,
            path: createPath(startAngle, endAngle),
            labelPosition: getLabelPosition(startAngle, endAngle)
        };
    });

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h3>📊 Phân bổ doanh thu theo dịch vụ</h3>
                <div className={styles.totalRevenue}>
                    Tổng: {formatCurrency(totalRevenue)}
                </div>
            </div>

            <div className={styles.chartContent}>
                <div className={styles.pieChartWrapper}>
                    <svg width="240" height="240" viewBox="0 0 240 240" className={styles.pieChart}>                        {pieSlices.map((slice, index) => (
                        <g key={index}>
                            <path
                                d={slice.path}
                                fill={slice.color}
                                stroke="#fff"
                                strokeWidth="2"
                                className={styles.pieSlice}
                            />
                            {/* Label text - only show if percentage > 5% */}
                            {slice.percentage > 5 && (
                                <text
                                    x={slice.labelPosition.x}
                                    y={slice.labelPosition.y - 5}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#fff"
                                    fontWeight="600"
                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                                >
                                    {slice.name}
                                </text>
                            )}
                            {/* Percentage text */}
                            {slice.percentage > 5 && (
                                <text
                                    x={slice.labelPosition.x}
                                    y={slice.labelPosition.y + 8}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#fff"
                                    fontWeight="500"
                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                                >
                                    {formatPercent(slice.percentage)}
                                </text>
                            )}
                        </g>
                    ))}

                        {/* Center circle */}
                        <circle
                            cx="120"
                            cy="120"
                            r="40"
                            fill="#fff"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                        />

                        {/* Center text */}
                        <text
                            x="120"
                            y="115"
                            textAnchor="middle"
                            className={styles.centerText}
                            fontSize="12"
                            fill="#6b7280"
                        >
                            Doanh thu
                        </text>
                        <text
                            x="120"
                            y="130"
                            textAnchor="middle"
                            className={styles.centerValue}
                            fontSize="14"
                            fill="#374151"
                            fontWeight="600"
                        >
                            {data.length} loại
                        </text>
                    </svg>
                </div>

                <div className={styles.legend}>
                    {chartData.map((item, index) => (
                        <div key={index} className={styles.legendItem}>
                            <div
                                className={styles.legendColor}
                                style={{ backgroundColor: item.color }}
                            ></div>                            <div className={styles.legendContent}>
                                <div className={styles.legendLabel}>
                                    {item.name}
                                </div>
                                <div className={styles.legendValue}>
                                    {formatCurrency(item.revenue)}
                                </div>
                                <div className={styles.legendPercent}>
                                    {formatPercent(item.percentage)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RevenuePieChart;
