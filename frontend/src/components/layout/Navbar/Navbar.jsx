import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import RegisterForm from "../../auth/Register/RegisterForm";
import LoginForm from "../../auth/Login/LoginForm";
import { useAuth } from "../../../contexts/AuthContext";
import { authService } from "../../../services/authService";
import ForgotPassword from "../../auth/ForgotPassword/ForgotPassword";
import "./Navbar.css";

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const dropdownRef = useRef(null);

    // Sử dụng AuthContext
    const { user, logout, isAuthenticated } = useAuth();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Tìm kiếm:", searchQuery);
    };

    const handleLogin = () => {
        setShowLoginModal(true);
        setShowRegisterModal(false);
    };

    const handleRegister = () => {
        setShowRegisterModal(true);
        setShowLoginModal(false);
    };

    const handleCloseModals = () => {
        setShowRegisterModal(false);
        setShowLoginModal(false);
    };

    const handleSwitchToLogin = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    const handleSwitchToRegister = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const handleLoginSuccess = () => {
        // Modal sẽ tự động đóng và navbar sẽ update qua AuthContext
        setShowLoginModal(false);
    };

    const handleOpenForgotPassword = () => {
        setShowLoginModal(false); // Đóng modal login
        setShowRegisterModal(false);
        setShowForgotPasswordModal(true);
    };

    const handleCloseForgotPassword = () => {
        setShowForgotPasswordModal(false);
    };

    const handleSwitchToLoginFromForgot = () => {
        setShowForgotPasswordModal(false);
        setShowLoginModal(true);
    };

    const handleLogout = () => {
        logout();
        setShowUserDropdown(false);
    };

    const toggleUserDropdown = () => {
        setShowUserDropdown(!showUserDropdown);
    };

    // Get display name - ưu tiên fullName, fallback về username
    const getDisplayName = (user) => {
        return user?.fullName || user?.username || 'User';
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    {/* Logo */}
                    <div className="navbar-logo">
                        <Link to="/" className="navbar-logo">
                            <img src="/logo.png" alt="HealApp" className="logo-img" />
                            <span className="logo-text">HealApp</span>
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="navbar-search">
                        <form onSubmit={handleSearch} className="search-form">
                            <input
                                type="text"
                                placeholder="Tìm kiếm dịch vụ, bài viết..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="search-button">
                                <i className="search-icon">🔍</i>
                            </button>
                        </form>
                    </div>

                    {/* Navigation Menu */}
                    <div className="navbar-menu">
                        <ul className="nav-links">
                            <li><a href="#sti-testing" className="nav-link">Xét nghiệm STIs</a></li>
                            <li><a href="#consultation" className="nav-link">Tư vấn</a></li>
                            <li><Link to="/menstrual-cycle" className="nav-link">Tính chu kỳ kinh nguyệt</Link></li>
                            <li><Link to="/blog" className="nav-link">Blog</Link></li>
                            <li><Link to="/questions" className="nav-link">Đặt câu hỏi</Link></li>
                        </ul>
                    </div>

                    {/* Auth Section */}
                    <div className="navbar-auth">
                        {isAuthenticated && user ? (
                            // User đã đăng nhập - hiển thị avatar và dropdown
                            <div className="user-menu" ref={dropdownRef}>
                                <button
                                    className="user-avatar-btn"
                                    onClick={toggleUserDropdown}
                                >
                                    <img
                                        src={authService.getAvatarUrl(user.avatar)}
                                        alt={getDisplayName(user)}
                                        className="user-avatar"
                                        onError={(e) => {
                                            e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                                        }}
                                    />
                                    <span className="user-name">{getDisplayName(user)}</span>
                                    <span className="dropdown-arrow">▼</span>
                                </button>

                                {showUserDropdown && (
                                    <div className="user-dropdown">
                                        <div className="dropdown-header">
                                            <img
                                                src={authService.getAvatarUrl(user.avatar)}
                                                alt={getDisplayName(user)}
                                                className="dropdown-avatar"
                                                onError={(e) => {
                                                    e.target.src = authService.getAvatarUrl('/img/avatar/default.jpg');
                                                }}
                                            />
                                            <div className="dropdown-user-info">
                                                <h4>{getDisplayName(user)}</h4>
                                                <p>{user.email}</p>
                                                {user.role && <span className="user-role">{user.role}</span>}
                                            </div>
                                        </div>

                                        <div className="dropdown-menu">
                                            <Link to="/profile" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                                                <span className="dropdown-icon">👤</span>
                                                Thông tin cá nhân
                                            </Link>
                                            <Link to="/profile/security" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                                                <span className="dropdown-icon">⚙️</span>
                                                Bảo mật
                                            </Link>
                                            <Link to="/profile/menstrual-history" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                                                <span className="dropdown-icon">📋</span>
                                                Lịch sử chu kỳ
                                            </Link>
                                            <hr className="dropdown-divider" />
                                            <button
                                                onClick={handleLogout}
                                                className="dropdown-item logout-btn"
                                            >
                                                <span className="dropdown-icon">🚪</span>
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // User chưa đăng nhập - hiển thị nút đăng nhập/đăng ký
                            <>
                                <button className="btn-login" onClick={handleLogin}>
                                    Đăng nhập
                                </button>
                                <button className="btn-register" onClick={handleRegister}>
                                    Đăng ký
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Register Modal */}
            {showRegisterModal && (
                <div className="modal-overlay" onClick={handleCloseModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <RegisterForm
                            onClose={handleCloseModals}
                            onSwitchToLogin={handleSwitchToLogin}
                        />
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className="modal-overlay" onClick={handleCloseModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <LoginForm
                            onClose={handleCloseModals}
                            onSwitchToRegister={handleRegister}
                            onLoginSuccess={handleLoginSuccess}
                            onSwitchToForgotPassword={handleOpenForgotPassword}
                        />
                    </div>
                </div>
            )}

            {/* Forgot Password Modal */}
            {showForgotPasswordModal && (
                <div className="modal-overlay" onClick={handleCloseForgotPassword}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <ForgotPassword
                            onClose={handleCloseForgotPassword}
                            onSwitchToLogin={handleSwitchToLoginFromForgot}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;