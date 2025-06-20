import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './AdminSidebar.module.css';

const AdminSidebar = ({ activeSection, onSectionChange, collapsed }) => {
    const { user, logout } = useAuth();

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Thống kê',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            )
        }, {
            id: 'users',
            label: 'Người dùng',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            )
        },
        {
            id: 'consultants',
            label: 'Chuyên viên',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    <circle cx="12" cy="11" r="2"></circle>
                    <path d="M15 18a3 3 0 1 0-6 0"></path>
                </svg>
            )
        },
        {
            id: 'consultations',
            label: 'Tư vấn',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            )
        }, {
            id: 'sti-services',
            label: 'Dịch vụ STI',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
            )
        },
        {
            id: 'sti-packages',
            label: 'Gói STI',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <rect x="7" y="7" width="3" height="9"></rect>
                    <rect x="14" y="7" width="3" height="5"></rect>
                </svg>
            )
        },
        {
            id: 'sti-tests',
            label: 'STI Tests',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                    <line x1="9" y1="1" x2="9" y2="4"></line>
                    <line x1="15" y1="1" x2="15" y2="4"></line>
                </svg>
            )
        },
        {
            id: 'ratings',
            label: 'Đánh giá',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
                </svg>
            )
        },
        {
            id: 'blog',
            label: 'Blog',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
            )
        }
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.sidebarHeader}>
                <div className={styles.logo}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    {!collapsed && <span>HealApp Admin</span>}
                </div>
            </div>

            <nav className={styles.nav}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
                        onClick={() => onSectionChange(item.id)}
                        title={collapsed ? item.label : ''}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                    </button>
                ))}
            </nav>

            <div className={styles.sidebarFooter}>
                <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                        {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
                    </div>
                    {!collapsed && (
                        <div className={styles.userDetails}>
                            <div className={styles.userName}>
                                {user?.fullName || user?.username}
                            </div>
                            <div className={styles.userRole}>Administrator</div>
                        </div>
                    )}
                </div>
                <button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                    title={collapsed ? 'Đăng xuất' : ''}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
// This code defines the AdminSidebar component for the admin dashboard.