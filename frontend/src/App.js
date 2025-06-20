import React from "react";
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
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="App">
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
            </Routes>
            {window.location.pathname !== '/admin' && <ChatBot />}
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;