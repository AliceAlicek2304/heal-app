import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchService } from '../../services/searchService';
import { useToast } from '../../contexts/ToastContext';
import Navbar from '../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './SearchResults.module.css';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [results, setResults] = useState({
        blogs: [],
        questions: [],
        stiServices: [],
        packages: [],
        total: 0
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    useEffect(() => {
        if (query.trim()) {
            setActiveTab(type);
            handleSearch(query, type, 0);
        }
    }, [query, type]);

    const handleSearch = async (searchQuery, searchType = 'all', page = 0) => {
        if (!searchQuery.trim()) {
            toast.error('Vui lòng nhập từ khóa tìm kiếm');
            return;
        }

        setLoading(true); try {
            let response;

            if (searchType === 'blog') {
                response = await searchService.searchBlogs(searchQuery, { page, size: 10 });
            } else if (searchType === 'question') {
                response = await searchService.searchQuestions(searchQuery, { page, size: 10 });
            } else if (searchType === 'sti') {
                response = await searchService.searchSTIServices(searchQuery);
                if (response.success) {
                    response = {
                        success: true,
                        data: {
                            content: response.data,
                            totalElements: response.data.length,
                            totalPages: 1,
                            size: response.data.length,
                            number: 0
                        }
                    };
                }
            } else if (searchType === 'package') {
                response = await searchService.searchPackages(searchQuery);
                if (response.success) {
                    response = {
                        success: true,
                        data: {
                            content: response.data,
                            totalElements: response.data.length,
                            totalPages: 1,
                            size: response.data.length,
                            number: 0
                        }
                    };
                }
            } else {
                // Tìm kiếm tổng hợp
                const [global, packages] = await Promise.all([
                    searchService.globalSearch(searchQuery, { page, size: 10 }),
                    searchService.searchPackages(searchQuery)
                ]);
                if (global.success) {
                    setResults({
                        blogs: global.data.blogs || [],
                        questions: global.data.questions || [],
                        stiServices: global.data.stiServices || [],
                        packages: packages.success ? packages.data : [],
                        total: (global.data.totalElements || 0) + (packages.success ? packages.data.length : 0)
                    });
                    return;
                }
            }

            if (response.success) {
                if (searchType === 'all') {
                    // Đã xử lý ở trên
                } else {
                    setResults({
                        blogs: searchType === 'blog' ? response.data.content || [] : [],
                        questions: searchType === 'question' ? response.data.content || [] : [],
                        stiServices: searchType === 'sti' ? response.data.content || [] : [],
                        packages: searchType === 'package' ? response.data.content || [] : [],
                        total: response.data.totalElements || 0
                    });
                    setTotalPages(response.data.totalPages || 0);
                    setCurrentPage(page);
                }
            } else {
                setResults({ blogs: [], questions: [], stiServices: [], packages: [], total: 0 });
                toast.error(response.message || 'Không tìm thấy kết quả');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tìm kiếm');
            setResults({ blogs: [], questions: [], stiServices: [], packages: [], total: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (newType) => {
        setActiveTab(newType);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('type', newType);
        navigate(`/search?${newSearchParams.toString()}`, { replace: true });
    };

    const handlePageChange = (newPage) => {
        handleSearch(query, activeTab, newPage);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const highlightSearchTerm = (text, searchTerm) => {
        if (!text || !searchTerm) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    };

    return (
        <div className={styles.searchPage}>
            <Navbar />

            <div className={styles.container}>
                <div className={styles.searchHeader}>
                    <h1>Kết quả tìm kiếm</h1>
                    {query && (
                        <p className={styles.searchQuery}>
                            Tìm kiếm cho: <strong>"{query}"</strong>
                            {results.total > 0 && (
                                <span className={styles.resultCount}>
                                    ({results.total} kết quả)
                                </span>
                            )}
                        </p>
                    )}
                </div>

                {/* Tabs */}
                <div className={styles.searchTabs}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'all' ? styles.active : ''}`}
                        onClick={() => handleTabChange('all')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                        Tất cả
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'blog' ? styles.active : ''}`}
                        onClick={() => handleTabChange('blog')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                        </svg>
                        Bài viết ({results.blogs.length})
                    </button>                    <button
                        className={`${styles.tabBtn} ${activeTab === 'question' ? styles.active : ''}`}
                        onClick={() => handleTabChange('question')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"></path>
                        </svg>
                        Câu hỏi ({results.questions.length})
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'sti' ? styles.active : ''}`}
                        onClick={() => handleTabChange('sti')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Dịch vụ STI ({results.stiServices.length})
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'package' ? styles.active : ''}`}
                        onClick={() => handleTabChange('package')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <path d="M16 3v4a1 1 0 0 0 1 1h4"></path>
                        </svg>
                        Gói xét nghiệm ({results.packages.length})
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className={styles.loadingContainer}>
                        <LoadingSpinner />
                        <p>Đang tìm kiếm...</p>
                    </div>
                )}

                {/* Results */}
                {!loading && (
                    <div className={styles.searchResults}>
                        {/* Blog Results */}
                        {(activeTab === 'all' || activeTab === 'blog') && results.blogs.length > 0 && (
                            <div className={styles.resultSection}>
                                {activeTab === 'all' && <h2>Bài viết</h2>}
                                <div className={styles.blogResults}>
                                    {results.blogs.map((blog) => (
                                        <div key={blog.id} className={styles.blogCard}>
                                            <div className={styles.blogThumbnail}>
                                                <img
                                                    src={blog.thumbnailUrl || '/image/img1.jpg'}
                                                    alt={blog.title}
                                                    onError={(e) => {
                                                        e.target.src = '/image/img1.jpg';
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.blogContent}>
                                                <h3
                                                    className={styles.blogTitle}
                                                    onClick={() => navigate(`/blog/${blog.id}`)}
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightSearchTerm(blog.title, query)
                                                    }}
                                                />
                                                <p
                                                    className={styles.blogSummary}
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightSearchTerm(blog.content?.substring(0, 200) + '...', query)
                                                    }}
                                                />
                                                <div className={styles.blogMeta}>
                                                    <span className={styles.author}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                        {blog.authorName}
                                                    </span>
                                                    <span className={styles.date}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        </svg>
                                                        {formatDate(blog.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}                        {/* Question Results */}
                        {(activeTab === 'all' || activeTab === 'question') && results.questions.length > 0 && (
                            <div className={styles.resultSection}>
                                {activeTab === 'all' && <h2>Câu hỏi</h2>}
                                <div className={styles.questionResults}>                                    {results.questions.map((question) => (
                                    <div key={question.questionId} className={styles.questionCard}>
                                        <h3
                                            className={styles.questionTitle}
                                            dangerouslySetInnerHTML={{
                                                __html: highlightSearchTerm(question.content?.substring(0, 100) + '...', query)
                                            }}
                                        />
                                        <p
                                            className={styles.questionContent}
                                            dangerouslySetInnerHTML={{
                                                __html: highlightSearchTerm(question.answer?.substring(0, 150) + '...', query)
                                            }}
                                        />
                                        <div className={styles.questionMeta}>
                                            <span className={styles.status}>
                                                <span className={styles.answered}>✅ Đã trả lời</span>
                                            </span>
                                            <span className={styles.date}>
                                                {formatDate(question.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}

                        {/* STI Services Results */}
                        {(activeTab === 'all' || activeTab === 'sti') && results.stiServices.length > 0 && (
                            <div className={styles.resultSection}>
                                {activeTab === 'all' && <h2>Dịch vụ STI</h2>}
                                <div className={styles.stiResults}>
                                    {results.stiServices.map((service) => (
                                        <div key={service.serviceId} className={styles.stiCard}>
                                            <div className={styles.stiContent}>                                                <h3
                                                className={styles.stiTitle}
                                                onClick={() => navigate('/sti-testing', {
                                                    state: { selectedServiceId: service.serviceId }
                                                })}
                                                dangerouslySetInnerHTML={{
                                                    __html: highlightSearchTerm(service.name, query)
                                                }}
                                            />
                                                <p
                                                    className={styles.stiDescription}
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightSearchTerm(service.description?.substring(0, 200) + '...', query)
                                                    }}
                                                />
                                                <div className={styles.stiMeta}>
                                                    <span className={styles.price}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                                        </svg>
                                                        {service.price?.toLocaleString('vi-VN')} VNĐ
                                                    </span>
                                                    <span className={styles.category}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                        Xét nghiệm STI
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STI Packages Results */}
                        {(activeTab === 'all' || activeTab === 'package') && results.packages.length > 0 && (
                            <div className={styles.resultSection}>
                                {activeTab === 'all' && <h2>Gói xét nghiệm STI</h2>}
                                <div className={styles.stiResults}>
                                    {results.packages.map((pkg) => (
                                        <div key={pkg.packageId} className={styles.stiCard}>
                                            <div className={styles.stiContent}>
                                                <h3
                                                    className={styles.stiTitle}
                                                    onClick={() => navigate('/sti-package-detail/' + pkg.packageId)}
                                                    style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightSearchTerm(pkg.name, query)
                                                    }}
                                                />
                                                <p
                                                    className={styles.stiDescription}
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightSearchTerm(pkg.description?.substring(0, 200) + '...', query)
                                                    }}
                                                />
                                                <div className={styles.stiMeta}>
                                                    <span className={styles.price}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                                        </svg>
                                                        {pkg.price?.toLocaleString('vi-VN')} VNĐ
                                                    </span>
                                                    <span className={styles.category}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                            <path d="M16 3v4a1 1 0 0 0 1 1h4"></path>
                                                        </svg>
                                                        Gói xét nghiệm
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && results.total === 0 && query && (
                            <div className={styles.noResults}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="M21 21l-4.35-4.35"></path>
                                </svg>
                                <h3>Không tìm thấy kết quả</h3>
                                <p>Không có kết quả nào cho từ khóa "<strong>{query}</strong>"</p>
                                <div className={styles.suggestions}>
                                    <p>Thử:</p>
                                    <ul>
                                        <li>Kiểm tra chính tả</li>
                                        <li>Sử dụng từ khóa khác</li>
                                        <li>Sử dụng từ khóa ngắn gọn hơn</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {activeTab !== 'all' && totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    className={styles.pageBtn}
                                >
                                    ‹ Trước
                                </button>

                                <span className={styles.pageInfo}>
                                    Trang {currentPage + 1} / {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages - 1}
                                    className={styles.pageBtn}
                                >
                                    Sau ›
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
