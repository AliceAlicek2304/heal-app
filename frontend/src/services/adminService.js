import axios from 'axios';
import { getAuthHeader } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const adminService = {
    // ========== USER MANAGEMENT APIs ==========
    users: {        // Get all users with optional role filter
        getAll: async (role = null) => {
            try {
                const url = role ? `${API_BASE_URL}/admin/users?role=${role}` : `${API_BASE_URL}/admin/users`;
                const response = await axios.get(url, { headers: getAuthHeader() });
                // Backend trả về ApiResponse<List<UserResponse>>, cần lấy data từ response
                return response.data?.data || response.data || [];
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },        // Get user by ID
        getById: async (userId) => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/users/${userId}`, {
                    headers: getAuthHeader()
                });
                return response.data?.data || response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Create new user (admin can create user with full information)
        create: async (userData) => {
            try {
                const response = await axios.post(`${API_BASE_URL}/admin/users`, userData, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Update user (admin can only update role and status)
        update: async (userId, userData) => {
            try {
                // Admin chỉ được phép cập nhật role và isActive
                const updateData = {
                    role: userData.role,
                    isActive: userData.isActive
                };

                const response = await axios.put(`${API_BASE_URL}/admin/users/${userId}`, updateData, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Reset user password
        resetPassword: async (userId, passwordData) => {
            try {
                const requestData = {
                    newPassword: passwordData.password,
                    reason: passwordData.reason || 'Admin reset password'
                };

                const response = await axios.put(`${API_BASE_URL}/admin/users/${userId}/reset-password`, requestData, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },        // Get available roles (CUSTOMER, CONSULTANT, STAFF, ADMIN)
        getRoles: async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/users/roles`, {
                    headers: getAuthHeader()
                });
                return response.data?.data || response.data || [];
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },        // Get user count by role
        getCountByRole: async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/users/count`, {
                    headers: getAuthHeader()
                });
                return response.data?.data || response.data || {};
            } catch (error) {
                throw error.response?.data || error.message;
            }
        }
    },

    // ========== CONSULTANT MANAGEMENT APIs ==========
    consultants: {        // Get all consultants
        getAll: async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/consultants`, {
                    headers: getAuthHeader()
                });
                // Backend trả về ApiResponse<List<ConsultantProfileResponse>>, cần lấy data từ response
                return response.data?.data || response.data || [];
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Get active consultants only
        getActive: async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/consultants/active`, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Get consultant by user ID
        getById: async (userId) => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/consultants/${userId}`, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Update consultant profile (qualifications, experience, bio)
        updateProfile: async (userId, profileData) => {
            try {
                const response = await axios.put(`${API_BASE_URL}/admin/consultants/${userId}/profile`, profileData, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Activate consultant
        activate: async (userId) => {
            try {
                const response = await axios.put(`${API_BASE_URL}/admin/consultants/${userId}/activate`, {}, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },        // Deactivate consultant
        deactivate: async (userId) => {
            try {
                const response = await axios.put(`${API_BASE_URL}/admin/consultants/${userId}/deactivate`, {}, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Create new consultant account (admin creates full account with CONSULTANT role)
        create: async (consultantData) => {
            try {
                const response = await axios.post(`${API_BASE_URL}/admin/consultants`, consultantData, {
                    headers: getAuthHeader()
                });
                return response.data?.data || response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        }
    },

    // ========== PAYMENT MANAGEMENT APIs ==========
    payments: {
        // Get all payments with pagination
        getAll: async (page = 0, size = 50) => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/payments?page=${page}&size=${size}`, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Get payment details by ID
        getById: async (paymentId) => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/payments/${paymentId}`, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Process refund
        processRefund: async (paymentId, reason) => {
            try {
                const response = await axios.post(`${API_BASE_URL}/admin/payments/${paymentId}/refund`,
                    { reason },
                    { headers: getAuthHeader() }
                );
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        }
    },

    // ========== APP CONFIG MANAGEMENT APIs ==========
    config: {
        // Get all configs
        getAll: async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/config`, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Update single config
        updateSingle: async (key, value) => {
            try {
                const response = await axios.put(`${API_BASE_URL}/admin/config/${key}`,
                    { value },
                    { headers: getAuthHeader() }
                );
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Update config status
        updateStatus: async (key, active) => {
            try {
                const response = await axios.put(`${API_BASE_URL}/admin/config/${key}/status`,
                    { active },
                    { headers: getAuthHeader() }
                );
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Update multiple configs
        updateMultiple: async (configData) => {
            try {
                const response = await axios.put(`${API_BASE_URL}/admin/config`,
                    configData,
                    { headers: getAuthHeader() }
                );
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Add new config
        add: async (key, value) => {
            try {
                const response = await axios.post(`${API_BASE_URL}/admin/config`,
                    { key, value },
                    { headers: getAuthHeader() }
                );
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Delete config
        delete: async (key) => {
            try {
                const response = await axios.delete(`${API_BASE_URL}/admin/config/${key}`, {
                    headers: getAuthHeader()
                });
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        },

        // Upload config file
        uploadFile: async (key, file) => {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await axios.post(`${API_BASE_URL}/admin/config/${key}/upload`,
                    formData,
                    {
                        headers: {
                            ...getAuthHeader(),
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                return response.data;
            } catch (error) {
                throw error.response?.data || error.message;
            }
        }
    }
};

export default adminService;
