import React from "react";
import "./Hero.css";

const Hero = () => {
    return (
        <section className="hero">
            <div className="hero-container">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Chăm sóc sức khỏe <span className="highlight">toàn diện</span> cho bạn
                    </h1>
                    <p className="hero-description">
                        HealApp cung cấp các dịch vụ y tế chất lượng cao với đội ngũ chuyên gia
                        giàu kinh nghiệm. Từ xét nghiệm, tư vấn đến theo dõi sức khỏe hàng ngày.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary">Bắt đầu ngay</button>
                        <button className="btn-secondary">Tìm hiểu thêm</button>
                    </div>
                </div>
                <div className="hero-image">
                    <img src="/image/img1.jpg" alt="Healthcare" className="hero-img" />
                </div>
            </div>
        </section>
    );
};

export default Hero;