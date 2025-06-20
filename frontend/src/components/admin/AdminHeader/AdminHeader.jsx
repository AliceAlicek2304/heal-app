import React from 'react';
import styles from './AdminHeader.module.css';

const AdminHeader = ({ onToggleSidebar, sidebarCollapsed, activeSection }) => {
    const getSectionTitle = (section) => {
        const titles = {
            dashboard: 'Thống kê tổng quan',
            users: 'Quản lý người dùng',
            consultations: 'Quản lý tư vấn',
            'sti-services': 'Quản lý dịch vụ STI',
            ratings: 'Quản lý đánh giá',
            blog: 'Quản lý blog'
        };
        return titles[section] || 'Admin Dashboard';
    };

    const getCurrentTime = () => {
        return new Date().toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button 
                    className={styles.toggleBtn}
                    onClick={onToggleSidebar}
                    title={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <div className={styles.headerTitle}>
                    <h1>{getSectionTitle(activeSection)}</h1>
                    <p className={styles.timestamp}>{getCurrentTime()}</p>
                </div>
            </div>

            <div className={styles.headerRight}>
                <div className={styles.statusIndicator}>
                    <div className={styles.statusDot}></div>
                    <span>Hệ thống hoạt động</span>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
