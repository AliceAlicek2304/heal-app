import React, { useState, useEffect } from 'react';
import { getRecentActivities } from '../../../services/adminStatsService';
import Pagination from '../../common/Pagination/Pagination';
import styles from './ActivityFeed.module.css';

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(20); // Tăng limit để lấy nhiều dữ liệu hơn
    const itemsPerPage = 10; // Hiển thị 10 items mỗi trang

    useEffect(() => {
        fetchActivities();

        // Auto refresh every 30 seconds
        const interval = setInterval(fetchActivities, 30000);
        return () => clearInterval(interval);
    }, []); const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getRecentActivities(limit);

            // Đảm bảo data luôn là array
            if (Array.isArray(data)) {
                setActivities(data);
            } else {
                console.warn('Invalid activities data:', data);
                // Fallback to mock data when API response is invalid
                const mockActivities = [
                    {
                        id: 1,
                        type: 'user',
                        message: 'Người dùng mới đăng ký: nguyen.van.a@email.com',
                        time: '5 phút trước',
                        timestamp: new Date(Date.now() - 5 * 60 * 1000)
                    },
                    {
                        id: 2,
                        type: 'consultation',
                        message: 'Buổi tư vấn mới được đặt với BS. Trần Văn B',
                        time: '12 phút trước',
                        timestamp: new Date(Date.now() - 12 * 60 * 1000)
                    },
                    {
                        id: 3,
                        type: 'payment',
                        message: 'Thanh toán thành công cho dịch vụ STI - 500,000 VND',
                        time: '25 phút trước',
                        timestamp: new Date(Date.now() - 25 * 60 * 1000)
                    }
                ];
                setActivities(mockActivities);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            setError('API chưa được implement hoàn toàn. Hiển thị dữ liệu mẫu.');

            // Fallback to mock data on error
            const mockActivities = [
                {
                    id: 1,
                    type: 'user',
                    message: 'Người dùng mới đăng ký: nguyen.van.a@email.com',
                    time: '5 phút trước',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000)
                },
                {
                    id: 2,
                    type: 'consultation',
                    message: 'Buổi tư vấn mới được đặt với BS. Trần Văn B',
                    time: '12 phút trước',
                    timestamp: new Date(Date.now() - 12 * 60 * 1000)
                }, {
                    id: 3,
                    type: 'payment',
                    message: 'Thanh toán thành công cho dịch vụ STI - 500,000 VND',
                    time: '25 phút trước',
                    timestamp: new Date(Date.now() - 25 * 60 * 1000)
                }
            ];
            setActivities(mockActivities);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'user':
                return '👤';
            case 'consultation':
                return '💬';
            case 'payment':
                return '💳';
            case 'sti':
                return '🧪';
            default:
                return '📋';
        }
    };    // Pagination logic
    const totalPages = Math.ceil(activities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentActivities = activities.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading && activities.length === 0) {
        return (
            <div className={styles.activityFeed}>
                <div className={styles.header}>
                    <h3>Hoạt động gần đây</h3>
                </div>
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                    <span>Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.activityFeed}>
            <div className={styles.header}>
                <h3>Hoạt động gần đây</h3>
                <button onClick={fetchActivities} className={styles.refreshBtn} disabled={loading}>
                    🔄
                </button>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={fetchActivities} className={styles.retryBtn}>
                        Thử lại
                    </button>
                </div>
            )}

            <div className={styles.activitiesList}>
                {currentActivities.length === 0 ? (
                    <div className={styles.noActivity}>
                        <span>Không có hoạt động gần đây</span>
                    </div>
                ) : (
                    currentActivities.map((activity, index) => (
                        <div key={index} className={styles.activityItem}>
                            <div className={styles.activityIcon}>
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className={styles.activityContent}>
                                <div className={styles.activityMessage}>
                                    {activity.message}
                                </div>
                                <div className={styles.activityTime}>
                                    {activity.time}
                                </div>
                            </div>
                        </div>
                    ))
                )}            </div>

            {/* Pagination */}
            {activities.length > itemsPerPage && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {loading && activities.length > 0 && (
                <div className={styles.refreshing}>
                    Đang cập nhật...
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
