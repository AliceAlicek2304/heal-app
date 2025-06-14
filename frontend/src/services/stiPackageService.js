const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const STI_PACKAGE_BASE_URL = '/sti-packages';

class STIPackageService {
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

    // Lấy danh sách packages đang hoạt động (Public)
    async getActivePackages() {
        try {
            const response = await fetch(`${API_BASE_URL}${STI_PACKAGE_BASE_URL}/active`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch packages');
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data,
                message: data.message
            };
        } catch (error) {
            console.error('Error getting active STI packages:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get STI packages'
            };
        }
    }    // Lấy chi tiết package theo ID (Public)
    async getPackageById(packageId) {
        try {
            const response = await fetch(`${API_BASE_URL}${STI_PACKAGE_BASE_URL}/${packageId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch package');
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data,
                message: data.message
            };
        } catch (error) {
            console.error('Error getting STI package:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get STI package'
            };
        }
    }    // Tìm kiếm packages theo từ khóa (Public)
    async searchPackages(keyword) {
        try {
            const response = await fetch(`${API_BASE_URL}${STI_PACKAGE_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to search packages');
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data,
                message: data.message
            };
        } catch (error) {
            console.error('Error searching STI packages:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to search STI packages'
            };
        }
    }    // Lấy tất cả packages cho admin/staff (bao gồm cả inactive)
    async getAllPackages() {
        try {
            const response = await fetch(`${API_BASE_URL}${STI_PACKAGE_BASE_URL}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                return this.handleAuthError();
            }

            if (!response.ok) {
                throw new Error('Failed to fetch packages');
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data,
                message: data.message
            };
        } catch (error) {
            console.error('Error getting all STI packages:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get STI packages'
            };
        }
    }    // Tạo package mới (Admin/Staff only)
    async createPackage(packageData) {
        try {
            const response = await fetch(`${API_BASE_URL}${STI_PACKAGE_BASE_URL}`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(packageData)
            });

            if (response.status === 401) {
                return this.handleAuthError();
            }

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Failed to create STI package'
                };
            }

            return {
                success: true,
                data: data.data,
                message: data.message
            };
        } catch (error) {
            console.error('Error creating STI package:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create STI package'
            };
        }
    }    // Cập nhật package (Admin/Staff only)
    async updatePackage(packageId, packageData) {
        try {
            const response = await fetch(`${API_BASE_URL}${STI_PACKAGE_BASE_URL}/${packageId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(packageData)
            });

            if (response.status === 401) {
                return this.handleAuthError();
            }

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Failed to update STI package'
                };
            }

            return {
                success: true,
                data: data.data,
                message: data.message
            };
        } catch (error) {
            console.error('Error updating STI package:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update STI package'
            };
        }
    }    // Xóa package (Admin only)
    async deletePackage(packageId) {
        try {
            const response = await fetch(`${API_BASE_URL}${STI_PACKAGE_BASE_URL}/${packageId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                return this.handleAuthError();
            }

            if (!response.ok) {
                const data = await response.json();
                return {
                    success: false,
                    message: data.message || 'Failed to delete STI package'
                };
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data,
                message: data.message
            };
        } catch (error) {
            console.error('Error deleting STI package:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete STI package'
            };
        }
    }    // Book package (Authenticated users)
    async bookPackage(packageId, bookingData) {
        try {
            const response = await fetch(`${API_BASE_URL}/sti-services/book-test`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    ...bookingData,
                    packageId: packageId,
                    serviceId: null // Đảm bảo serviceId null khi book package
                })
            });

            if (response.status === 401) {
                return this.handleAuthError();
            }

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Failed to book STI package'
                };
            }

            return {
                success: true,
                data: data.data,
                message: data.message
            };
        } catch (error) {
            console.error('Error booking STI package:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to book STI package'
            };
        }
    }

    // Helper methods
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0);
    }

    calculateSavings(packagePrice, totalIndividualPrice) {
        if (!packagePrice || !totalIndividualPrice) return 0;
        return totalIndividualPrice - packagePrice;
    }

    calculateDiscountPercentage(packagePrice, totalIndividualPrice) {
        if (!packagePrice || !totalIndividualPrice || totalIndividualPrice === 0) return 0;
        const savings = this.calculateSavings(packagePrice, totalIndividualPrice); return Math.round((savings / totalIndividualPrice) * 100);
    }
}

const stiPackageServiceInstance = new STIPackageService();
export default stiPackageServiceInstance;
