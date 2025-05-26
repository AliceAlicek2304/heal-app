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

    // Kiểm tra authentication status khi app khởi động
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            if (authService.isAuthenticated()) {
                const result = await authService.getCurrentUser();
                if (result.success && result.data) {
                    setUser(result.data);
                } else {
                    setUser(null);
                }
            }
        } catch (error) {
            authService.logout();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData) => {
        try {
            const response = await authService.loginUser(userData);

            if (response.success && response.data && response.data.user) {
                setUser(response.data.user);
                return { success: true, data: response.data };
            } else {
                return { success: false, message: response.message || 'Đăng nhập thất bại' };
            }
        } catch (error) {
            return { success: false, message: 'Có lỗi xảy ra trong quá trình đăng nhập' };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};