const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Helper function to validate JWT token
const validateToken = () => {
    const token = localStorage.getItem('authToken'); // Use 'authToken' key to match authService

    if (!token) {
        return { valid: false, message: 'Vui lòng đăng nhập để tiếp tục' };
    }

    // Check if token has correct JWT format (3 parts separated by dots)
    if (token.split('.').length !== 3) {
        console.warn('Invalid JWT token format:', token.substring(0, 20) + '...');
        localStorage.removeItem('authToken');
        return { valid: false, message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại' };
    }

    return { valid: true, token };
};

// Helper function to handle 401 responses
const handle401Response = () => {
    console.warn('401 Unauthorized - removing invalid token');
    localStorage.removeItem('authToken');
    return {
        success: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại'
    };
};

const ratingService = {
    // Submit a new rating
    submitRating: async (ratingData) => {
        try {
            // Validate token
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }
            // Map targetType to correct endpoint
            let endpoint;
            if (ratingData.targetType.toLowerCase() === 'consultant') {
                endpoint = `${API_BASE_URL}/ratings/consultant/${ratingData.targetId}`;
            } else if (ratingData.targetType.toLowerCase() === 'sti_service' || ratingData.targetType.toLowerCase() === 'sti-service') {
                endpoint = `${API_BASE_URL}/ratings/sti-service/${ratingData.targetId}`;
            } else if (ratingData.targetType.toLowerCase() === 'sti_package' || ratingData.targetType.toLowerCase() === 'sti-package') {
                endpoint = `${API_BASE_URL}/ratings/sti-package/${ratingData.targetId}`;
            } else {
                throw new Error('Invalid target type');
            } const requestBody = {
                rating: ratingData.rating,
                comment: ratingData.comment,
                consultationId: ratingData.consultationId,
                stiTestId: ratingData.stiTestId
            };
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenValidation.token}`
                },
                body: JSON.stringify(requestBody)
            });

            // Handle 401 Unauthorized specifically
            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit rating');
            }

            return {
                success: true,
                data: data,
                message: 'Rating submitted successfully'
            };
        } catch (error) {
            console.error('Error submitting rating:', error);
            return {
                success: false,
                message: error.message || 'Failed to submit rating'
            };
        }
    },

    // Update an existing rating
    updateRating: async (ratingId, ratingData) => {
        try {
            // Validate token
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenValidation.token}`
                },
                body: JSON.stringify(ratingData)
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update rating');
            }

            return {
                success: true,
                data: data,
                message: 'Rating updated successfully'
            };
        } catch (error) {
            console.error('Error updating rating:', error);
            return {
                success: false,
                message: error.message || 'Failed to update rating'
            };
        }
    },    // Get ratings for a specific target (consultant or STI service)
    getRatings: async (targetType, targetId, page = 0, size = 10) => {
        try {
            const token = localStorage.getItem('authToken');
            // Public endpoint, token is optional

            // Map targetType to correct endpoint
            let endpoint;
            if (targetType.toLowerCase() === 'consultant') {
                endpoint = `${API_BASE_URL}/ratings/consultant/${targetId}`;
            } else if (targetType.toLowerCase() === 'sti_service' || targetType.toLowerCase() === 'sti-service') {
                endpoint = `${API_BASE_URL}/ratings/sti-service/${targetId}`;
            } else if (targetType.toLowerCase() === 'sti_package' || targetType.toLowerCase() === 'sti-package') {
                endpoint = `${API_BASE_URL}/ratings/sti-package/${targetId}`;
            } else {
                throw new Error('Invalid target type');
            } const headers = {
                'Content-Type': 'application/json'
            };

            // Only add Authorization header if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${endpoint}?page=${page}&size=${size}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                data: data,
                message: 'Ratings fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching ratings:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch ratings'
            };
        }
    },    // Get rating statistics for a specific target
    getRatingStats: async (targetType, targetId) => {
        try {
            const token = localStorage.getItem('authToken');
            // Public endpoint, token is optional

            let endpoint = 'consultant';
            if (targetType === 'sti_service' || targetType === 'sti-service') {
                endpoint = 'sti-service';
            } else if (targetType === 'sti_package' || targetType === 'sti-package') {
                endpoint = 'sti-package';
            } const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${API_BASE_URL}/ratings/summary/${endpoint}/${targetId}?includeRecentReviews=true`, {
                method: 'GET',
                headers: headers
            });

            // Check if response is empty or not JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Return default stats if no data available
                return {
                    success: true,
                    data: {
                        averageRating: 0,
                        totalRatings: 0,
                        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                    },
                    message: 'No rating data available'
                };
            }

            const data = await response.json();

            if (!response.ok) {
                // If 404 or no data found, return default stats
                if (response.status === 404) {
                    return {
                        success: true,
                        data: {
                            averageRating: 0,
                            totalRatings: 0,
                            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                        },
                        message: 'No ratings found'
                    };
                }
                throw new Error(data.message || 'Failed to fetch rating statistics');
            }

            return {
                success: true,
                data: data,
                message: 'Rating statistics fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching rating statistics:', error);
            // Return default stats on error
            return {
                success: true,
                data: {
                    averageRating: 0,
                    totalRatings: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                }, message: 'Using default rating data due to error'
            };
        }
    },

    // Get user's rating for a specific target    
    getUserRating: async (targetType, targetId) => {
        try {
            const token = localStorage.getItem('authToken');

            // Map targetType to correct format
            let mappedTargetType = 'CONSULTANT';
            if (targetType.toLowerCase() === 'sti_service' || targetType.toLowerCase() === 'sti-service') {
                mappedTargetType = 'STI_SERVICE';
            } else if (targetType.toLowerCase() === 'sti_package' || targetType.toLowerCase() === 'sti-package') {
                mappedTargetType = 'STI_PACKAGE';
            }

            const response = await fetch(`${API_BASE_URL}/ratings/can-rate/${mappedTargetType}/${targetId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // If no rating found, return success with null data
                if (response.status === 404) {
                    return {
                        success: true,
                        data: null,
                        message: 'No rating found for this user'
                    };
                }
                throw new Error(data.message || 'Failed to fetch user rating');
            }

            return {
                success: true,
                data: data.data?.existingRating || null,
                message: 'User rating fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching user rating:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch user rating'
            };
        }
    },

    // Check if user can rate a specific target    
    checkEligibility: async (targetType, targetId) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            // Map targetType to correct format
            let mappedTargetType = 'CONSULTANT';
            if (targetType.toLowerCase() === 'sti_service' || targetType.toLowerCase() === 'sti-service') {
                mappedTargetType = 'STI_SERVICE';
            } else if (targetType.toLowerCase() === 'sti_package' || targetType.toLowerCase() === 'sti-package') {
                mappedTargetType = 'STI_PACKAGE';
            }

            const response = await fetch(`${API_BASE_URL}/ratings/can-rate/${mappedTargetType}/${targetId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            // Handle 401 Unauthorized specifically
            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to check rating eligibility');
            }

            return {
                success: true,
                data: {
                    canRate: data.data?.canRate || false,
                    hasRated: data.data?.hasRated || false,
                    reason: data.data?.reason || 'Unknown'
                },
                message: 'Eligibility checked successfully'
            };
        } catch (error) {
            console.error('Error checking rating eligibility:', error);
            return {
                success: false,
                message: error.message || 'Failed to check rating eligibility'
            };
        }
    },

    // Delete a rating
    deleteRating: async (ratingId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete rating');
            }

            return {
                success: true,
                message: 'Rating deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting rating:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete rating'
            };
        }
    },

    // Soft delete a rating (for staff/admin)
    softDeleteRating: async (ratingId) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete rating');
            }

            return {
                success: true,
                message: 'Rating deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting rating:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete rating'
            };
        }
    },    // Add a staff reply to a rating
    addStaffReply: async (ratingId, replyData) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/reply/${ratingId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenValidation.token}`
                },
                body: JSON.stringify(replyData)
            });

            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add staff reply');
            }

            return {
                success: true,
                data: data.data,
                message: 'Reply added successfully'
            };
        } catch (error) {
            console.error('Error adding staff reply:', error);
            return {
                success: false,
                message: error.message || 'Failed to add staff reply'
            };
        }
    },

    // Update an existing staff reply
    updateStaffReply: async (ratingId, replyData) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/reply/${ratingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenValidation.token}`
                },
                body: JSON.stringify(replyData)
            });

            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update staff reply');
            }

            return {
                success: true,
                data: data.data,
                message: 'Reply updated successfully'
            };
        } catch (error) {
            console.error('Error updating staff reply:', error);
            return {
                success: false,
                message: error.message || 'Failed to update staff reply'
            };
        }
    },

    // Delete a staff reply
    deleteStaffReply: async (ratingId) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/reply/${ratingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete staff reply');
            }

            return {
                success: true,
                message: 'Reply deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting staff reply:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete staff reply'
            };
        }
    },    // Get all ratings for a staff to manage (combines consultant and STI ratings)
    getAllRatingsForStaff: async (page = 0, size = 10, sort = 'newest', filterRating = null, keyword = null) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            } let url = `${API_BASE_URL}/ratings/staff/all?page=${page}&size=${size}&sort=${sort}`;
            if (filterRating) url += `&filterRating=${filterRating}`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            } const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch all ratings');
            }

            return {
                success: true,
                data: data.data,
                message: 'All ratings fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching all staff ratings:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch all ratings'
            };
        }
    },

    // Get consultation ratings for a staff to manage
    getConsultationRatingsForStaff: async (page = 0, size = 10, sort = 'newest', filterRating = null, keyword = null) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            let url = `${API_BASE_URL}/ratings/staff/consultation?page=${page}&size=${size}&sort=${sort}`; if (filterRating) url += `&filterRating=${filterRating}`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            } const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch consultation ratings');
            }

            return {
                success: true,
                data: data.data,
                message: 'Consultation ratings fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching staff consultation ratings:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch consultation ratings'
            };
        }
    },

    // Get STI service ratings for a staff to manage
    getSTIServiceRatingsForStaff: async (page = 0, size = 10, sort = 'newest', filterRating = null, keyword = null) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            let url = `${API_BASE_URL}/ratings/staff/sti-service?page=${page}&size=${size}&sort=${sort}`; if (filterRating) url += `&filterRating=${filterRating}`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            } const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch STI service ratings');
            }

            return {
                success: true,
                data: data.data,
                message: 'STI service ratings fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching staff STI service ratings:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch STI service ratings'
            };
        }
    },

    // Get STI package ratings for a staff to manage
    getSTIPackageRatingsForStaff: async (page = 0, size = 10, sort = 'newest', filterRating = null, keyword = null) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            let url = `${API_BASE_URL}/ratings/staff/sti-package?page=${page}&size=${size}&sort=${sort}`;
            if (filterRating) url += `&filterRating=${filterRating}`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            } const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch STI package ratings');
            }

            return {
                success: true,
                data: data.data,
                message: 'STI package ratings fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching staff STI package ratings:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch STI package ratings'
            };
        }
    },

    // Get rating summaries for staff
    getAllRatingSummary: async () => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/summary/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch rating summary');
            }

            return {
                success: true,
                data: data.data,
                message: 'Rating summary fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching rating summary:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch rating summary'
            };
        }
    },

    getConsultationRatingSummary: async () => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/summary/consultation`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch consultation rating summary');
            }

            return {
                success: true,
                data: data.data,
                message: 'Consultation rating summary fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching consultation rating summary:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch consultation rating summary'
            };
        }
    },

    getSTIServiceRatingSummary: async () => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/summary/sti-service`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch STI service rating summary');
            }

            return {
                success: true,
                data: data.data,
                message: 'STI service rating summary fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching STI service rating summary:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch STI service rating summary'
            };
        }
    },

    // ===================== STAFF SUMMARY ENDPOINTS =====================

    // Get all ratings summary for staff
    getAllRatingSummaryForStaff: async () => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/summary/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error getting all ratings summary for staff:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải tổng hợp đánh giá'
            };
        }
    },

    // Get consultation ratings summary for staff
    getConsultationRatingSummaryForStaff: async () => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/summary/consultation`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error getting consultation ratings summary for staff:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải tổng hợp đánh giá tư vấn'
            };
        }
    },

    // Get STI service ratings summary for staff
    getSTIServiceRatingSummaryForStaff: async () => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/summary/sti-service`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error getting STI service ratings summary for staff:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải tổng hợp đánh giá dịch vụ STI'
            };
        }
    },

    // Get STI package ratings summary for staff
    getSTIPackageRatingSummaryForStaff: async () => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/summary/sti-package`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error getting STI package ratings summary for staff:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải tổng hợp đánh giá gói STI'
            };
        }
    },

    // ===================== STAFF REPLY ENDPOINTS =====================

    // Reply to rating as staff
    replyToRatingAsStaff: async (ratingId, replyData) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/reply/${ratingId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(replyData)
            });

            if (response.status === 401) {
                return handle401Response();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error replying to rating as staff:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi gửi phản hồi'
            };
        }
    },

    // Update staff reply
    updateStaffReply: async (ratingId, replyData) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/reply/${ratingId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(replyData)
            });

            if (response.status === 401) {
                return handle401Response();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error updating staff reply:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi cập nhật phản hồi'
            };
        }
    },

    // Delete staff reply
    deleteStaffReply: async (ratingId) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/staff/reply/${ratingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error deleting staff reply:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi xóa phản hồi'
            };
        }
    },

    // ===================== STAFF RATING MANAGEMENT =====================

    // Delete rating as staff (soft delete)
    deleteRatingAsStaff: async (ratingId) => {
        try {
            const tokenValidation = validateToken();
            if (!tokenValidation.valid) {
                return { success: false, message: tokenValidation.message };
            }

            const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${tokenValidation.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                return handle401Response();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error deleting rating as staff:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi ẩn đánh giá'
            };
        }
    }
};

export { ratingService };

// Export individual functions for convenience
export const {
    submitRating,
    updateRating,
    deleteRating,
    getMyRatings,
    canRate,
    getConsultantRatings,
    getSTIServiceRatings,
    getConsultantRatingSummary,
    getSTIServiceRatingSummary,
    replyToRating,
    updateReply,
    deleteReply,
    getAllRatingsForStaff,
    getConsultationRatingsForStaff,
    getSTIServiceRatingsForStaff,
    getSTIPackageRatingsForStaff, getAllRatingSummaryForStaff,
    getConsultationRatingSummaryForStaff,
    getSTIServiceRatingSummaryForStaff,
    getSTIPackageRatingSummaryForStaff,
    replyToRatingAsStaff,
    updateStaffReply,
    deleteStaffReply,
    deleteRatingAsStaff
} = ratingService;
