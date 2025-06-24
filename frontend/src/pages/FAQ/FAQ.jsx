import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import styles from './FAQ.module.css';

const FAQ = () => {
    const [openItems, setOpenItems] = useState(new Set());

    const toggleItem = (index) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(index)) {
            newOpenItems.delete(index);
        } else {
            newOpenItems.add(index);
        }
        setOpenItems(newOpenItems);
    };

    const faqData = [
        {
            question: "HealApp là gì và cung cấp những dịch vụ nào?",
            answer: "HealApp là nền tảng chăm sóc sức khỏe sinh sản hàng đầu, cung cấp các dịch vụ: xét nghiệm STI, tư vấn sức khỏe với chuyên gia, theo dõi chu kỳ kinh nguyệt, blog y tế và hệ thống hỏi đáp chuyên gia. Chúng tôi cam kết bảo mật thông tin và cung cấp dịch vụ chất lượng cao."
        },
        {
            question: "Làm thế nào để đăng ký tài khoản trên HealApp?",
            answer: "Để đăng ký tài khoản, bạn có thể: 1) Truy cập trang chủ và nhấn 'Đăng ký', 2) Điền thông tin cá nhân cần thiết, 3) Xác minh email, 4) Hoàn tất hồ sơ sức khỏe. Quá trình đăng ký hoàn toàn miễn phí và chỉ mất vài phút."
        },
        {
            question: "Dịch vụ xét nghiệm STI có an toàn và bảo mật không?",
            answer: "Hoàn toàn an toàn và bảo mật! Chúng tôi tuân thủ nghiêm ngặt các tiêu chuẩn y tế quốc tế. Tất cả thông tin cá nhân được mã hóa, kết quả xét nghiệm chỉ bạn mới có thể xem, và chúng tôi có chứng nhận bảo mật SSL. Đội ngũ y tế chuyên nghiệp sẽ hỗ trợ bạn trong suốt quá trình."
        },
        {
            question: "Chi phí các dịch vụ trên HealApp như thế nào?",
            answer: "HealApp cung cấp nhiều gói dịch vụ với mức giá khác nhau: - Tư vấn cơ bản: Miễn phí - Xét nghiệm STI: Từ 200.000đ - 500.000đ tùy gói - Tư vấn chuyên sâu: 150.000đ - 300.000đ/lần - Gói VIP: 1.000.000đ/tháng. Chúng tôi thường xuyên có ưu đãi và giảm giá cho khách hàng mới."
        },
        {
            question: "Làm thế nào để đặt lịch tư vấn với chuyên gia?",
            answer: "Để đặt lịch tư vấn: 1) Đăng nhập vào tài khoản, 2) Vào mục 'Tư vấn sức khỏe', 3) Chọn chuyên gia phù hợp, 4) Chọn thời gian thuận tiện, 5) Xác nhận đặt lịch. Bạn sẽ nhận được thông báo xác nhận qua email và SMS. Cuộc tư vấn có thể thực hiện qua video call hoặc chat."
        },
        {
            question: "Tính năng theo dõi chu kỳ kinh nguyệt hoạt động như thế nào?",
            answer: "Tính năng theo dõi chu kỳ giúp bạn: - Ghi chép ngày bắt đầu và kết thúc chu kỳ - Dự đoán chu kỳ tiếp theo - Theo dõi các triệu chứng - Nhận thông báo về chu kỳ sắp tới - Phân tích mẫu hình chu kỳ. Dữ liệu được bảo mật tuyệt đối và chỉ bạn mới có thể xem."
        },
        {
            question: "Tôi có thể hủy hoặc thay đổi lịch hẹn không?",
            answer: "Có, bạn có thể hủy hoặc thay đổi lịch hẹn: - Hủy miễn phí trước 24 giờ - Thay đổi lịch trước 12 giờ - Sau thời gian trên có thể phát sinh phí hủy. Để thực hiện, vào mục 'Lịch hẹn của tôi' trong trang cá nhân và chọn thao tác phù hợp."
        },
        {
            question: "Kết quả xét nghiệm có chính xác không và bao lâu có kết quả?",
            answer: "Kết quả xét nghiệm rất chính xác vì chúng tôi sử dụng: - Phương pháp xét nghiệm tiên tiến - Thiết bị hiện đại - Đội ngũ chuyên môn cao - Quy trình kiểm soát chất lượng nghiêm ngặt. Thời gian có kết quả: - Xét nghiệm cơ bản: 24-48 giờ - Xét nghiệm chuyên sâu: 3-5 ngày - Xét nghiệm đặc biệt: 7-10 ngày."
        },
        {
            question: "HealApp có hỗ trợ khách hàng 24/7 không?",
            answer: "Có! Chúng tôi cung cấp hỗ trợ khách hàng 24/7 qua nhiều kênh: - Hotline: 1900 1234 - Email: support@healapp.com - Chat trực tuyến trên website - Fanpage Facebook - Zalo Official. Đội ngũ hỗ trợ được đào tạo chuyên nghiệp và sẵn sàng giải đáp mọi thắc mắc của bạn."
        },
        {
            question: "Thông tin cá nhân của tôi có được bảo mật không?",
            answer: "Tuyệt đối bảo mật! HealApp cam kết: - Tuân thủ Luật Bảo vệ dữ liệu cá nhân - Mã hóa toàn bộ thông tin - Không chia sẻ dữ liệu với bên thứ ba - Chỉ sử dụng thông tin cho mục đích y tế - Bạn có quyền xóa hoặc cập nhật thông tin bất cứ lúc nào. Chúng tôi có chứng nhận bảo mật quốc tế và thường xuyên kiểm tra hệ thống."
        }
    ];

    return (
        <div className={styles.faqPage}>
            <Navbar />
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.faqHeader}>
                    <div className={styles.faqHeaderContent}>
                        <h1 className={styles.faqTitle}>Câu hỏi thường gặp</h1>
                        <p className={styles.faqSubtitle}>
                            Tìm hiểu thêm về HealApp và các dịch vụ chăm sóc sức khỏe sinh sản
                        </p>
                    </div>
                </div>

                {/* FAQ Content */}
                <div className={styles.faqContent}>
                    <div className={styles.faqList}>
                        {faqData.map((item, index) => (
                            <div key={index} className={styles.faqItem}>
                                <button
                                    className={`${styles.faqQuestion} ${openItems.has(index) ? styles.active : ''}`}
                                    onClick={() => toggleItem(index)}
                                    aria-expanded={openItems.has(index)}
                                >
                                    <span className={styles.questionText}>{item.question}</span>
                                    <svg
                                        className={`${styles.chevron} ${openItems.has(index) ? styles.rotated : ''}`}
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <polyline points="6,9 12,15 18,9"></polyline>
                                    </svg>
                                </button>
                                <div className={`${styles.faqAnswer} ${openItems.has(index) ? styles.show : ''}`}>
                                    <div className={styles.answerContent}>
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact Section */}
                    <div className={styles.contactSection}>
                        <div className={styles.contactCard}>
                            <div className={styles.contactIcon}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                            </div>
                            <h3>Vẫn còn thắc mắc?</h3>
                            <p>Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn</p>
                            <div className={styles.contactButtons}>
                                <a href="tel:19001234" className={styles.btnPrimary}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    Gọi ngay: 1900 1234
                                </a>
                                <a href="mailto:support@healapp.com" className={styles.btnSecondary}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    Gửi email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default FAQ; 