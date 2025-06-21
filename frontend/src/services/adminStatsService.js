import { getAuthHeader } from './authService';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/admin';

// Helper function to make authenticated API calls
const makeAuthenticatedRequest = async (url, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.message || 'API call failed');
    }

    return data;
};

// Helper function để tính toán date range
export const getDateRange = (period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case '3months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            endDate = now;
            break;
        case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            endDate = now;
            break;
        case '1year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            endDate = now;
            break;
        default:
            return { startDate: null, endDate: null };
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
};

// Lấy thống kê tổng quan
export const getStatsOverview = async () => {
    try {
        const response = await makeAuthenticatedRequest(`${BASE_URL}/stats/overview`);
        return response.data;
    } catch (error) {
        console.error('Error fetching stats overview:', error);
        throw error;
    }
};

// Lấy thống kê doanh thu
export const getRevenueStats = async (period = 'monthly', year = null, month = null) => {
    try {
        let url = `${BASE_URL}/stats/revenue?period=${period}`;
        if (year) url += `&year=${year}`;
        if (month) url += `&month=${month}`;

        const response = await makeAuthenticatedRequest(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        throw error;
    }
};

// So sánh doanh thu giữa các kỳ
export const compareRevenueStats = async (period, currentYear, currentMonth, compareYear, compareMonth) => {
    try {
        let url = `${BASE_URL}/stats/revenue/compare?period=${period}&currentYear=${currentYear}&compareYear=${compareYear}`;
        if (currentMonth) url += `&currentMonth=${currentMonth}`;
        if (compareMonth) url += `&compareMonth=${compareMonth}`;

        const response = await makeAuthenticatedRequest(url);
        return response.data;
    } catch (error) {
        console.error('Error comparing revenue stats:', error);
        throw error;
    }
};

// Lấy thống kê blog (sử dụng API hiện có)
export const getBlogStats = async () => {
    try {
        const response = await makeAuthenticatedRequest(`${BASE_URL}/blogs`);
        return response.data?.content?.length || 0;
    } catch (error) {
        console.error('Error fetching blog stats:', error);
        return 0;
    }
};

// Lấy thống kê rating (sử dụng API hiện có)
export const getRatingStats = async () => {
    try {
        const response = await makeAuthenticatedRequest(`${BASE_URL}/ratings`);
        return response.data?.content?.length || 0;
    } catch (error) {
        console.error('Error fetching rating stats:', error);
        return 0;
    }
};

// Lấy hoạt động gần đây
export const getRecentActivities = async (limit = 10) => {
    try {
        const url = `${BASE_URL}/stats/activities?limit=${limit}`;
        const response = await makeAuthenticatedRequest(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        throw error;
    }
};

// Lấy top consultants
export const getTopConsultants = async (limit = 10, startDate = null, endDate = null) => {
    try {
        let url = `${BASE_URL}/stats/top-consultants?limit=${limit}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await makeAuthenticatedRequest(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching top consultants:', error);
        throw error;
    }
};

// Lấy top STI services
export const getTopSTIServices = async (limit = 10, startDate = null, endDate = null) => {
    try {
        let url = `${BASE_URL}/stats/top-sti-services?limit=${limit}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await makeAuthenticatedRequest(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching top STI services:', error);
        throw error;
    }
};

// Lấy top STI packages
export const getTopSTIPackages = async (limit = 10, startDate = null, endDate = null) => {
    try {
        let url = `${BASE_URL}/stats/top-sti-packages?limit=${limit}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await makeAuthenticatedRequest(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching top STI packages:', error);
        throw error;
    }
};

// Lấy phân bổ doanh thu theo dịch vụ (pie chart)
export const getRevenueDistribution = async () => {
    try {
        const url = `${BASE_URL}/stats/revenue-distribution`;
        const response = await makeAuthenticatedRequest(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching revenue distribution:', error);
        throw error;
    }
};
