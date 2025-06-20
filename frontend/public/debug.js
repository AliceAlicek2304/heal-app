// Debug helper for authentication and rating system
window.debugHealApp = {
    // Check authentication status
    checkAuth: () => {
        const authToken = localStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const user = localStorage.getItem('user');
        
        console.log('=== Authentication Debug ===');
        console.log('Auth Token:', authToken ? `${authToken.substring(0, 20)}...` : 'Not found');
        console.log('Auth Token Length:', authToken ? authToken.length : 0);
        console.log('Auth Token Parts:', authToken ? authToken.split('.').length : 0);
        console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'Not found');
        console.log('User Data:', user ? JSON.parse(user) : 'Not found');
        
        return {
            hasAuthToken: !!authToken,
            hasRefreshToken: !!refreshToken,
            hasUserData: !!user,
            tokenValid: authToken ? authToken.split('.').length === 3 : false
        };
    },
    
    // Test rating API
    testRatingAPI: async () => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error('No auth token found');
            return;
        }
        
        try {
            console.log('=== Testing Rating API ===');
            const response = await fetch('http://localhost:8080/ratings/summary/sti-service/1', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            console.log('Response Status:', response.status);
            console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.status === 401) {
                console.error('401 Unauthorized - Check token validity');
            } else if (response.ok) {
                const data = await response.json();
                console.log('Success Response:', data);
            } else {
                const errorData = await response.text();
                console.error('Error Response:', errorData);
            }
        } catch (error) {
            console.error('Network Error:', error);
        }
    },
    
    // Clear all auth data
    clearAuth: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        console.log('Auth data cleared');
    }
};

console.log('Debug helper loaded. Use window.debugHealApp.checkAuth() to check authentication status.');
