import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaKey, FaEye, FaFilter, FaSearch, FaUsers, FaUserShield, FaUserMd } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import adminService from '../../../services/adminService';
import { formatDate } from '../../../utils/dateUtils';
import UserModal from './UserModal';
import ResetPasswordModal from './ResetPasswordModal';
import Pagination from '../../common/Pagination/Pagination';
import styles from './UserManagement.module.css';

const ITEMS_PER_PAGE = 15;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [availableRoles, setAvailableRoles] = useState([]);
    const [userStats, setUserStats] = useState({});    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [showUserModal, setShowUserModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // create, edit, view

    const { addToast } = useToast();

    // Helper function to build avatar URL
    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null;

        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

        // If avatarPath already includes http/https, return as is
        if (avatarPath.startsWith('http')) {
            return avatarPath;
        }

        // If avatarPath starts with /, remove it to avoid double slash
        const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;

        return `${API_BASE_URL}/${cleanPath}`;
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, selectedRole, searchTerm]);

    useEffect(() => {
        paginateUsers();
    }, [filteredUsers, currentPage]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadUsers(),
                loadAvailableRoles(),
                loadUserStats()
            ]);
        } catch (error) {
            addToast('Lỗi khi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await adminService.users.getAll();
            setUsers(Array.isArray(data) ? data : []);
            setFilteredUsers(Array.isArray(data) ? data : []);
            setTotalPages(Math.ceil(Array.isArray(data) ? data.length / ITEMS_PER_PAGE : 0));
            return data;
        } catch (error) {
            console.error('Error loading users:', error);
            addToast('Không thể tải danh sách người dùng', 'error');
            setUsers([]);
            setFilteredUsers([]);
            setTotalPages(0);
            return [];
        }
    };

    const loadAvailableRoles = async () => {
        try {
            const data = await adminService.users.getRoles();
            setAvailableRoles(Array.isArray(data) ? data : []);
            return data;
        } catch (error) {
            console.error('Error loading roles:', error);
            addToast('Không thể tải danh sách vai trò', 'error');
            setAvailableRoles([]);
            return [];
        }
    };

    const loadUserStats = async () => {
        try {
            const data = await adminService.users.getCountByRole();
            setUserStats(data || {});
            return data;
        } catch (error) {
            console.error('Error loading user stats:', error);
            addToast('Không thể tải thống kê người dùng', 'error');
            setUserStats({});
            return {};
        }
    };

    const filterUsers = () => {
        if (!Array.isArray(users)) {
            setFilteredUsers([]);
            return;
        }

        let filtered = [...users];

        // Filter by role
        if (selectedRole) {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.username?.toLowerCase().includes(term) ||
                user.fullName?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.phone?.includes(term)
            );
        }

        // Sort by newest first (createdAt or id descending)
        filtered.sort((a, b) => {
            // Try createdAt first, then fall back to id
            const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);

            if (aDate.getTime() !== bDate.getTime()) {
                return bDate.getTime() - aDate.getTime(); // Newest first
            }

            // Fall back to id if dates are equal
            return (b.id || 0) - (a.id || 0);
        });

        setFilteredUsers(filtered);
        // Reset to page 1 when filter changes
        setCurrentPage(1);
    };

    const handleCreateUser = () => {
        setSelectedUser(null);
        setModalMode('create');
        setShowUserModal(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setModalMode('edit');
        setShowUserModal(true);
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setModalMode('view');
        setShowUserModal(true);
    };

    const handleResetPassword = (user) => {
        setSelectedUser(user);
        setShowPasswordModal(true);
    };

    const handleUserSaved = () => {
        setShowUserModal(false);
        loadUsers();
        loadUserStats();
    };

    const handlePasswordReset = () => {
        setShowPasswordModal(false);
        addToast('Đặt lại mật khẩu thành công', 'success');
    }; const toggleUserStatus = async (user) => {
        try {
            // Chỉ gửi role và isActive như backend yêu cầu
            const updatedData = {
                role: user.role,
                isActive: !user.isActive
            };
            await adminService.users.update(user.id, updatedData);
            addToast(
                `${user.fullName || user.username} đã ${!user.isActive ? 'kích hoạt' : 'khóa'} thành công`,
                'success'
            );
            loadUsers();
            loadUserStats();
        } catch (error) {
            console.error('Error toggling user status:', error);
            addToast('Không thể cập nhật trạng thái người dùng', 'error');
        }
    };    // Pagination logic
    const paginateUsers = () => {
        setTotalPages(Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const paginatedUsersData = () => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredUsers.slice(start, end);
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className={styles.userManagement}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>Quản lý người dùng</h2>
                <button className={styles.createButton} onClick={handleCreateUser}>
                    <FaPlus />
                    Thêm người dùng
                </button>            </div>

            {/* Stats */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FaUsers /></div>
                    <div className={styles.statInfo}>
                        <h3>{userStats.CUSTOMER || 0}</h3>
                        <p>Khách hàng</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FaUsers /></div>
                    <div className={styles.statInfo}>
                        <h3>{userStats.STAFF || 0}</h3>
                        <p>Nhân viên</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FaUserMd /></div>
                    <div className={styles.statInfo}>
                        <h3>{userStats.CONSULTANT || 0}</h3>
                        <p>Chuyên viên</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FaUserShield /></div>
                    <div className={styles.statInfo}>
                        <h3>{userStats.ADMIN || 0}</h3>
                        <p>Quản trị viên</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchContainer}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.roleFilter}>
                    <FaFilter className={styles.filterIcon} />
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className={styles.roleSelect}
                    >
                        <option value="">Tất cả vai trò</option>
                        {Array.isArray(availableRoles) && availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className={styles.tableContainer}>
                <table className={styles.usersTable}>
                    <thead>
                        <tr>
                            <th>Thông tin người dùng</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className={styles.noData}>
                                    Không tìm thấy người dùng nào
                                </td>
                            </tr>
                        ) : (
                            paginatedUsersData().map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className={styles.userInfo}>                                            <div className={styles.avatar}>
                                            {user.avatar ? (
                                                <img
                                                    src={getAvatarUrl(user.avatar)}
                                                    alt={user.fullName || user.username}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className={styles.avatarPlaceholder}
                                                style={{ display: user.avatar ? 'none' : 'flex' }}
                                            >
                                                {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                                            </div>
                                        </div>
                                            <div className={styles.userDetails}>
                                                <div className={styles.userName}>{user.fullName || user.username}</div>
                                                <div className={styles.userContact}>
                                                    <span>{user.email}</span>
                                                    {user.phone && <span> • {user.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${styles[user.role?.toLowerCase()]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive}`}
                                            onClick={() => toggleUserStatus(user)}
                                        >
                                            {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                                        </span>
                                    </td>
                                    <td>{formatDate(user.createdDate)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleViewUser(user)}
                                                title="Xem chi tiết"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleEditUser(user)}
                                                title="Chỉnh sửa"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleResetPassword(user)}
                                                title="Đặt lại mật khẩu"
                                            >
                                                <FaKey />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Modals */}
            {showUserModal && (
                <UserModal
                    user={selectedUser}
                    mode={modalMode}
                    availableRoles={availableRoles}
                    onSave={handleUserSaved}
                    onClose={() => setShowUserModal(false)}
                />
            )}

            {showPasswordModal && (
                <ResetPasswordModal
                    user={selectedUser}
                    onReset={handlePasswordReset}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}
        </div>
    );
};

export default UserManagement;
