import React from 'react';
import './Pagination.css';

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
        <nav className="pagination" aria-label="Điều hướng trang">
            <div className="pagination-container">
                {/* Previous button */}
                <button
                    className="pagination-btn prev"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    aria-label="Trang trước"
                >
                    ‹ Trước
                </button>

                {/* First page */}
                {visiblePages[0] > 0 && (
                    <>
                        <button
                            className="pagination-btn"
                            onClick={() => onPageChange(0)}
                        >
                            1
                        </button>
                        {visiblePages[0] > 1 && <span className="pagination-dots">...</span>}
                    </>
                )}

                {/* Visible pages */}
                {visiblePages.map(page => (
                    <button
                        key={page}
                        className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
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
                            <span className="pagination-dots">...</span>
                        )}
                        <button
                            className="pagination-btn"
                            onClick={() => onPageChange(totalPages - 1)}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                {/* Next button */}
                <button
                    className="pagination-btn next"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    aria-label="Trang sau"
                >
                    Sau ›
                </button>
            </div>

            {/* Page info */}
            <div className="pagination-info">
                Trang {currentPage + 1} / {totalPages}
            </div>
        </nav>
    );
};

export default Pagination;