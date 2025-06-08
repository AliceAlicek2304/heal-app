import React from "react";
import { Link } from "react-router-dom";
import styles from "./Hero.module.css";

const Hero = () => {
    return (
        <section className={styles.hero}>
            <div className={styles.heroContainer}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Chăm sóc <span className={styles.highlight}>sức khỏe sinh sản</span> toàn diện
                    </h1>
                    <p className={styles.heroDescription}>
                        HealApp - Nền tảng sức khỏe sinh sản hiện đại, cung cấp các dịch vụ
                        xét nghiệm, tư vấn và theo dõi sức khỏe với sự riêng tư và chuyên nghiệp tuyệt đối.
                    </p>

                    <div className={styles.heroFeatures}>
                        <div className={styles.featureItem}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Bảo mật thông tin tuyệt đối</span>
                        </div>
                        <div className={styles.featureItem}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Đội ngũ chuyên gia y tế giàu kinh nghiệm</span>
                        </div>
                        <div className={styles.featureItem}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            <span>Hỗ trợ tư vấn 24/7</span>
                        </div>
                    </div>

                    <div className={styles.heroActions}>
                        <Link to="/sti-testing" className={styles.btnPrimary}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Đặt lịch xét nghiệm
                        </Link>
                        <Link to="/consultation" className={styles.btnSecondary}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Tư vấn miễn phí
                        </Link>
                    </div>

                    <div className={styles.heroStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>15K+</span>
                            <span className={styles.statLabel}>Người dùng tin tưởng</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>98%</span>
                            <span className={styles.statLabel}>Độ chính xác</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>24/7</span>
                            <span className={styles.statLabel}>Hỗ trợ tư vấn</span>
                        </div>
                    </div>
                </div>

                <div className={styles.heroImage}>
                    <div className={styles.imageWrapper}>
                        <img src="/image/img1.jpg" alt="Healthcare Services" className={styles.heroImg} />
                        <div className={styles.imageOverlay}>
                            <div className={styles.playButton}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5,3 19,12 5,21 5,3"></polygon>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className={styles.floatingCards}>
                        <div className={`${styles.floatingCard} ${styles.card1}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <span className={styles.cardTitle}>Xét nghiệm STI</span>
                                <span className={styles.cardDesc}>Nhanh chóng & chính xác</span>
                            </div>
                        </div>

                        <div className={`${styles.floatingCard} ${styles.card2}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <div>
                                <span className={styles.cardTitle}>Theo dõi chu kỳ</span>
                                <span className={styles.cardDesc}>AI thông minh</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;