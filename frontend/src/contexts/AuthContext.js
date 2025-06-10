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
    const [isAuthenticatedState, setIsAuthenticatedState] = useState(false); useEffect(() => {
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
                    }

                    // Then try to refresh from server (optional, in background)
                    try {
                        const result = await authService.getCurrentUser();
                        if (result.success && result.data) {
                            setUser(result.data);
                            setIsAuthenticatedState(true);
                        } else if (!userStr) {
                            // Only logout if we don't have cached user data
                            authService.logout();
                            setUser(null);
                            setIsAuthenticatedState(false);
                        }
                    } catch (serverError) {
                        console.warn('Server verification failed, using cached data:', serverError);
                        // Keep using cached data if server is unreachable
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
                return { success: true, data: response.data };
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
        isLoading,  // Thêm isLoading vào context   
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