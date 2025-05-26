import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { questionService } from '../../services/questionService';
import './Questions.css';

const Questions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

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
                setError(response.message || 'Không thể tải câu hỏi');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            setError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuestion = () => {
        if (!user) {
            // Mở modal đăng nhập
            return;
        }
        navigate('/questions/create');
    };

    const handleViewMyQuestions = () => {
        navigate('/profile/my-questions');
    };

    const truncateContent = (content, maxLength = 200) => {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
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
        if (e.target.classList.contains('modal-backdrop')) {
            handleCloseModal();
        }
    };

    return (
        <div className="questions-page">
            <Navbar />
            <div className="container">
                <div className="questions-header">
                    <h1>Câu hỏi y tế</h1>
                    <p>Đặt câu hỏi và nhận tư vấn từ các chuyên gia y tế</p>

                    <div className="header-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleCreateQuestion}
                        >
                            <i className="fas fa-plus"></i>
                            Đặt câu hỏi mới
                        </button>

                        {user && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleViewMyQuestions}
                            >
                                <i className="fas fa-list"></i>
                                Câu hỏi của tôi
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchAnsweredQuestions} className="retry-btn">
                            Thử lại
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="questions-section">
                            <h2>Câu hỏi đã được trả lời</h2>

                            {answeredQuestions.length > 0 ? (
                                <div className="questions-list">
                                    {answeredQuestions.map(question => (
                                        <div
                                            key={question.id}
                                            className="question-card clickable"
                                            onClick={() => handleOpenModal(question)}
                                        >
                                            <div className="question-content">
                                                <h3>{truncateContent(question.content, 100)}</h3>
                                                <p className="question-answer">
                                                    {truncateContent(question.answer, 150)}
                                                    {question.answer && question.answer.length > 150 && (
                                                        <span className="read-more"> ...xem thêm</span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="question-meta">
                                                <span className="question-category">
                                                    {question.categoryName || 'Chưa phân loại'}
                                                </span>
                                                <span className="question-date">
                                                    {formatDate(question.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <h3>Chưa có câu hỏi nào được trả lời</h3>
                                    <p>Hãy đặt câu hỏi đầu tiên để nhận tư vấn từ chuyên gia!</p>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={i === currentPage ? 'active' : ''}
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

            {/* Modal */}
            {modalOpen && selectedQuestion && (
                <div
                    className="modal-backdrop"
                    onClick={handleModalBackdropClick}
                >
                    <div className="question-modal">
                        <div className="modal-header">
                            <h3>Chi tiết câu hỏi</h3>
                            <button
                                className="modal-close-btn"
                                onClick={handleCloseModal}
                                aria-label="Đóng"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="question-detail-section">
                                <div className="detail-row">
                                    <strong>Danh mục:</strong>
                                    <span className="question-category-tag">
                                        {selectedQuestion.categoryName || 'Chưa phân loại'}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <strong>Ngày tạo:</strong>
                                    <span>{formatDate(selectedQuestion.createdAt)}</span>
                                </div>
                            </div>

                            <div className="question-content-section">
                                <h4>Nội dung câu hỏi:</h4>
                                <div className="full-content">
                                    {selectedQuestion.content}
                                </div>
                            </div>

                            {selectedQuestion.answer && (
                                <div className="answer-section">
                                    <h4>Câu trả lời:</h4>
                                    <div className="full-answer">
                                        {selectedQuestion.answer}
                                    </div>
                                    {selectedQuestion.replierName && (
                                        <div className="answer-author">
                                            <small>
                                                <i className="fas fa-user-md"></i>
                                                Trả lời bởi: <strong>{selectedQuestion.replierName}</strong>
                                            </small>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={handleCloseModal}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questions;