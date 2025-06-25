import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);

    // Helper function to check if user is admin
    const isUserAdmin = (userData) => {
        return (userData?.roles && userData.roles.includes('ROLE_ADMIN')) ||
               (userData?.role && userData.role === 'ADMIN');
    };

    // Helper function to redirect admin to dashboard
    const redirectAdminToDashboard = () => {
        // Only redirect if we're not already on admin page and not on a specific admin route
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/admin') && !currentPath.startsWith('/profile')) {
            // Use setTimeout to ensure this runs after the component mounts
            setTimeout(() => {
                window.location.href = '/admin';
            }, 100);
        }
    };

    useEffect(() => {
        const verifyAuth = async () => {
            setIsLoading(true);
            try {
                const authenticated = authService.isAuthenticated();
                if (authenticated) {
                    // Try to get user from localStorage first
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const userData = JSON.parse(userStr);
                        setUser(userData);
                        setIsAuthenticatedState(true);

                        // Check if user is admin and redirect if needed
                        if (isUserAdmin(userData)) {
                            redirectAdminToDashboard();
                        }
                    }

                    // Check if token is expired and try to refresh
                    if (authService.isTokenExpired()) {
                        console.log('Token is expired, attempting refresh...');
                        try {
                            const refreshResult = await authService.refreshToken();
                            if (!refreshResult) {
                                console.log('Refresh failed, logging out');
                                await logout();
                                return;
                            }
                            console.log('Token refreshed successfully');
                        } catch (refreshError) {
                            console.error('Token refresh failed:', refreshError);
                            await logout();
                            return;
                        }
                    }

                    // If we don't have user data, try to get it from server
                    if (!userStr) {
                        try {
                            const result = await authService.getCurrentUser();
                            if (result.success && result.data) {
                                setUser(result.data);
                                setIsAuthenticatedState(true);
                                localStorage.setItem('user', JSON.stringify(result.data));

                                // Check if user is admin and redirect if needed
                                if (isUserAdmin(result.data)) {
                                    redirectAdminToDashboard();
                                }
                            } else {
                                // Server says we're not authenticated
                                authService.logout();
                                setUser(null);
                                setIsAuthenticatedState(false);
                            }
                        } catch (serverError) {
                            console.error('Failed to get user from server:', serverError);
                            authService.logout();
                            setUser(null);
                            setIsAuthenticatedState(false);
                        }
                    }
                } else {
                    setUser(null);
                    setIsAuthenticatedState(false);
                }
            } catch (error) {
                console.error('Auth verification error:', error);
                authService.logout();
                setUser(null);
                setIsAuthenticatedState(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, []);

    const login = async (loginData) => {
        setIsLoading(true);
        try {
            const response = await authService.loginUser(loginData);
            if (response.success && response.data?.user) {
                setUser(response.data.user);
                setIsAuthenticatedState(true);

                // Check if user is admin - handle both role formats
                const isAdmin = isUserAdmin(response.data.user);
                return { success: true, data: response.data, isAdmin: isAdmin };
            }
            setIsAuthenticatedState(false);
            return { success: false, message: response.message || 'Đăng nhập thất bại' };
        } catch (error) {
            setIsAuthenticatedState(false);
            return { success: false, message: 'Có lỗi xảy ra trong quá trình đăng nhập' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticatedState(false);
    };

    const updateUser = (newUserData) => {
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        updateUser,
        isAuthenticated: isAuthenticatedState
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};