import React from "react";
import "./Service.css";

const Services = () => {
    const services = [
        {
            id: 1,
            title: "Xét nghiệm STIs",
            description: "Xét nghiệm các bệnh lây truyền qua đường tình dục với độ chính xác cao",
            icon: "🧪",
            link: "#sti-testing"
        },
        {
            id: 2,
            title: "Tư vấn sức khỏe",
            description: "Tư vấn trực tuyến với đội ngũ bác sĩ chuyên nghiệp",
            icon: "👩‍⚕️",
            link: "#consultation"
        },
        {
            id: 3,
            title: "Tính chu kỳ kinh nguyệt",
            description: "Theo dõi và dự đoán chu kỳ kinh nguyệt một cách chính xác",
            icon: "📅",
            link: "#period-calculator"
        },
        {
            id: 4,
            title: "Blog sức khỏe",
            description: "Cập nhật những thông tin y tế mới nhất và hữu ích",
            icon: "📰",
            link: "#blog"
        },
        {
            id: 5,
            title: "Đặt câu hỏi",
            description: "Đặt câu hỏi trực tiếp với chuyên gia y tế",
            icon: "❓",
            link: "#ask-question"
        }
    ];

    return (
        <section className="services">
            <div className="services-container">
                <div className="services-header">
                    <h2 className="services-title">Dịch vụ của chúng tôi</h2>
                    <p className="services-description">
                        Khám phá các dịch vụ chăm sóc sức khỏe toàn diện được thiết kế đặc biệt cho bạn
                    </p>
                </div>

                <div className="services-grid">
                    {services.map((service) => (
                        <div key={service.id} className="service-card">
                            <div className="service-icon">{service.icon}</div>
                            <h3 className="service-title">{service.title}</h3>
                            <p className="service-description">{service.description}</p>
                            <a href={service.link} className="service-link">
                                Tìm hiểu thêm →
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;