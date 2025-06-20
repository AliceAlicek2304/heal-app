import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import Pagination from '../common/Pagination/Pagination';
import { questionService } from '../../services/questionService';
import styles from './ManagerQuestion.module.css';

const STATUS_CONFIG = {
    PROCESSING: {
        label: 'Đang xử lý',
        className: styles.statusProcessing,
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
        )
    },
    CONFIRMED: {
        label: 'Đã xác nhận',
        className: styles.statusConfirmed,
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        )
    },
    ANSWERED: {
        label: 'Đã trả lời',
        className: styles.statusAnswered,
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <path d="M9 12l2 2 4-4"></path>
            </svg>
        )
    },
    CANCELED: {
        label: 'Đã hủy',
        className: styles.statusCanceled,
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        )
    }
};

const ManagerQuestion = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAnswerModal, setShowAnswerModal] = useState(false); const [answerText, setAnswerText] = useState('');
    const [answerLoading, setAnswerLoading] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;
    const questionsListRef = useRef(null);

    const isStaff = user?.role === 'STAFF';
    const isConsultant = user?.role === 'CONSULTANT';

    // Handle page change with smooth scroll
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        if (questionsListRef.current) {
            questionsListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }; useEffect(() => {
        if (isConsultant && statusFilter === 'ALL') {
            // Keep ALL as default for consultants now that it's available
            setStatusFilter('ALL');
        }
    }, [isConsultant]);

    useEffect(() => {
        fetchQuestions();
    }, [currentPage, statusFilter]); const fetchQuestions = async () => {
        try {
            setLoading(true);
            const params = { page: currentPage, size: pageSize, sort: 'createdAt', direction: 'DESC' };
            let response;

            if ((isStaff && statusFilter === 'ALL') || (isConsultant && statusFilter === 'ALL')) {
                if (isStaff) {
                    response = await questionService.getAllQuestionsForStaff(params);
                } else if (isConsultant) {
                    // For consultants with "ALL" filter, get both CONFIRMED and ANSWERED
                    const confirmedResponse = await questionService.getQuestionsByStatus({ ...params, status: 'CONFIRMED' });
                    const answeredResponse = await questionService.getQuestionsByStatus({ ...params, status: 'ANSWERED' });

                    if (confirmedResponse.success && answeredResponse.success) {
                        const confirmedQuestions = confirmedResponse.data.content || [];
                        const answeredQuestions = answeredResponse.data.content || [];
                        const allQuestions = [...confirmedQuestions, ...answeredQuestions];

                        // Sort by createdAt descending                                                                                                                                             
                        allQuestions.sort((a, b) => {
                            const dateA = new Date(a.createdAt);
                            const dateB = new Date(b.createdAt);
                            return dateB.getTime() - dateA.getTime();
                        });

                        response = {
                            success: true,
                            data: {
                                content: allQuestions,
                                totalPages: Math.max(confirmedResponse.data.totalPages || 0, answeredResponse.data.totalPages || 0),
                                totalElements: (confirmedResponse.data.totalElements || 0) + (answeredResponse.data.totalElements || 0)
                            }
                        };
                    } else {
                        response = confirmedResponse.success ? confirmedResponse : answeredResponse;
                    }
                }
            } else {
                response = await questionService.getQuestionsByStatus({ ...params, status: statusFilter });
            }

            if (response.success && response.data) {
                const normalized = (response.data.content || []).map(q => ({
                    ...q,
                    status: typeof q.status === 'string'
                        ? q.status.toUpperCase()
                        : (q.status?.name || '').toUpperCase()
                }));
                setQuestions(normalized);
                setTotalPages(response.data.totalPages || 0);
                setTotalElements(response.data.totalElements || 0);
            } else {
                toast.error(response.message || 'Không thể tải danh sách câu hỏi');
                setQuestions([]);
                setTotalPages(0);
                setTotalElements(0);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
            setQuestions([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmQuestion = async (questionId) => {
        try {
            const response = await questionService.updateQuestionStatus(questionId, {
                status: 'CONFIRMED'
            });

            if (response.success) {
                toast.success('Xác nhận câu hỏi thành công');
                fetchQuestions();
            } else {
                toast.error(response.message || 'Không thể xác nhận câu hỏi');
            }
        } catch (error) {
            console.error('Error confirming question:', error);
            toast.error('Có lỗi xảy ra khi xác nhận câu hỏi');
        }
    };

    const handleAnswerQuestion = async () => {
        if (!answerText.trim()) {
            toast.error('Vui lòng nhập câu trả lời');
            return;
        }

        try {
            setAnswerLoading(true);
            const response = await questionService.answerQuestion(selectedQuestion.id, {
                answer: answerText.trim()
            });

            if (response.success) {
                toast.success('Trả lời câu hỏi thành công');
                setShowAnswerModal(false);
                setAnswerText('');
                setSelectedQuestion(null);
                fetchQuestions();
            } else {
                toast.error(response.message || 'Không thể trả lời câu hỏi');
            }
        } catch (error) {
            console.error('Error answering question:', error);
            toast.error('Có lỗi xảy ra khi trả lời câu hỏi');
        } finally {
            setAnswerLoading(false);
        }
    };

    const handleViewDetail = (question) => {
        setSelectedQuestion(question);
        setShowDetailModal(true);
    };

    const handleOpenAnswerModal = (question) => {
        setSelectedQuestion(question);
        setAnswerText('');
        setShowAnswerModal(true);
    };

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || {
            label: status,
            className: styles.statusDefault,
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            )
        };
    }; const filteredQuestions = questions.filter(question => {
        const matchesSearch = searchTerm === '' ||
            question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Calculate client-side pagination for filtered results
    const itemsPerPage = 10;
    const totalFilteredPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredQuestions.slice(startIndex, endIndex); const getFilterOptions = () => {
        if (isStaff) {
            return [
                { value: 'ALL', label: 'Tất cả' },
                { value: 'PROCESSING', label: 'Đang xử lý' },
                { value: 'CONFIRMED', label: 'Đã xác nhận' },
                { value: 'ANSWERED', label: 'Đã trả lời' }
            ];
        } else if (isConsultant) {
            return [
                { value: 'ALL', label: 'Tất cả' },
                { value: 'CONFIRMED', label: 'Đã xác nhận' },
                { value: 'ANSWERED', label: 'Đã trả lời' }
            ];
        }
        return [];
    };

    const handleRetry = () => {
        toast.info('Đang tải lại dữ liệu...');
        fetchQuestions();
    };

    const handleModalBackdropClick = (e, closeModal) => {
        if (e.target.classList.contains(styles.modalBackdrop)) {
            closeModal();
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
                <p>Đang tải danh sách câu hỏi...</p>
            </div>
        );
    }

    return (
        <div className={styles.managerQuestion}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        Quản lý câu hỏi
                    </h2>
                    <p className={styles.subtitle}>
                        {isStaff ? 'Xử lý và trả lời các câu hỏi từ người dùng' : 'Trả lời các câu hỏi đã được xác nhận'}
                    </p>
                </div>
                <button
                    className={styles.refreshBtn}
                    onClick={handleRetry}
                    disabled={loading}
                    title="Làm mới dữ liệu"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <polyline points="1,20 1,14 7,14"></polyline>
                        <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,4.36L23,14"></path>
                    </svg>
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Trạng thái:</label>                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(0); // Reset to first page when filter changes
                        }}
                        className={styles.filterSelect}
                    >
                        {getFilterOptions().map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Tìm kiếm:</label>
                    <div className={styles.searchContainer}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>                        <input
                            type="text"
                            placeholder="Tìm theo nội dung hoặc tên người hỏi..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(0); // Reset to first page when search changes
                            }}
                            className={styles.searchInput}
                        />
                    </div>
                </div>                <div className={styles.filterStats}>
                    <span className={styles.totalCount}>Tổng số: {filteredQuestions.length} câu hỏi</span>
                </div>
            </div>            {/* Content */}
            <div className={styles.content}>
                {filteredQuestions.length > 0 ? (
                    <>
                        {/* Mobile Card View */}
                        <div ref={questionsListRef} className={styles.mobileView}>
                            {currentItems.map(question => {
                                const statusConfig = getStatusConfig(question.status);
                                return (
                                    <div key={question.id} className={styles.questionCard}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.questionInfo}>
                                                <h3 className={styles.questionContent}>
                                                    {question.content.length > 100
                                                        ? question.content.substring(0, 100) + '...'
                                                        : question.content
                                                    }
                                                </h3>
                                                <div className={styles.questionMeta}>
                                                    <span className={styles.customerName}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                        {question.customerName || 'Chưa có tên'}
                                                    </span>
                                                    <span className={styles.categoryName}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                                        </svg>
                                                        {question.categoryName || 'Chưa phân loại'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`${styles.statusBadge} ${statusConfig.className}`}>
                                                {statusConfig.icon}
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <span className={styles.dateInfo}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                {formatDate(question.createdAt)}
                                            </span>

                                            <div className={styles.cardActions}>
                                                {isStaff && question.status === 'PROCESSING' && (
                                                    <button
                                                        className={styles.confirmBtn}
                                                        onClick={() => handleConfirmQuestion(question.id)}
                                                        title="Xác nhận câu hỏi"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="20,6 9,17 4,12"></polyline>
                                                        </svg>
                                                        Xác nhận
                                                    </button>
                                                )}

                                                {question.status === 'CONFIRMED' && (
                                                    <button
                                                        className={styles.answerBtn}
                                                        onClick={() => handleOpenAnswerModal(question)}
                                                        title="Trả lời câu hỏi"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="9,11 12,14 22,4"></polyline>
                                                            <path d="M21,12v7a2,2 0 0,1 -2,2H5a2,2 0 0,1 -2,-2V5a2,2 0 0,1 2,-2h11"></path>
                                                        </svg>
                                                        Trả lời
                                                    </button>
                                                )}

                                                <button
                                                    className={styles.viewBtn}
                                                    onClick={() => handleViewDetail(question)}
                                                    title="Xem chi tiết"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                    Xem
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className={styles.desktopView}>
                            <div className={styles.tableContainer}>
                                <table className={styles.questionsTable}>
                                    <thead>
                                        <tr>
                                            <th>Nội dung câu hỏi</th>
                                            <th>Người hỏi</th>
                                            <th>Danh mục</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày tạo</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>                                    <tbody>
                                        {currentItems.map(question => {
                                            const statusConfig = getStatusConfig(question.status);
                                            return (
                                                <tr key={question.id}>
                                                    <td className={styles.questionContentCell}>
                                                        <div className={styles.questionContentTable}>
                                                            {question.content.length > 80
                                                                ? question.content.substring(0, 80) + '...'
                                                                : question.content
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className={styles.customerCell}>
                                                        <div className={styles.customerInfo}>
                                                            <span className={styles.customerNameTable}>
                                                                {question.customerName || 'Chưa có tên'}
                                                            </span>
                                                            <small className={styles.customerEmail}>
                                                                {question.customerEmail || 'Chưa có email'}
                                                            </small>
                                                        </div>
                                                    </td>
                                                    <td className={styles.categoryCell}>
                                                        <span className={styles.categoryTag}>
                                                            {question.categoryName || 'Chưa phân loại'}
                                                        </span>
                                                    </td>
                                                    <td className={styles.statusCell}>
                                                        <span className={`${styles.statusBadge} ${statusConfig.className}`}>
                                                            {statusConfig.icon}
                                                            {statusConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className={styles.dateCell}>
                                                        {formatDate(question.createdAt)}
                                                    </td>
                                                    <td className={styles.actionsCell}>
                                                        <div className={styles.actionButtons}>
                                                            {isStaff && question.status === 'PROCESSING' && (
                                                                <button
                                                                    className={styles.actionBtn}
                                                                    onClick={() => handleConfirmQuestion(question.id)}
                                                                    title="Xác nhận câu hỏi"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="20,6 9,17 4,12"></polyline>
                                                                    </svg>
                                                                    Xác nhận
                                                                </button>
                                                            )}

                                                            {question.status === 'CONFIRMED' && (
                                                                <button
                                                                    className={`${styles.actionBtn} ${styles.successBtn}`}
                                                                    onClick={() => handleOpenAnswerModal(question)}
                                                                    title="Trả lời câu hỏi"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="9,11 12,14 22,4"></polyline>
                                                                        <path d="M21,12v7a2,2 0 0,1 -2,2H5a2,2 0 0,1 -2,-2V5a2,2 0 0,1 2,-2h11"></path>
                                                                    </svg>
                                                                    Trả lời
                                                                </button>
                                                            )}

                                                            <button
                                                                className={`${styles.actionBtn} ${styles.infoBtn}`}
                                                                onClick={() => handleViewDetail(question)}
                                                                title="Xem chi tiết"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                </svg>
                                                                Xem
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>                        {/* Pagination */}
                        {totalFilteredPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalFilteredPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <h3>Không có câu hỏi nào</h3>
                        <p>Chưa có câu hỏi nào phù hợp với bộ lọc hiện tại.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedQuestion && (
                <div className={styles.modalBackdrop} onClick={(e) => handleModalBackdropClick(e, () => setShowDetailModal(false))}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết câu hỏi #{selectedQuestion.id}</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowDetailModal(false)}
                                aria-label="Đóng"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.detailSection}>
                                <h4>Thông tin câu hỏi</h4>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Trạng thái:</span>
                                        <span className={`${styles.statusBadge} ${getStatusConfig(selectedQuestion.status).className}`}>
                                            {getStatusConfig(selectedQuestion.status).icon}
                                            {getStatusConfig(selectedQuestion.status).label}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Danh mục:</span>
                                        <span className={styles.value}>{selectedQuestion.categoryName || 'Chưa phân loại'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Ngày tạo:</span>
                                        <span className={styles.value}>{formatDateTime(selectedQuestion.createdAt)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Người hỏi:</span>
                                        <span className={styles.value}>{selectedQuestion.customerName}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.contentSection}>
                                <h4>Nội dung câu hỏi</h4>
                                <div className={styles.questionContentFull}>
                                    {selectedQuestion.content}
                                </div>
                            </div>

                            {selectedQuestion.answer && (
                                <div className={styles.answerSection}>
                                    <h4>Câu trả lời</h4>
                                    <div className={styles.answerContent}>
                                        {selectedQuestion.answer}
                                    </div>
                                    {selectedQuestion.replierName && (
                                        <div className={styles.answerAuthor}>
                                            <small>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                            {selectedQuestion.status === 'CONFIRMED' && (
                                <button
                                    className={`${styles.modalBtn} ${styles.successBtn}`}
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleOpenAnswerModal(selectedQuestion);
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9,11 12,14 22,4"></polyline>
                                        <path d="M21,12v7a2,2 0 0,1 -2,2H5a2,2 0 0,1 -2,-2V5a2,2 0 0,1 2,-2h11"></path>
                                    </svg>
                                    Trả lời câu hỏi
                                </button>
                            )}
                            <button
                                className={`${styles.modalBtn} ${styles.secondaryBtn}`}
                                onClick={() => setShowDetailModal(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Answer Modal */}
            {showAnswerModal && selectedQuestion && (
                <div className={styles.modalBackdrop} onClick={(e) => handleModalBackdropClick(e, () => setShowAnswerModal(false))}>
                    <div className={`${styles.modal} ${styles.answerModal}`}>
                        <div className={styles.modalHeader}>
                            <h3>Trả lời câu hỏi #{selectedQuestion.id}</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowAnswerModal(false)}
                                aria-label="Đóng"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.questionSummary}>
                                <h4>Câu hỏi:</h4>
                                <div className={styles.questionContentSummary}>
                                    {selectedQuestion.content}
                                </div>
                                <div className={styles.questionMeta}>
                                    <span>Người hỏi: <strong>{selectedQuestion.customerName}</strong></span>
                                    <span>Danh mục: <strong>{selectedQuestion.categoryName || 'Chưa phân loại'}</strong></span>
                                </div>
                            </div>

                            <div className={styles.answerForm}>
                                <h4>Câu trả lời của bạn:</h4>
                                <textarea
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    placeholder="Nhập câu trả lời chi tiết và chuyên nghiệp..."
                                    rows="10"
                                    className={styles.answerTextarea}
                                />
                                <small className={styles.formHint}>
                                    Hãy cung cấp câu trả lời chi tiết, chính xác và dễ hiểu cho người dùng
                                </small>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.modalBtn} ${styles.successBtn}`}
                                onClick={handleAnswerQuestion}
                                disabled={answerLoading || !answerText.trim()}
                            >
                                {answerLoading ? (
                                    <>
                                        <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                        </svg>
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                                        </svg>
                                        Gửi câu trả lời
                                    </>
                                )}
                            </button>
                            <button
                                className={`${styles.modalBtn} ${styles.secondaryBtn}`}
                                onClick={() => setShowAnswerModal(false)}
                                disabled={answerLoading}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerQuestion;