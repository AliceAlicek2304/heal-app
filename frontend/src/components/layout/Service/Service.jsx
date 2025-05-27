import React from "react";
import { Link } from "react-router-dom";
import styles from "./Service.module.css";

const Services = () => {
    const services = [
        {
            id: 1,
            title: "Xét nghiệm STIs",
            description: "Xét nghiệm các bệnh lây truyền qua đường tình dục với độ chính xác cao và bảo mật tuyệt đối",
            icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            ),
            link: "/sti-testing",
            color: "#3b82f6"
        },
        {
            id: 2,
            title: "Tư vấn sức khỏe",
            description: "Tư vấn trực tuyến với đội ngũ bác sĩ chuyên nghiệp 24/7, hỗ trợ mọi vấn đề sức khỏe",
            icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            ),
            link: "/consultation",
            color: "#059669"
        },
        {
            id: 3,
            title: "Chu kỳ kinh nguyệt",
            description: "Theo dõi và dự đoán chu kỳ kinh nguyệt một cách chính xác với AI thông minh",
            icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            ),
            link: "/menstrual-cycle",
            color: "#dc2626"
        },
        {
            id: 4,
            title: "Blog sức khỏe",
            description: "Cập nhật những thông tin y tế mới nhất, bài viết chuyên sâu từ các chuyên gia",
            icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
            ),
            link: "/blog",
            color: "#7c3aed"
        },
        {
            id: 5,
            title: "Đặt câu hỏi",
            description: "Đặt câu hỏi trực tiếp với chuyên gia y tế, nhận tư vấn miễn phí và nhanh chóng",
            icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            ),
            link: "/questions",
            color: "#ea580c"
        },
        {
            id: 6,
            title: "Hỗ trợ 24/7",
            description: "Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc của bạn mọi lúc mọi nơi",
            icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
            ),
            link: "/support",
            color: "#0891b2"
        }
    ];

    return (
        <section className={styles.services}>
            <div className={styles.servicesContainer}>
                <div className={styles.servicesHeader}>
                    <h2 className={styles.servicesTitle}>
                        Dịch vụ <span className={styles.highlight}>chăm sóc sức khỏe</span> toàn diện
                    </h2>
                    <p className={styles.servicesDescription}>
                        Khám phá các dịch vụ y tế hiện đại được thiết kế đặc biệt cho nhu cầu chăm sóc sức khỏe của bạn
                    </p>
                </div>

                <div className={styles.servicesGrid}>
                    {services.map((service, index) => (
                        <div
                            key={service.id}
                            className={styles.serviceCard}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div
                                className={styles.serviceIcon}
                                style={{ color: service.color }}
                            >
                                {service.icon}
                            </div>
                            <div className={styles.serviceContent}>
                                <h3 className={styles.serviceTitle}>{service.title}</h3>
                                <p className={styles.serviceDescription}>{service.description}</p>
                            </div>
                            <Link to={service.link} className={styles.serviceLink}>
                                <span>Tìm hiểu thêm</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="7" y1="17" x2="17" y2="7"></line>
                                    <polyline points="7,7 17,7 17,17"></polyline>
                                </svg>
                            </Link>
                            <div
                                className={styles.serviceGlow}
                                style={{ background: `${service.color}15` }}
                            ></div>
                        </div>
                    ))}
                </div>

                <div className={styles.servicesFooter}>
                    <p className={styles.footerText}>
                        Không tìm thấy dịch vụ bạn cần?
                        <Link to="/contact" className={styles.footerLink}>Liên hệ với chúng tôi</Link>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Services;