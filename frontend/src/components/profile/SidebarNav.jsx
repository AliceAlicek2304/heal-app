import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import styles from './SidebarNav.module.css';

const SidebarNav = ({ activeTab }) => {
    const { user } = useAuth();
    const avatarUrl = user?.avatar ? authService.getAvatarUrl(user.avatar) : '/img/avatar/default.jpg';

    // Kiểm tra role của user
    const isStaff = user?.role === 'STAFF';
    const isConsultant = user?.role === 'CONSULTANT';
    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className={styles.sidebarNav}>
            <div className={styles.userInfo}>
                <div className={styles.avatarContainer}>
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className={styles.avatar}
                        onError={(e) => {
                            e.target.src = '/img/avatar/default.jpg';
                        }}
                    />
                    <div className={styles.onlineIndicator}></div>
                </div>
                <h3 className={styles.userName}>{user?.fullName || 'Người dùng'}</h3>
                <p className={styles.userEmail}>{user?.email || ''}</p>
                {(isStaff || isConsultant || isAdmin) && (
                    <div className={styles.roleBadge}>
                        <span className={`${styles.roleIndicator} ${styles[user?.role?.toLowerCase()]}`}>
                            {user?.role === 'STAFF' && (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="8.5" cy="7" r="4"></circle>
                                        <line x1="20" y1="8" x2="20" y2="14"></line>
                                        <line x1="23" y1="11" x2="17" y2="11"></line>
                                    </svg>
                                    Nhân viên
                                </>
                            )}
                            {user?.role === 'CONSULTANT' && (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    Tư vấn viên
                                </>
                            )}
                            {user?.role === 'ADMIN' && (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"></path>
                                    </svg>
                                    Quản trị viên
                                </>
                            )}
                        </span>
                    </div>
                )}
            </div>

            {/* Menu chung cho tất cả user */}
            <nav className={styles.navMenu}>
                <h4 className={styles.menuTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Tài khoản cá nhân
                </h4>
                <ul className={styles.menuList}>
                    <li className={activeTab === 'personal-info' ? styles.active : ''}>
                        <Link to="/profile" className={styles.menuLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Thông tin cá nhân</span>
                        </Link>
                    </li>
                    <li className={activeTab === 'security' ? styles.active : ''}>
                        <Link to="/profile/security" className={styles.menuLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <circle cx="12" cy="16" r="1"></circle>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>Bảo mật</span>
                        </Link>
                    </li>
                    <li className={activeTab === 'consultation-history' ? styles.active : ''}>
                        <Link to="/profile/consultation-history" className={styles.menuLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>Lịch sử tư vấn</span>
                        </Link>
                    </li>
                    <li className={activeTab === 'sti-history' ? styles.active : ''}>
                        <Link to="/profile/sti-history" className={styles.menuLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path>
                                <rect x="9" y="7" width="6" height="6" rx="1"></rect>
                                <path d="M12 1v6"></path>
                            </svg>
                            <span>Lịch sử xét nghiệm STI</span>
                        </Link>
                    </li>
                    <li className={activeTab === 'menstrual-history' ? styles.active : ''}>
                        <Link to="/profile/menstrual-history" className={styles.menuLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"></path>
                            </svg>
                            <span>Lịch sử chu kỳ</span>
                        </Link>
                    </li>
                    <li className={activeTab === 'blog-history' ? styles.active : ''}>
                        <Link to="/profile/blog-history" className={styles.menuLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10,9 9,9 8,9"></polyline>
                            </svg>
                            <span>Lịch sử bài viết</span>
                        </Link>
                    </li>
                    <li className={activeTab === 'my-questions' ? styles.active : ''}>
                        <Link to="/profile/my-questions" className={styles.menuLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span>Câu hỏi của tôi</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* Menu riêng cho STAFF */}
            {isStaff && (
                <nav className={`${styles.navMenu} ${styles.staffMenu}`}>
                    <h4 className={styles.menuTitle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        Quản lý nhân viên
                    </h4>
                    <ul className={styles.menuList}>
                        <li className={activeTab === 'manage-questions' ? styles.active : ''}>
                            <Link to="/profile/manage-questions" className={styles.menuLink}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <span>Trả lời câu hỏi</span>
                            </Link>
                        </li>
                        <li className={activeTab === 'manage-consultations' ? styles.active : ''}>
                            <Link to="/profile/manage-consultations" className={styles.menuLink}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>Quản lý lịch tư vấn</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            )}

            {/* Menu riêng cho CONSULTANT */}
            {isConsultant && (
                <nav className={`${styles.navMenu} ${styles.consultantMenu}`}>
                    <h4 className={styles.menuTitle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Tư vấn viên
                    </h4>
                    <ul className={styles.menuList}>
                        <li className={activeTab === 'manage-questions' ? styles.active : ''}>
                            <Link to="/profile/manage-questions" className={styles.menuLink}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <span>Trả lời câu hỏi</span>
                            </Link>
                        </li>
                        <li className={activeTab === 'consultant-schedule' ? styles.active : ''}>
                            <Link to="/profile/consultant-schedule" className={styles.menuLink}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>Lịch tư vấn của tôi</span>
                            </Link>
                        </li>
                        <li className={activeTab === 'consultation-reports' ? styles.active : ''}>
                            <Link to="/profile/consultation-reports" className={styles.menuLink}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14,2 14,8 20,8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                </svg>
                                <span>Báo cáo tư vấn</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            )}

            {/* Menu riêng cho ADMIN */}
            {isAdmin && (
                <nav className={`${styles.navMenu} ${styles.adminMenu}`}>
                    <h4 className={styles.menuTitle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"></path>
                        </svg>
                        Quản trị viên
                    </h4>
                    <ul className={styles.menuList}>
                        <li className={activeTab === 'admin-dashboard' ? styles.active : ''}>
                            <Link to="/profile/admin-dashboard" className={styles.menuLink}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                </svg>
                                <span>Bảng điều khiển</span>
                            </Link>
                        </li>
                        <li className={activeTab === 'user-management' ? styles.active : ''}>
                            <Link to="/profile/user-management" className={styles.menuLink}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <span>Quản lý người dùng</span>
                            </Link>
                        </li>
                        <li className={activeTab === 'system-settings' ? styles.active : ''}>
                            <Link to="/profile/system-settings" className={styles.menuLink}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                <span>Cài đặt hệ thống</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            )}

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <h4 className={styles.menuTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="10,8 16,12 10,16 10,8"></polygon>
                    </svg>
                    Thao tác nhanh
                </h4>
                <div className={styles.actionButtons}>
                    <Link to="/sti-testing" className={styles.actionBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path>
                            <rect x="9" y="7" width="6" height="6" rx="1"></rect>
                            <path d="M12 1v6"></path>
                        </svg>
                        <span>Đặt lịch STI Test</span>
                    </Link>
                    <Link to="/consultation" className={styles.actionBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Đặt lịch tư vấn</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SidebarNav;