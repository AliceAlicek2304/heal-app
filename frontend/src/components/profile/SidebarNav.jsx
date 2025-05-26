import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaLock, FaHeartbeat, FaRegNewspaper,FaQuestionCircle } from 'react-icons/fa';
import './SidebarNav.css';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const SidebarNav = ({ activeTab }) => {
    const { user } = useAuth();
    const avatarUrl = user?.avatar ? authService.getAvatarUrl(user.avatar) : '/img/avatar/default.jpg';

    return (
        <div className="sidebar-nav">
            <div className="user-info">
                <div className="avatar-container">
                    <img src={avatarUrl} alt="Avatar" className="avatar" />
                </div>
                <h3>{user?.fullName || 'Người dùng'}</h3>
                <p>{user?.email || ''}</p>
            </div>

            <nav className="nav-menu">
                <ul>
                    <li className={activeTab === 'personal-info' ? 'active' : ''}>
                        <Link to="/profile">
                            <FaUser /> Thông tin cá nhân
                        </Link>
                    </li>
                    <li className={activeTab === 'security' ? 'active' : ''}>
                        <Link to="/profile/security">
                            <FaLock /> Bảo mật
                        </Link>
                    </li>
                    <li className={activeTab === 'menstrual-history' ? 'active' : ''}>
                        <Link to="/profile/menstrual-history">
                            <FaHeartbeat /> Lịch sử chu kỳ
                        </Link>
                    </li>
                    <li className={activeTab === 'blog-history' ? 'active' : ''}>
                        <Link to="/profile/blog-history">
                            <FaRegNewspaper /> Lịch sử bài viết
                        </Link>
                    </li>
                    <li className={activeTab === 'my-questions' ? 'active' : ''}>
                        <Link to="/profile/my-questions">
                            <FaQuestionCircle /> Câu hỏi của tôi
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default SidebarNav;