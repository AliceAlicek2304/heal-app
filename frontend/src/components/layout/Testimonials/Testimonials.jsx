import React, { useState, useEffect } from "react";
import { ratingService } from "../../../services/ratingService";
import { authService } from "../../../services/authService";
import styles from "./Testimonials.module.css";

const Testimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                setLoading(true);
                setError(null);

                const result = await ratingService.getTestimonials(5);

                if (result.success) {
                    setTestimonials(result.data);
                } else {
                    throw new Error(result.message || 'Failed to fetch testimonials');
                }
            } catch (error) {
                console.error('Error fetching testimonials:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    const nextTestimonial = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevTestimonial = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
        );
    };

    const goToTestimonial = (index) => {
        setCurrentIndex(index);
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <svg
                key={index}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={index < rating ? "#fbbf24" : "#e5e7eb"}
                stroke="currentColor"
                strokeWidth="1"
            >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
            </svg>
        ));
    };

    const getServiceName = (targetType, targetName) => {
        switch (targetType) {
            case 'CONSULTANT':
                return `Tư vấn với ${targetName}`;
            case 'STI_SERVICE':
                return `Xét nghiệm ${targetName}`;
            case 'STI_PACKAGE':
                return `Gói ${targetName}`;
            default:
                return targetName;
        }
    };

    const getMaskedUserName = (fullName) => {
        if (!fullName) return 'Khách hàng';

        const names = fullName.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0) + '*'.repeat(names[0].length - 1);
        }

        const firstName = names[0];
        const lastName = names[names.length - 1];

        return firstName.charAt(0) + '*'.repeat(firstName.length - 1) + ' ' +
            lastName.charAt(0) + '*'.repeat(lastName.length - 1);
    };

    if (loading) {
        return (
            <section className={styles.testimonials}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>
                            Khách hàng <span className={styles.highlight}>nói gì</span> về chúng tôi
                        </h2>
                        <p className={styles.description}>
                            Những đánh giá chân thực từ khách hàng đã sử dụng dịch vụ của HealApp
                        </p>
                    </div>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingCard}>
                            <div className={styles.loadingQuote}></div>
                            <div className={styles.loadingContent}></div>
                            <div className={styles.loadingAuthor}></div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.testimonials}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>
                            Khách hàng <span className={styles.highlight}>nói gì</span> về chúng tôi
                        </h2>
                        <p className={styles.description}>
                            Những đánh giá chân thực từ khách hàng đã sử dụng dịch vụ của HealApp
                        </p>
                    </div>
                    <div className={styles.errorContainer}>
                        <div className={styles.errorMessage}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            <h3>Không thể tải đánh giá</h3>
                            <p>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className={styles.retryButton}
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (testimonials.length === 0) {
        return (
            <section className={styles.testimonials}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>
                            Khách hàng <span className={styles.highlight}>nói gì</span> về chúng tôi
                        </h2>
                        <p className={styles.description}>
                            Những đánh giá chân thực từ khách hàng đã sử dụng dịch vụ của HealApp
                        </p>
                    </div>
                    <div className={styles.emptyContainer}>
                        <div className={styles.emptyMessage}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <h3>Chưa có đánh giá nào</h3>
                            <p>Hãy là người đầu tiên đánh giá dịch vụ của chúng tôi</p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const currentTestimonial = testimonials[currentIndex];

    return (
        <section className={styles.testimonials}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Khách hàng <span className={styles.highlight}>nói gì</span> về chúng tôi
                    </h2>
                    <p className={styles.description}>
                        Những đánh giá chân thực từ khách hàng đã sử dụng dịch vụ của HealApp
                    </p>
                </div>

                <div className={styles.testimonialContainer}>
                    <div className={styles.testimonialCard}>
                        <div className={styles.quoteIcon}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                            </svg>
                        </div>

                        <div className={styles.testimonialContent}>
                            <p className={styles.testimonialText}>
                                "{currentTestimonial.comment}"
                            </p>
                        </div>

                        <div className={styles.testimonialAuthor}>
                            <div className={styles.authorInfo}>
                                <img
                                    src={authService.getAvatarUrl(currentTestimonial.userAvatar)}
                                    alt={currentTestimonial.userFullName}
                                    className={styles.authorAvatar}
                                    onError={(e) => {
                                        e.target.src = authService.getAvatarUrl();
                                    }}
                                />
                                <div className={styles.authorDetails}>
                                    <h4 className={styles.authorName}>{getMaskedUserName(currentTestimonial.userFullName)}</h4>
                                    <p className={styles.serviceUsed}>
                                        {getServiceName(currentTestimonial.targetType, currentTestimonial.targetName)}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.rating}>
                                {renderStars(currentTestimonial.rating)}
                            </div>
                        </div>
                    </div>

                    <div className={styles.navigation}>
                        <button
                            className={styles.navButton}
                            onClick={prevTestimonial}
                            aria-label="Testimonial trước"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15,18 9,12 15,6"></polyline>
                            </svg>
                        </button>

                        <div className={styles.dots}>
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                                    onClick={() => goToTestimonial(index)}
                                    aria-label={`Chuyển đến đánh giá ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            className={styles.navButton}
                            onClick={nextTestimonial}
                            aria-label="Testimonial tiếp theo"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials; 