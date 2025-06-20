import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        // Adjust startPage if we're near the end
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // Previous button
        pages.push(
            <button
                key="prev"
                className={`${styles.pageBtn} ${styles.navBtn}`}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                ←
            </button>
        );

        // First page if not visible
        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    className={styles.pageBtn}
                    onClick={() => onPageChange(1)}
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(<span key="dots1" className={styles.dots}>...</span>);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={`${styles.pageBtn} ${i === currentPage ? styles.active : ''}`}
                    onClick={() => onPageChange(i)}
                >
                    {i}
                </button>
            );
        }

        // Last page if not visible
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="dots2" className={styles.dots}>...</span>);
            }
            pages.push(
                <button
                    key={totalPages}
                    className={styles.pageBtn}
                    onClick={() => onPageChange(totalPages)}
                >
                    {totalPages}
                </button>
            );
        }

        // Next button
        pages.push(
            <button
                key="next"
                className={`${styles.pageBtn} ${styles.navBtn}`}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                →
            </button>
        );

        return pages;
    };

    return (
        <div className={styles.pagination}>
            <div className={styles.pageButtons}>
                {renderPageNumbers()}
            </div>
            <div className={styles.pageInfo}>
                Trang {currentPage} / {totalPages}
            </div>
        </div>
    );
};

export default Pagination;
