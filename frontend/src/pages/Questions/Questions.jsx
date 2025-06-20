import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import LoginForm from '../../components/auth/Login/LoginForm';
import RegisterForm from '../../components/auth/Register/RegisterForm';
import { questionService } from '../../services/questionService';
import { useAuthModal } from '../../hooks/useAuthModal';
import { formatDate } from '../../utils/dateUtils';
import styles from './Questions.module.css';

const Questions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // Auth modals
    const {
        showLoginModal,
        showRegisterModal,
        openLoginModal,
        closeModals,
        switchToLogin,
        switchToRegister
    } = useAuthModal();

    useEffect(() => {
        fetchAnsweredQuestions();
    }, [currentPage]);

    const fetchAnsweredQuestions = async () => {
        try {
            setLoading(true);
            const response = await questionService.getAnsweredQuestions({
                page: currentPage,
                size: 10
            });

            if (response.success && response.data) {
                setAnsweredQuestions(response.data.content || []);
                setTotalPages(response.data.totalPages || 0);
            } else {
                toast.error(response.message || 'Không thể tải câu hỏi');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuestion = () => {
        if (!user) {
            openLoginModal(); // Mở modal đăng nhập nếu chưa đăng nhập
            return;
        }
        navigate('/questions/create');
    };

    const handleViewMyQuestions = () => {
        if (!user) {
            openLoginModal(); // Mở modal đăng nhập nếu chưa đăng nhập
            return;
        }
        navigate('/profile/my-questions');
    };    const handleLoginSuccess = () => {
        closeModals();
        // Nếu người dùng vừa đăng nhập, có thể refresh dữ liệu nếu cần
        fetchAnsweredQuestions();
        // Không cần toast ở đây vì LoginForm đã có toast
    };const truncateContent = (content, maxLength = 200) => {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    };

    // Handle modal
    const handleOpenModal = (question) => {
        setSelectedQuestion(question);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedQuestion(null);
    };

    // Handle click outside modal
    const handleModalBackdropClick = (e) => {
        if (e.target.classList.contains(styles.modalBackdrop)) {
            handleCloseModal();
        }
    };

    return (
        <div className={styles.questionsPage}>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.questionsHeader}>
                    <h1>Câu hỏi y tế</h1>
                    <p>Đặt câu hỏi và nhận tư vấn từ các chuyên gia y tế</p>

                    <div className={styles.headerActions}>
                        <button
                            className={styles.btnPrimary}
                            onClick={handleCreateQuestion}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            {user ? 'Đặt câu hỏi mới' : 'Đăng nhập để đặt câu hỏi'}
                        </button>

                        {user && (
                            <button
                                className={styles.btnSecondary}
                                onClick={handleViewMyQuestions}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                                Câu hỏi của tôi
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <div className={styles.questionsSection}>
                            <h2>Câu hỏi đã được trả lời</h2>

                            {answeredQuestions.length > 0 ? (
                                <div className={styles.questionsList}>
                                    {answeredQuestions.map(question => (
                                        <div
                                            key={question.id}
                                            className={styles.questionCard}
                                            onClick={() => handleOpenModal(question)}
                                        >
                                            <div className={styles.questionContent}>
                                                <h3>{truncateContent(question.content, 100)}</h3>
                                                <p className={styles.questionAnswer}>
                                                    {truncateContent(question.answer, 150)}
                                                    {question.answer && question.answer.length > 150 && (
                                                        <span className={styles.readMore}> ...xem thêm</span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className={styles.questionMeta}>
                                                <span className={styles.questionCategory}>
                                                    {question.categoryName || 'Chưa phân loại'}
                                                </span>
                                                <span className={styles.questionDate}>
                                                    {formatDate(question.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                            <line x1="12" y1="16" x2="12" y2="16"></line>
                                            <line x1="12" y1="8" x2="12" y2="8"></line>
                                        </svg>
                                    </div>
                                    <h3>Chưa có câu hỏi nào được trả lời</h3>
                                    <p>Hãy đặt câu hỏi đầu tiên để nhận tư vấn từ chuyên gia!</p>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handleCreateQuestion}
                                    >
                                        Đặt câu hỏi ngay
                                    </button>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={i === currentPage ? styles.active : ''}
                                        onClick={() => setCurrentPage(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Question Detail Modal */}
            {modalOpen && selectedQuestion && (
                <div
                    className={styles.modalBackdrop}
                    onClick={handleModalBackdropClick}
                >
                    <div className={styles.questionModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết câu hỏi</h3>
                            <button
                                className={styles.modalCloseBtn}
                                onClick={handleCloseModal}
                                aria-label="Đóng"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.questionDetailSection}>
                                <div className={styles.detailRow}>
                                    <strong>Danh mục:</strong>
                                    <span className={styles.questionCategoryTag}>
                                        {selectedQuestion.categoryName || 'Chưa phân loại'}
                                    </span>
                                </div>

                                <div className={styles.detailRow}>
                                    <strong>Ngày tạo:</strong>
                                    <span>{formatDate(selectedQuestion.createdAt)}</span>
                                </div>
                            </div>

                            <div className={styles.questionContentSection}>
                                <h4>Nội dung câu hỏi:</h4>
                                <div className={styles.fullContent}>
                                    {selectedQuestion.content}
                                </div>
                            </div>

                            {selectedQuestion.answer && (
                                <div className={styles.answerSection}>
                                    <h4>Câu trả lời:</h4>
                                    <div className={styles.fullAnswer}>
                                        {selectedQuestion.answer}
                                    </div>
                                    {selectedQuestion.replierName && (
                                        <div className={styles.answerAuthor}>
                                            <small>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                                Trả lời bởi: <strong>{selectedQuestion.replierName}</strong>
                                            </small>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.btnSecondary}
                                onClick={handleCloseModal}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className={styles.modalBackdrop} onClick={closeModals}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <LoginForm
                            onClose={closeModals}
                            onSwitchToRegister={switchToRegister}
                            onLoginSuccess={handleLoginSuccess}
                        />
                    </div>
                </div>
            )}

            {/* Register Modal */}
            {showRegisterModal && (
                <div className={styles.modalBackdrop} onClick={closeModals}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <RegisterForm
                            onClose={closeModals}
                            onSwitchToLogin={switchToLogin}
                        />
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Questions;