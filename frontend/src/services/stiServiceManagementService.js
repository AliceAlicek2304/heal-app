const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class STIServiceManagementService {
    constructor() {
        this.baseURL = `${API_BASE_URL}/staff/sti-services`;
    }

    // Get auth headers 
    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // Handle authentication errors
    handleAuthError(onAuthRequired) {
        if (onAuthRequired) {
            onAuthRequired();
        }
        return { success: false, message: 'Unauthorized' };
    }

    // Lấy tất cả dịch vụ cho staff management (bao gồm cả inactive)
    async getAllSTIServices(onAuthRequired) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                return this.handleAuthError(onAuthRequired);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching STI services:', error);
            return { 
                success: false, 
                message: 'Không thể tải danh sách dịch vụ STI' 
            };
        }
    }

    // Lấy chi tiết dịch vụ kèm components
    async getSTIServiceDetails(serviceId, onAuthRequired) {
        try {
            const response = await fetch(`${this.baseURL}/${serviceId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                return this.handleAuthError(onAuthRequired);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching STI service details:', error);
            return { 
                success: false, 
                message: 'Không thể tải chi tiết dịch vụ' 
            };
        }
    }

    // Tạo dịch vụ STI mới
    async createSTIService(serviceData, onAuthRequired) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(serviceData)
            });

            if (response.status === 401) {
                return this.handleAuthError(onAuthRequired);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating STI service:', error);
            return { 
                success: false, 
                message: 'Không thể tạo dịch vụ STI' 
            };
        }
    }

    // Cập nhật dịch vụ STI
    async updateSTIService(serviceId, serviceData, onAuthRequired) {
        try {
            const response = await fetch(`${this.baseURL}/${serviceId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(serviceData)
            });

            if (response.status === 401) {
                return this.handleAuthError(onAuthRequired);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating STI service:', error);
            return { 
                success: false, 
                message: 'Không thể cập nhật dịch vụ STI' 
            };
        }
    }

    // Toggle trạng thái dịch vụ (soft delete/restore)
    async toggleSTIServiceStatus(serviceId, onAuthRequired) {
        try {
            const response = await fetch(`${this.baseURL}/${serviceId}/toggle-status`, {
                method: 'PATCH',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                return this.handleAuthError(onAuthRequired);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error toggling STI service status:', error);
            return { 
                success: false, 
                message: 'Không thể thay đổi trạng thái dịch vụ' 
            };
        }
    }

    // ========= INDIVIDUAL COMPONENT MANAGEMENT =========

    // Cập nhật từng component
    async updateComponent(componentId, componentData, onAuthRequired) {
        try {
            const response = await fetch(`${API_BASE_URL}/staff/components/${componentId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(componentData)
            });

            if (response.status === 401) {
                return this.handleAuthError(onAuthRequired);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating component:', error);
            return { 
                success: false, 
                message: 'Không thể cập nhật component' 
            };
        }
    }

    // Toggle trạng thái component
    async toggleComponentStatus(componentId, onAuthRequired) {
        try {
            const response = await fetch(`${API_BASE_URL}/staff/components/${componentId}/toggle-status`, {
                method: 'PATCH',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                return this.handleAuthError(onAuthRequired);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error toggling component status:', error);
            return { 
                success: false, 
                message: 'Không thể thay đổi trạng thái component' 
            };
        }
    }

    // Xóa component (soft delete)
    async deleteComponent(componentId, onAuthRequired) {
        try {
            const response = await fetch(`${API_BASE_URL}/staff/components/${componentId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                return this.handleAuthError(onAuthRequired);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting component:', error);
            return { 
                success: false, 
                message: 'Không thể xóa component' 
            };
        }
    }
}

export const stiServiceManagementService = new STIServiceManagementService();
