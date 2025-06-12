import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import { questionService } from '../../services/questionService';
import styles from './MyQuestions.module.css';

const STATUS_CLASS = {
    PROCESSING: styles.statusProcessing,
    CONFIRMED: styles.statusConfirmed,
    CANCELED: styles.statusCanceled,
    ANSWERED: styles.statusAnswered
};

const MyQuestions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0); const [filters, setFilters] = useState({});
    const [filteredQuestions, setFilteredQuestions] = useState([]);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // Ref for scrolling to questions list
    const questionsListRef = useRef(null);

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
                setQuestions(response.data.content || []);
                setTotalPages(response.data.totalPages || 0);
            } else {
                toast.error(response.message || 'Không thể tải câu hỏi');
            }
        } catch (error) {
            console.error('Error fetching my questions:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }; const handleCreateNew = () => {
        navigate('/questions/create');
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);

        // Scroll to questions list when changing pages
        if (questionsListRef.current) {
            questionsListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // Fallback: scroll to top of page
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }; const handleRefresh = () => {
        toast.info('Đang tải lại dữ liệu...');
        fetchMyQuestions();
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
        if (e.target.classList.contains(styles.modalBackdrop)) {
            handleCloseModal();
        }
    };

    // Filter questions based on selected filters
    const applyFilters = (questionsToFilter, currentFilters) => {
        let filtered = [...questionsToFilter];

        // Text search filter
        if (currentFilters.searchText) {
            const searchLower = currentFilters.searchText.toLowerCase();
            filtered = filtered.filter(question => {
                return (
                    question.questionId?.toString().includes(searchLower) ||
                    question.title?.toLowerCase().includes(searchLower) ||
                    question.content?.toLowerCase().includes(searchLower) ||
                    question.answer?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Status filter
        if (currentFilters.status) {
            filtered = filtered.filter(question => question.status === currentFilters.status);
        }        // Date range filter
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            filtered = filtered.filter(question => {
                let questionDate;

                // Handle different date formats from backend
                const rawDate = question.createdAt;
                if (Array.isArray(rawDate)) {
                    // Array format: [year, month, day, hour, minute, second, nanosecond]
                    // Note: month is 1-based in array, but Date constructor expects 0-based
                    questionDate = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
                } else if (typeof rawDate === 'string' || rawDate instanceof Date) {
                    questionDate = new Date(rawDate);
                } else {
                    console.warn('Unknown date format:', rawDate);
                    return false;
                }

                if (currentFilters.dateFrom) {
                    const fromDate = new Date(currentFilters.dateFrom);
                    if (questionDate < fromDate) return false;
                }

                if (currentFilters.dateTo) {
                    const toDate = new Date(currentFilters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (questionDate > toDate) return false;
                }

                return true;
            });
        }

        return filtered;
    };

    // Effect to apply filters when questions or filters change
    useEffect(() => {
        const filtered = applyFilters(questions, filters);
        setFilteredQuestions(filtered);
    }, [questions, filters]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải câu hỏi của bạn...</p>
            </div>
        );
    }

    return (
        <div className={styles.myQuestions}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        Câu hỏi của tôi
                    </h2>
                    <p className={styles.subtitle}>
                        Theo dõi và quản lý các câu hỏi bạn đã đặt
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.refreshBtn}
                        onClick={handleRefresh}
                        disabled={loading}
                        title="Làm mới dữ liệu"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23,4 23,10 17,10"></polyline>
                            <polyline points="1,20 1,14 7,14"></polyline>
                            <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,4.36L23,14"></path>
                        </svg>
                    </button>
                    <button
                        className={styles.newQuestionBtn}
                        onClick={handleCreateNew}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Đặt câu hỏi mới
                    </button>
                </div>            </div>

            {/* Advanced Filter Component */}
            <AdvancedFilter
                onFilterChange={handleFilterChange}
                statusOptions={[
                    { value: 'PROCESSING', label: 'Đang xử lý' },
                    { value: 'CONFIRMED', label: 'Đã xác nhận' },
                    { value: 'ANSWERED', label: 'Đã trả lời' },
                    { value: 'CANCELED', label: 'Đã hủy' }
                ]}
                placeholder="Tìm kiếm theo tiêu đề, nội dung câu hỏi..."
                showDateFilter={true}
                showStatusFilter={true}
            />

            {questions.length > 0 && (
                <div className={styles.statsInfo}>
                    Hiển thị: {filteredQuestions.length}/{questions.length} câu hỏi
                </div>
            )}

            {filteredQuestions.length === 0 ? (
                questions.length > 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <h3>Không tìm thấy kết quả</h3>
                        <p>Không có câu hỏi nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh tiêu chí tìm kiếm.</p>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <h3>Chưa có câu hỏi nào</h3>
                        <p>Bạn chưa tạo câu hỏi nào. Hãy bắt đầu đặt câu hỏi để nhận tư vấn từ các chuyên gia!</p>
                        <button
                            className={styles.createBtn}
                            onClick={handleCreateNew}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Đặt câu hỏi đầu tiên
                        </button>
                    </div>
                )
            ) : (<>
                {/* Mobile Card View */}
                <div ref={questionsListRef} className={styles.mobileView}>
                    {filteredQuestions.map(question => (
                        <div
                            key={question.id}
                            className={styles.questionCard}
                            onClick={() => handleOpenModal(question)}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.categoryTag}>
                                    {question.categoryName || 'Chưa phân loại'}
                                </div>
                                <span className={`${styles.statusBadge} ${STATUS_CLASS[question.status] || ''}`}>
                                    {getStatusText(question.status)}
                                </span>
                            </div>
                            <div className={styles.cardContent}>
                                <p className={styles.questionContent}>
                                    {truncateContent(question.content)}
                                </p>
                            </div>
                            <div className={styles.cardFooter}>
                                <div className={styles.dateInfo}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    {formatDate(question.createdAt)}
                                </div>
                                <div className={styles.answerStatus}>
                                    {question.answer ? (
                                        <span className={styles.hasAnswer}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20,6 9,17 4,12"></polyline>
                                            </svg>
                                            Đã trả lời
                                        </span>
                                    ) : (
                                        <span className={styles.noAnswer}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12,6 12,12 16,14"></polyline>
                                            </svg>
                                            Chờ trả lời
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className={styles.desktopView}>
                    <div className={styles.tableContainer}>
                        <table className={styles.questionsTable}>
                            <thead>
                                <tr>
                                    <th>Nội dung câu hỏi</th>
                                    <th>Danh mục</th>
                                    <th>Ngày tạo</th>
                                    <th>Trạng thái</th>
                                    <th>Câu trả lời</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredQuestions.map(question => (
                                    <tr key={question.id}>
                                        <td>
                                            <div className={styles.questionContentCell}>
                                                {truncateContent(question.content)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.categoryTagTable}>
                                                {question.categoryName || 'Chưa phân loại'}
                                            </span>
                                        </td>
                                        <td className={styles.dateCell}>
                                            {formatDate(question.createdAt)}
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${STATUS_CLASS[question.status] || ''}`}>
                                                {getStatusText(question.status)}
                                            </span>
                                        </td>
                                        <td>
                                            {question.answer ? (
                                                <div className={styles.answerPreview}>
                                                    {truncateContent(question.answer, 80)}
                                                    {question.answer.length > 80 && (
                                                        <span className={styles.readMore}> ...xem thêm</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className={styles.noAnswerText}>Chưa có câu trả lời</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => handleOpenModal(question)}
                                                title="Xem chi tiết"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className={styles.pagination}>                            <button
                        className={styles.pageBtn}
                        onClick={() => handlePageChange(0)}
                        disabled={currentPage === 0}
                        title="Trang đầu"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="11,17 6,12 11,7"></polyline>
                            <polyline points="18,17 13,12 18,7"></polyline>
                        </svg>
                    </button>                            <button
                        className={styles.pageBtn}
                        onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        title="Trang trước"
                    >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15,18 9,12 15,6"></polyline>
                            </svg>
                        </button>

                        <div className={styles.pageNumbers}>
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i;
                                } else if (currentPage < 3) {
                                    pageNum = i;
                                } else if (currentPage >= totalPages - 3) {
                                    pageNum = totalPages - 5 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (<button
                                    key={pageNum}
                                    className={`${styles.pageNum} ${pageNum === currentPage ? styles.active : ''}`}
                                    onClick={() => handlePageChange(pageNum)}
                                >
                                    {pageNum + 1}
                                </button>
                                );
                            })}
                        </div>                        <button
                            className={styles.pageBtn}
                            onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                            disabled={currentPage === totalPages - 1}
                            title="Trang sau"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                        </button>                        <button
                            className={styles.pageBtn}
                            onClick={() => handlePageChange(totalPages - 1)}
                            disabled={currentPage === totalPages - 1}
                            title="Trang cuối"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="13,17 18,12 13,7"></polyline>
                                <polyline points="6,17 11,12 6,7"></polyline>
                            </svg>
                        </button>
                    </div>
                )}
            </>
            )}

            {/* Modal */}
            {modalOpen && selectedQuestion && (
                <div
                    className={styles.modalBackdrop}
                    onClick={handleModalBackdropClick}
                >
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết câu hỏi</h3>
                            <button
                                className={styles.closeBtn}
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
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <strong>Danh mục:</strong>
                                        <span className={styles.categoryTagModal}>
                                            {selectedQuestion.categoryName || 'Chưa phân loại'}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <strong>Ngày tạo:</strong>
                                        <span>{formatDate(selectedQuestion.createdAt)}</span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <strong>Trạng thái:</strong>
                                        <span className={`${styles.statusBadge} ${STATUS_CLASS[selectedQuestion.status] || ''}`}>
                                            {getStatusText(selectedQuestion.status)}
                                        </span>
                                    </div>
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
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            Trả lời bởi: <strong>{selectedQuestion.replierName}</strong>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.modalBtn}
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