import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange, maxVisiblePages = 5 }) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages = [];
        let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

        // Adjust startPage if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <nav className={styles.pagination} aria-label="Điều hướng trang">
            <div className={styles.paginationContainer}>
                {/* Previous button */}
                <button
                    className={`${styles.paginationBtn} ${styles.prev}`}
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    aria-label="Trang trước"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                    <span className={styles.btnText}>Trước</span>
                </button>

                {/* First page */}
                {visiblePages[0] > 0 && (
                    <>
                        <button
                            className={styles.paginationBtn}
                            onClick={() => onPageChange(0)}
                        >
                            1
                        </button>
                        {visiblePages[0] > 1 && (
                            <span className={styles.paginationDots}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="19" cy="12" r="1"></circle>
                                    <circle cx="5" cy="12" r="1"></circle>
                                </svg>
                            </span>
                        )}
                    </>
                )}

                {/* Visible pages */}
                {visiblePages.map(page => (
                    <button
                        key={page}
                        className={`${styles.paginationBtn} ${page === currentPage ? styles.active : ''}`}
                        onClick={() => onPageChange(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                    >
                        {page + 1}
                    </button>
                ))}

                {/* Last page */}
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                    <>
                        {visiblePages[visiblePages.length - 1] < totalPages - 2 && (
                            <span className={styles.paginationDots}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="19" cy="12" r="1"></circle>
                                    <circle cx="5" cy="12" r="1"></circle>
                                </svg>
                            </span>
                        )}
                        <button
                            className={styles.paginationBtn}
                            onClick={() => onPageChange(totalPages - 1)}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                {/* Next button */}
                <button
                    className={`${styles.paginationBtn} ${styles.next}`}
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    aria-label="Trang sau"
                >
                    <span className={styles.btnText}>Sau</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                </button>
            </div>

            {/* Page info */}
            <div className={styles.paginationInfo}>
                <div className={styles.infoContent}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    <span>Trang <strong>{currentPage + 1}</strong> / <strong>{totalPages}</strong></span>
                </div>
            </div>
        </nav>
    );
};

export default Pagination;