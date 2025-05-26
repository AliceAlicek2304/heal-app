import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { questionService } from '../../services/questionService';
import './MyQuestions.css';

const STATUS_CLASS = {
    PROCESSING: 'my-question-badge-processing',
    CONFIRMED: 'my-question-badge-confirmed',
    CANCELED: 'my-question-badge-canceled',
    ANSWERED: 'my-question-badge-answered'
};

const MyQuestions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    useEffect(() => {
        fetchMyQuestions();
    }, [currentPage]);

    const fetchMyQuestions = async () => {
        try {
            setLoading(true);
            const response = await questionService.getMyQuestions({
                page: currentPage,
                size: 10
            });

            if (response.success && response.data) {
                console.log('Questions data:', response.data.content);
                setQuestions(response.data.content || []);
                setTotalPages(response.data.totalPages || 0);
            } else {
                setError(response.message || 'Không thể tải câu hỏi');
            }
        } catch (error) {
            console.error('Error fetching my questions:', error);
            setError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        navigate('/questions/create');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PROCESSING': return 'Đang xử lý';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'CANCELED': return 'Đã hủy';
            case 'ANSWERED': return 'Đã trả lời';
            default: return status || 'Không xác định';
        }
    };

    const truncateContent = (content, maxLength = 150) => {
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
        if (e.target.classList.contains('modal-backdrop')) {
            handleCloseModal();
        }
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="my-questions-error-message">
                <p>{error}</p>
                <button onClick={fetchMyQuestions} className="my-questions-retry-btn">
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="my-questions-container">
            <div className="my-questions-header">
                <h2>Câu hỏi của tôi</h2>
                <button
                    className="my-questions-btn my-questions-btn-primary"
                    onClick={handleCreateNew}
                >
                    <i className="fas fa-plus"></i>
                    Đặt câu hỏi mới
                </button>
            </div>

            {questions.length === 0 ? (
                <div className="my-questions-empty-state">
                    <h3>Chưa có câu hỏi nào</h3>
                    <p>Bạn chưa tạo câu hỏi nào. Hãy bắt đầu đặt câu hỏi để nhận tư vấn!</p>
                </div>
            ) : (
                <>
                    <table className="questions-table">
                        <thead>
                            <tr>
                                <th>Nội dung câu hỏi</th>
                                <th>Danh mục</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
                                <th>Câu trả lời</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map(question => (
                                <tr key={question.id}>
                                    <td>
                                        <div
                                            className="my-question-content clickable"
                                            onClick={() => handleOpenModal(question)}
                                            title="Click để xem chi tiết"
                                        >
                                            {truncateContent(question.content)}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="my-question-category-tag">
                                            {question.categoryName || 'Chưa phân loại'}
                                        </span>
                                    </td>
                                    <td className="my-question-date-cell">
                                        {formatDate(question.createdAt)}
                                    </td>
                                    <td>
                                        <span className={`my-question-badge ${STATUS_CLASS[question.status] || ''}`}>
                                            {getStatusText(question.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {question.answer ? (
                                            <div
                                                className="my-question-answer-preview clickable"
                                                onClick={() => handleOpenModal(question)}
                                                title="Click để xem câu trả lời đầy đủ"
                                            >
                                                {truncateContent(question.answer, 100)}
                                                {question.answer.length > 100 && (
                                                    <span className="read-more"> ...xem thêm</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="my-question-no-answer">Chưa có câu trả lời</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="my-questions-pagination">
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
                                    <span className="my-question-category-tag">
                                        {selectedQuestion.categoryName || 'Chưa phân loại'}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <strong>Ngày tạo:</strong>
                                    <span>{formatDate(selectedQuestion.createdAt)}</span>
                                </div>

                                <div className="detail-row">
                                    <strong>Trạng thái:</strong>
                                    <span className={`my-question-badge ${STATUS_CLASS[selectedQuestion.status] || ''}`}>
                                        {getStatusText(selectedQuestion.status)}
                                    </span>
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
                                className="my-questions-btn my-questions-btn-secondary"
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

export default MyQuestions;