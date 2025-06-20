import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import RevenueChart from './RevenueChart';
import RevenuePieChart from './RevenuePieChart';
import ActivityFeed from './ActivityFeed';
import TopConsultants from './TopConsultants';
import TopSTIServices from './TopSTIServices';
import TopSTIPackages from './TopSTIPackages';
import { getStatsOverview } from '../../../services/adminStatsService';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import styles from './AdminStats.module.css';

const AdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportLoading, setExportLoading] = useState({ pdf: false, excel: false });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);

            const statsData = await getStatsOverview();

            // Transform data to match existing component structure
            setStats({
                totalUsers: statsData.totalUsers || 0,
                totalConsultations: statsData.totalConsultations || 0,
                totalSTITests: statsData.totalSTITests || 0,
                totalConsultants: statsData.totalConsultants || 0,
                totalRevenue: statsData.totalRevenue || 0,                // Thêm các KPI kinh doanh mới
                averageOrderValue: statsData.averageOrderValue || 0,
                revenuePerUser: statsData.revenuePerUser || 0,
                revenueGrowthRate: statsData.revenueGrowthRate || 0,
                userGrowthRate: statsData.userGrowthRate || 0,
                orderGrowthRate: statsData.orderGrowthRate || 0,
                customerRetentionRate: statsData.customerRetentionRate || 0,
                // Keep some mock data for features not yet implemented
                totalRatings: 0, // TODO: Implement rating stats
                totalBlogPosts: 0, // TODO: Implement blog stats
                monthlyGrowth: {
                    users: 0, // TODO: Implement growth stats
                    consultations: 0,
                    stiTests: 0,
                    ratings: 0
                },
                recentActivity: [] // TODO: Implement activity feed
            });

        } catch (error) {
            console.error('Error fetching stats:', error);
            setError('Không thể tải thống kê. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num || 0);
    }; const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatPercentage = (value) => {
        return `${value >= 0 ? '+' : ''}${value?.toFixed(1) || 0}%`;
    };

    const getGrowthColor = (growth) => {
        return growth >= 0 ? styles.positive : styles.negative;
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'user':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                );
            case 'consultation':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                );
            case 'rating':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                    </svg>
                );
            case 'sti':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                );
            default:
                return null;
        }
    }; const getGrowthIcon = (value) => {
        if (value > 0) {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.growthIcon}>
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7,7 17,7 17,17"></polyline>
                </svg>
            );
        } else if (value < 0) {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.growthIcon}>
                    <line x1="7" y1="7" x2="17" y2="17"></line>
                    <polyline points="17,7 17,17 7,17"></polyline>
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.growthIcon}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        );
    }; const handleExportPDF = async () => {
        if (stats) {
            try {
                setExportLoading(prev => ({ ...prev, pdf: true }));
                await exportToPDF(stats);
            } catch (error) {
                console.error('Export PDF failed:', error);
            } finally {
                setExportLoading(prev => ({ ...prev, pdf: false }));
            }
        }
    };

    const handleExportExcel = async () => {
        if (stats) {
            try {
                setExportLoading(prev => ({ ...prev, excel: true }));
                await exportToExcel(stats);
            } catch (error) {
                console.error('Export Excel failed:', error);
            } finally {
                setExportLoading(prev => ({ ...prev, excel: false }));
            }
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải thống kê...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p>{error}</p>
                <button onClick={fetchStats} className={styles.retryBtn}>
                    Thử lại
                </button>
            </div>
        );
    } return (
        <div className={styles.adminStats}>
            {/* Dashboard Header */}
            <div className={styles.dashboardHeader}>
                <div className={styles.headerTitle}>
                    <h1>Dashboard Admin</h1>
                    <span className={styles.lastUpdated}>
                        Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
                    </span>
                </div>
                <div className={styles.exportButtons}>
                    <button
                        onClick={handleExportPDF}
                        className={`${styles.exportBtn} ${styles.pdfBtn}`} disabled={loading || exportLoading.pdf}
                    >
                        {exportLoading.pdf ? (
                            <div className={styles.spinner}></div>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10,9 9,9 8,9"></polyline>
                            </svg>
                        )}
                        {exportLoading.pdf ? 'Đang xuất...' : 'Xuất PDF'}
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className={`${styles.exportBtn} ${styles.excelBtn}`}
                        disabled={loading || exportLoading.excel}
                    >
                        {exportLoading.excel ? (
                            <div className={styles.spinner}></div>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <rect x="8" y="13" width="8" height="7"></rect>
                            </svg>
                        )}
                        {exportLoading.excel ? 'Đang xuất...' : 'Xuất Excel'}
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIcon} style={{ backgroundColor: '#dbeafe', color: '#3b82f6' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>                        <div className={styles.cardTitle}>Tổng người dùng</div>
                    </div>
                    <div className={styles.cardValue}>{formatNumber(stats.totalUsers)}</div>
                    <div className={styles.cardSubtitle}>
                        Trong đó: {formatNumber(stats.totalConsultants)} tư vấn viên
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIcon} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>                        <div className={styles.cardTitle}>Tư vấn</div>
                    </div>
                    <div className={styles.cardValue}>{formatNumber(stats.totalConsultations)}</div>
                    <div className={styles.cardSubtitle}>
                        Tổng số buổi tư vấn
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIcon} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                            </svg>
                        </div>
                        <div className={styles.cardTitle}>Xét nghiệm STI</div>
                    </div>
                    <div className={styles.cardValue}>{formatNumber(stats.totalSTITests)}</div>
                    <div className={styles.cardSubtitle}>
                        Tổng số lượt xét nghiệm
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIcon} style={{ backgroundColor: '#dcfdf4', color: '#059669' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <path d="m16 8 4-4-4-4"></path>
                            </svg>
                        </div>
                        <div className={styles.cardTitle}>Tổng doanh thu</div>
                    </div>
                    <div className={styles.cardValue}>{formatCurrency(stats.totalRevenue)}</div>                    <div className={styles.cardSubtitle}>
                        Doanh thu từ trước đến nay
                    </div>
                </div>
            </div>            {/* Business KPIs Section */}
            <div className={styles.businessKPIsSection}>
                <div className={styles.sectionHeader}>
                    <h3>Chỉ số kinh doanh quan trọng</h3>
                    <span className={styles.sectionSubtitle}>Theo dõi hiệu quả hoạt động kinh doanh</span>
                </div>
                <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiHeader}>
                            <div className={styles.kpiIcon} style={{ backgroundColor: '#ede9fe', color: '#8b5cf6' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v20m0-20c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path>
                                    <path d="M8 12h8"></path>
                                    <path d="M12 8v8"></path>
                                </svg>
                            </div>
                            <div className={styles.kpiTitle}>Giá trị đơn hàng TB</div>
                        </div>
                        <div className={styles.kpiValue}>{formatCurrency(stats.averageOrderValue)}</div>
                        <div className={styles.kpiDescription}>Average Order Value</div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiHeader}>
                            <div className={styles.kpiIcon} style={{ backgroundColor: '#fecaca', color: '#ef4444' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div className={styles.kpiTitle}>Doanh thu/Người dùng</div>
                        </div>
                        <div className={styles.kpiValue}>{formatCurrency(stats.revenuePerUser)}</div>
                        <div className={styles.kpiDescription}>Revenue Per User</div>                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiHeader}>
                            <div className={styles.kpiIcon} style={{ backgroundColor: '#c6f6d5', color: '#38a169' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                            </div>
                            <div className={styles.kpiTitle}>Tỷ lệ giữ chân KH</div>
                        </div>
                        <div className={styles.kpiValue}>{formatPercentage(stats.customerRetentionRate)}</div>
                        <div className={styles.kpiDescription}>Customer Retention (30d)</div>
                    </div>                    <div className={styles.kpiCard}>
                        <div className={styles.kpiHeader}>
                            <div className={styles.kpiIcon} style={{ backgroundColor: '#bee3f8', color: '#3182ce' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </div>
                            <div className={styles.kpiTitle}>Tăng trưởng DT</div>
                        </div>
                        <div className={`${styles.kpiValue} ${getGrowthColor(stats.revenueGrowthRate)}`}>
                            {getGrowthIcon(stats.revenueGrowthRate)}
                            {stats.revenueGrowthRate >= 0 ? '+' : ''}{stats.revenueGrowthRate?.toFixed(1)}%
                        </div>
                        <div className={styles.kpiDescription}>
                            So với tháng trước
                            <div className={styles.tooltip}>
                                <span className={styles.tooltipIcon}>ℹ️</span>
                                <div className={styles.tooltipContent}>
                                    <strong>Tăng trưởng doanh thu</strong><br />
                                    So sánh doanh thu tháng hiện tại với tháng trước.<br />
                                    <span className={styles.positive}>Màu xanh: Tăng trưởng</span><br />
                                    <span className={styles.negative}>Màu đỏ: Giảm sút</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <RevenueChart />

            {/* Activity Feed and Revenue Distribution */}
            <div className={styles.bottomSection}>
                <ActivityFeed />
                <RevenuePieChart />
            </div>

            {/* Top Stats Tables */}
            <div className={styles.topStatsSection}>
                <div className={styles.topStatsGrid}>
                    <TopConsultants />
                    <TopSTIServices />
                    <TopSTIPackages />
                </div>
            </div>
        </div>
    );
};

export default AdminStats;
