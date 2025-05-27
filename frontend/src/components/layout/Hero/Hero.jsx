import React from "react";
import styles from "./Hero.module.css";

const Hero = () => {
    return (
        <section className={styles.hero}>
            <div className={styles.heroContainer}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Chăm sóc sức khỏe <span className={styles.highlight}>toàn diện</span> cho bạn
                    </h1>
                    <p className={styles.heroDescription}>
                        HealApp cung cấp các dịch vụ y tế chất lượng cao với đội ngũ chuyên gia
                        giàu kinh nghiệm. Từ xét nghiệm, tư vấn đến theo dõi sức khỏe hàng ngày.
                    </p>

                    <div className={styles.heroFeatures}>
                        <div className={styles.featureItem}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9,11 12,14 22,4"></polyline>
                                <path d="M21,12v7a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2V5a2,2 0 0,1,2-2h11"></path>
                            </svg>
                            <span>Đội ngũ chuyên gia giàu kinh nghiệm</span>
                        </div>
                        <div className={styles.featureItem}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            <span>Hỗ trợ 24/7</span>
                        </div>
                        <div className={styles.featureItem}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Bảo mật thông tin tuyệt đối</span>
                        </div>
                    </div>

                    <div className={styles.heroActions}>
                        <button className={styles.btnPrimary}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13"></path>
                                <polygon points="22,2 15,22 11,13 2,9"></polygon>
                            </svg>
                            Bắt đầu ngay
                        </button>
                        <button className={styles.btnSecondary}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="10,8 16,12 10,16 10,8"></polygon>
                            </svg>
                            Tìm hiểu thêm
                        </button>
                    </div>

                    <div className={styles.heroStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>10K+</span>
                            <span className={styles.statLabel}>Bệnh nhân tin tưởng</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>50+</span>
                            <span className={styles.statLabel}>Chuyên gia y tế</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>24/7</span>
                            <span className={styles.statLabel}>Hỗ trợ khách hàng</span>
                        </div>
                    </div>
                </div>

                <div className={styles.heroImage}>
                    <div className={styles.imageWrapper}>
                        <img src="/image/img1.jpg" alt="Healthcare" className={styles.heroImg} />
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
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                            <div>
                                <span className={styles.cardTitle}>Theo dõi sức khỏe</span>
                                <span className={styles.cardDesc}>Realtime monitoring</span>
                            </div>
                        </div>

                        <div className={`${styles.floatingCard} ${styles.card2}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <div>
                                <span className={styles.cardTitle}>Tư vấn trực tuyến</span>
                                <span className={styles.cardDesc}>Video consultation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;