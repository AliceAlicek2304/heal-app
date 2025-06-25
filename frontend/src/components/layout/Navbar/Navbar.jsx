import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegisterForm from "../../auth/Register/RegisterForm";
import LoginForm from "../../auth/Login/LoginForm";
import { useAuth } from "../../../contexts/AuthContext";
import { authService } from "../../../services/authService";
import { searchService } from "../../../services/searchService";
import ForgotPassword from "../../auth/ForgotPassword/ForgotPassword";
import styles from "./Navbar.module.css";

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    const suggestionsTimeoutRef = useRef(null);

    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (suggestionsTimeoutRef.current) {
                clearTimeout(suggestionsTimeoutRef.current);
            }
        };
    }, []);    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=all`);
            setShowSuggestions(false);
            setShowMobileMenu(false);
        }
    };

    const handleSearchInputChange = async (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        // Clear previous timeout
        if (suggestionsTimeoutRef.current) {
            clearTimeout(suggestionsTimeoutRef.current);
        }

        if (value.trim().length >= 2) {
            // Debounce search suggestions
            suggestionsTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await searchService.getSearchSuggestions(value.trim());
                    if (response.success) {
                        setSearchSuggestions(response.data);
                        setShowSuggestions(true);
                    }
                } catch (error) {
                    // Silently fail for suggestions
                    setSearchSuggestions([]);
                }
            }, 300);
        } else {
            setSearchSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion);
        navigate(`/search?q=${encodeURIComponent(suggestion)}&type=all`);
        setShowSuggestions(false);
        setShowMobileMenu(false);
    };

    const handleSearchFocus = () => {
        if (searchSuggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handleLogin = () => {
        setShowLoginModal(true);
        setShowRegisterModal(false);
        setShowMobileMenu(false);
    };

    const handleRegister = () => {
        setShowRegisterModal(true);
        setShowLoginModal(false);
        setShowMobileMenu(false);
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
        setShowLoginModal(false);
    };

    const handleOpenForgotPassword = () => {
        setShowLoginModal(false);
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

    const toggleMobileMenu = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    const getDisplayName = (user) => {
        return user?.fullName || user?.username || 'User';
    };

    // Helper lấy avatar URL thống nhất (giống authService)
    const getAvatarUrl = (avatarPath) => {
        return authService.getAvatarUrl(avatarPath);
    };

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.navbarContainer}>
                    {/* Logo */}
                    <div className={styles.navbarLogo}>
                        <Link to="/" className={styles.logoLink}>
                            <img src="/logo.png" alt="HealApp" className={styles.logoImg} />
                            <span className={styles.logoText}>HealApp</span>
                        </Link>
                    </div>                    {/* Search Bar */}
                    <div className={styles.navbarSearch} ref={searchRef}>
                        <form onSubmit={handleSearch} className={styles.searchForm}>
                            <input
                                type="text"
                                placeholder="Tìm kiếm dịch vụ, bài viết..."
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                onFocus={handleSearchFocus}
                                className={styles.searchInput}
                            />
                            <button type="submit" className={styles.searchButton}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="M21 21l-4.35-4.35"></path>
                                </svg>
                            </button>
                        </form>
                        
                        {/* Search Suggestions */}
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div className={styles.searchSuggestions}>
                                {searchSuggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className={styles.suggestionItem}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <path d="M21 21l-4.35-4.35"></path>
                                        </svg>
                                        {suggestion}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Navigation Menu */}
                    <div className={`${styles.navbarMenu} ${showMobileMenu ? styles.open : ''}`}>
                        <ul className={styles.navLinks}>
                            <li>
                                <Link to="/sti-testing" className={styles.navLink} onClick={() => setShowMobileMenu(false)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Xét nghiệm STIs
                                </Link>
                            </li>
                            <li>
                                <Link to="/consultation" className={styles.navLink} onClick={() => setShowMobileMenu(false)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    Tư vấn
                                </Link>
                            </li>
                            <li>
                                <Link to="/menstrual-cycle" className={styles.navLink} onClick={() => setShowMobileMenu(false)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    Chu kỳ kinh nguyệt
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className={styles.navLink} onClick={() => setShowMobileMenu(false)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14,2 14,8 20,8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10,9 9,9 8,9"></polyline>
                                    </svg>
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link to="/questions" className={styles.navLink} onClick={() => setShowMobileMenu(false)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"></path>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    Đặt câu hỏi
                                </Link>
                            </li>                        </ul>

                        {/* Mobile Search */}
                        <div className={styles.mobileSearch}>
                            <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={handleSearchInputChange}
                                    className={styles.mobileSearchInput}
                                />
                                <button type="submit" className={styles.mobileSearchButton}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="M21 21l-4.35-4.35"></path>
                                    </svg>
                                </button>
                            </form>
                        </div>

                        {/* Mobile Auth Buttons */}
                        {!isAuthenticated && (
                            <div className={styles.mobileAuth}>
                                <button className={styles.btnLogin} onClick={handleLogin}>
                                    Đăng nhập
                                </button>
                                <button className={styles.btnRegister} onClick={handleRegister}>
                                    Đăng ký
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Auth Section */}
                    <div className={styles.navbarAuth}>
                        {isAuthenticated && user ? (
                            <div className={styles.userMenu} ref={dropdownRef}>
                                <button
                                    className={styles.userAvatarBtn}
                                    onClick={toggleUserDropdown}
                                >
                                    <img
                                        src={getAvatarUrl(user?.avatar)}
                                        alt={getDisplayName(user)}
                                        className={styles.userAvatar}
                                        onError={(e) => {
                                            const backendDefault = getAvatarUrl();
                                            if (e.target.src !== backendDefault) {
                                                e.target.src = backendDefault;
                                            }
                                        }}
                                    />
                                    <span className={styles.userName}>{getDisplayName(user)}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.dropdownArrow}>
                                        <polyline points="6,9 12,15 18,9"></polyline>
                                    </svg>
                                </button>

                                {showUserDropdown && (
                                    <div className={styles.userDropdown}>
                                        <div className={styles.dropdownHeader}>
                                            <img
                                                src={getAvatarUrl(user?.avatar)}
                                                alt={getDisplayName(user)}
                                                className={styles.dropdownAvatar}
                                                onError={(e) => {
                                                    const backendDefault = getAvatarUrl();
                                                    if (e.target.src !== backendDefault) {
                                                        e.target.src = backendDefault;
                                                    }
                                                }}
                                            />
                                            <div className={styles.dropdownUserInfo}>
                                                <h4>{getDisplayName(user)}</h4>
                                                <p>{user.email}</p>
                                                {user.role && <span className={styles.userRole}>{user.role}</span>}
                                            </div>
                                        </div>

                                        <div className={styles.dropdownMenu}>
                                            <Link to="/profile" className={styles.dropdownItem} onClick={() => setShowUserDropdown(false)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                                Thông tin cá nhân
                                            </Link>
                                            <Link to="/profile/security" className={styles.dropdownItem} onClick={() => setShowUserDropdown(false)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                                                </svg>
                                                Bảo mật
                                            </Link>
                                            <Link to="/profile/menstrual-history" className={styles.dropdownItem} onClick={() => setShowUserDropdown(false)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                Lịch sử chu kỳ
                                            </Link>
                                            <hr className={styles.dropdownDivider} />
                                            <button
                                                onClick={handleLogout}
                                                className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                                    <polyline points="16,17 21,12 16,7"></polyline>
                                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                                </svg>
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.authButtons}>
                                <button className={styles.btnLogin} onClick={handleLogin}>
                                    Đăng nhập
                                </button>
                                <button className={styles.btnRegister} onClick={handleRegister}>
                                    Đăng ký
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className={styles.mobileToggle} onClick={toggleMobileMenu}>
                        <span className={`${styles.hamburger} ${showMobileMenu ? styles.open : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>
                </div>
            </nav>

            {/* Modals */}
            {showRegisterModal && (
                <div className={styles.modalOverlay} onClick={handleCloseModals}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <RegisterForm
                            onClose={handleCloseModals}
                            onSwitchToLogin={handleSwitchToLogin}
                        />
                    </div>
                </div>
            )}

            {showLoginModal && (
                <div className={styles.modalOverlay} onClick={handleCloseModals}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <LoginForm
                            onClose={handleCloseModals}
                            onSwitchToRegister={handleRegister}
                            onLoginSuccess={handleLoginSuccess}
                            onSwitchToForgotPassword={handleOpenForgotPassword}
                        />
                    </div>
                </div>
            )}

            {showForgotPasswordModal && (
                <div className={styles.modalOverlay} onClick={handleCloseForgotPassword}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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