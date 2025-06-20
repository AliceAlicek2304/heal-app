import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader/AdminHeader';
import AdminStats from '../../components/admin/AdminStats/AdminStats';
import UserManagement from '../../components/admin/UserManagement/UserManagement';
import ConsultantManagement from '../../components/admin/ConsultantManagement/ConsultantManagement';
import ConsultationManagement from '../../components/admin/ConsultationManagement/ConsultationManagement';
import STIServiceManagement from '../../components/admin/STIServiceManagement/STIServiceManagement';
import STIPackageManagement from '../../components/admin/STIPackageManagement/STIPackageManagement';
import STITestManagement from '../../components/admin/STITestManagement/STITestManagement';
import RatingManagement from '../../components/admin/RatingManagement/RatingManagement';
import BlogManagement from '../../components/admin/BlogManagement/BlogManagement';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false); useEffect(() => {
        // Don't redirect while loading
        if (isLoading) {
            return;
        }

        // Add a small delay to ensure auth state is fully settled
        const timeoutId = setTimeout(() => {
            // Check if user is authenticated and has admin role
            if (!isAuthenticated) {
                navigate('/');
                return;
            }

            // Check if user has admin role - handle both role formats
            const isAdmin = (user && user.roles && user.roles.includes('ROLE_ADMIN')) ||
                (user && user.role && user.role === 'ADMIN');

            if (!user || !isAdmin) {
                navigate('/');
                return;
            }
        }, 100); // Small delay to ensure state is settled

        return () => clearTimeout(timeoutId);
    }, [user, isAuthenticated, isLoading, navigate]);

    const handleSectionChange = (section) => {
        setActiveSection(section);
    }; const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // Show loading while verifying authentication
    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang xác thực...</p>
            </div>
        );
    }

    // Don't render if not authenticated or not admin
    const isAdmin = (user && user.roles && user.roles.includes('ROLE_ADMIN')) ||
        (user && user.role && user.role === 'ADMIN');

    if (!isAuthenticated || !user || !isAdmin) {
        return null;
    } const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <AdminStats />;
            case 'users':
                return <UserManagement />;
            case 'consultants':
                return <ConsultantManagement />;
            case 'consultations':
                return <ConsultationManagement />;
            case 'sti-services':
                return <STIServiceManagement />;
            case 'sti-packages':
                return <STIPackageManagement />;            case 'sti-tests':
                return <STITestManagement />;
            case 'ratings':
                return <RatingManagement />;
            case 'blog':
                return <BlogManagement />;
            default:
                return <AdminStats />;
        }
    };

    return (
        <div className={styles.adminDashboard}>
            <AdminSidebar
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                collapsed={sidebarCollapsed}
            />
            <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
                <AdminHeader
                    onToggleSidebar={toggleSidebar}
                    sidebarCollapsed={sidebarCollapsed}
                    activeSection={activeSection}
                />
                <div className={styles.content}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
