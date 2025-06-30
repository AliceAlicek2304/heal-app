import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage/HomePage";
import Blog from "./pages/Blog/Blog";
import BlogDetail from "./pages/BlogDetail/BlogDetail";
import MenstrualCycleCalculator from "./pages/MenstrualCycle/MenstrualCycleCalculator";
import ProfilePage from "./pages/Profile/ProfilePage";
import ChatBot from './components/chatbot/ChatBot';
import CreateBlog from './pages/Blog/CreateBlog/CreateBlog';
import EditBlog from './pages/Blog/EditBlog/EditBlog';
import Questions from './pages/Questions/Questions';
import CreateQuestion from './pages/Questions/CreateQuestion/CreateQuestion';
import Consultation from './pages/Consultation/Consultation';
import STITesting from './pages/STITesting/STITesting';
import SearchResults from './pages/SearchResults/SearchResults';
import AllRatings from './pages/AllRatings/AllRatings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import FAQ from './pages/FAQ/FAQ';
import Guides from './pages/Guides/Guides';
import Privacy from './pages/Privacy/Privacy';
import Terms from './pages/Terms/Terms';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from './contexts/ToastContext';

// Component để kiểm tra và redirect admin
const AdminRedirect = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        // Chỉ kiểm tra khi đã load xong và user đã đăng nhập
        if (!isLoading && isAuthenticated && user) {
            const isAdmin = (user?.roles && user.roles.includes('ROLE_ADMIN')) ||
                           (user?.role && user.role === 'ADMIN');
            
            if (isAdmin) {
                const currentPath = window.location.pathname;
                const basename = process.env.NODE_ENV === 'production' ? '/heal-app' : '';
                const adminPath = `${basename}/admin`;
                
                // Chỉ redirect nếu không đang ở trang admin hoặc profile
                if (!currentPath.startsWith(adminPath) && !currentPath.startsWith('/profile')) {
                    // Sử dụng setTimeout để đảm bảo component đã mount hoàn toàn
                    setTimeout(() => {
                        window.location.href = adminPath;
                    }, 200);
                }
            }
        }
    }, [user, isAuthenticated, isLoading]);

    return null;
};

function App() {
  // Xác định basename dựa trên environment
  const basename = process.env.NODE_ENV === 'production' ? '/heal-app' : '';

  return (
    <AuthProvider>
      <ToastProvider>
        <Router basename={basename}>
          <div className="App">
            <AdminRedirect />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/create" element={<CreateBlog />} />
              <Route path="/blog/edit/:postId" element={<EditBlog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/menstrual-cycle" element={<MenstrualCycleCalculator />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:tab" element={<ProfilePage />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/questions/create" element={<CreateQuestion />} />
              <Route path="/consultation" element={<Consultation />} />
              <Route path="/sti-testing" element={<STITesting />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/all-ratings/:targetType/:targetId" element={<AllRatings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
            </Routes>
            {!window.location.pathname.includes('/admin') && <ChatBot />}
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;