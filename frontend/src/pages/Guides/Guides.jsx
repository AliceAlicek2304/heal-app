import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import styles from './Guides.module.css';

const Guides = () => {
    const [activeSection, setActiveSection] = useState('getting-started');

    const guidesData = {
        'getting-started': {
            title: 'Bắt đầu với HealApp',
            icon: '🚀',
            steps: [
                {
                    title: 'Đăng ký tài khoản',
                    description: 'Tạo tài khoản mới để truy cập đầy đủ tính năng',
                    details: [
                        'Truy cập trang chủ HealApp',
                        'Nhấn nút "Đăng ký" ở góc trên bên phải',
                        'Điền thông tin cá nhân: họ tên, email, số điện thoại',
                        'Tạo mật khẩu mạnh (ít nhất 8 ký tự)',
                        'Xác minh email qua link được gửi',
                        'Hoàn tất hồ sơ sức khỏe cơ bản'
                    ]
                },
                {
                    title: 'Đăng nhập và bảo mật',
                    description: 'Đăng nhập an toàn và bảo vệ tài khoản',
                    details: [
                        'Sử dụng email và mật khẩu đã đăng ký',
                        'Bật xác thực 2 yếu tố để tăng bảo mật',
                        'Không chia sẻ thông tin đăng nhập với người khác',
                        'Đăng xuất khi sử dụng thiết bị công cộng',
                        'Thay đổi mật khẩu định kỳ'
                    ]
                },
                {
                    title: 'Khám phá giao diện',
                    description: 'Làm quen với các tính năng chính',
                    details: [
                        'Thanh điều hướng: truy cập nhanh các trang',
                        'Trang chủ: tổng quan dịch vụ và thông báo',
                        'Menu cá nhân: quản lý hồ sơ và cài đặt',
                        'Chatbot: hỗ trợ tức thì 24/7',
                        'Footer: thông tin liên hệ và chính sách'
                    ]
                }
            ]
        },
        'sti-testing': {
            title: 'Xét nghiệm STI',
            icon: '🔬',
            steps: [
                {
                    title: 'Chọn gói xét nghiệm',
                    description: 'Lựa chọn gói xét nghiệm phù hợp với nhu cầu',
                    details: [
                        'Xem danh sách các gói xét nghiệm có sẵn',
                        'Đọc mô tả chi tiết từng loại xét nghiệm',
                        'So sánh giá cả và thời gian có kết quả',
                        'Chọn gói cơ bản hoặc nâng cao tùy nhu cầu',
                        'Xem các ưu đãi và khuyến mãi hiện tại'
                    ]
                },
                {
                    title: 'Đặt lịch xét nghiệm',
                    description: 'Đặt lịch hẹn tại trung tâm xét nghiệm',
                    details: [
                        'Chọn trung tâm xét nghiệm gần nhất',
                        'Xem lịch trống và chọn thời gian phù hợp',
                        'Điền thông tin cá nhân và lý do xét nghiệm',
                        'Xác nhận thông tin và thanh toán',
                        'Nhận xác nhận qua email và SMS'
                    ]
                },
                {
                    title: 'Thực hiện xét nghiệm',
                    description: 'Quy trình xét nghiệm an toàn và chuyên nghiệp',
                    details: [
                        'Đến trung tâm đúng giờ hẹn',
                        'Mang theo giấy tờ tùy thân và mã đặt lịch',
                        'Làm theo hướng dẫn của nhân viên y tế',
                        'Thực hiện xét nghiệm theo quy trình chuẩn',
                        'Nhận phiếu hẹn lấy kết quả'
                    ]
                },
                {
                    title: 'Xem kết quả',
                    description: 'Nhận và hiểu kết quả xét nghiệm',
                    details: [
                        'Nhận thông báo khi có kết quả',
                        'Đăng nhập vào tài khoản để xem kết quả',
                        'Tải xuống báo cáo chi tiết (nếu cần)',
                        'Đặt lịch tư vấn với bác sĩ để giải thích kết quả',
                        'Lưu trữ kết quả để theo dõi sức khỏe'
                    ]
                }
            ]
        },
        'consultation': {
            title: 'Tư vấn sức khỏe',
            icon: '👨‍⚕️',
            steps: [
                {
                    title: 'Tìm chuyên gia',
                    description: 'Chọn chuyên gia phù hợp với vấn đề sức khỏe',
                    details: [
                        'Xem danh sách chuyên gia có sẵn',
                        'Đọc thông tin chuyên môn và kinh nghiệm',
                        'Xem đánh giá và nhận xét từ bệnh nhân khác',
                        'Lọc theo chuyên khoa và địa điểm',
                        'Chọn chuyên gia phù hợp nhất'
                    ]
                },
                {
                    title: 'Đặt lịch tư vấn',
                    description: 'Đặt lịch hẹn với chuyên gia',
                    details: [
                        'Chọn chuyên gia và thời gian thuận tiện',
                        'Mô tả vấn đề sức khỏe cần tư vấn',
                        'Chọn hình thức tư vấn: video call hoặc chat',
                        'Thanh toán phí tư vấn',
                        'Nhận xác nhận và hướng dẫn tham gia'
                    ]
                },
                {
                    title: 'Tham gia tư vấn',
                    description: 'Thực hiện buổi tư vấn hiệu quả',
                    details: [
                        'Kiểm tra kết nối internet và thiết bị',
                        'Đăng nhập vào phòng tư vấn đúng giờ',
                        'Chuẩn bị câu hỏi và thông tin cần thiết',
                        'Thực hiện tư vấn theo hướng dẫn của chuyên gia',
                        'Ghi chép thông tin quan trọng'
                    ]
                },
                {
                    title: 'Theo dõi sau tư vấn',
                    description: 'Thực hiện theo khuyến nghị của chuyên gia',
                    details: [
                        'Nhận báo cáo tư vấn chi tiết',
                        'Thực hiện theo hướng dẫn điều trị',
                        'Đặt lịch tái khám nếu cần',
                        'Đánh giá chất lượng tư vấn',
                        'Liên hệ lại nếu có thắc mắc'
                    ]
                }
            ]
        },
        'menstrual-cycle': {
            title: 'Theo dõi chu kỳ',
            icon: '📅',
            steps: [
                {
                    title: 'Thiết lập hồ sơ',
                    description: 'Tạo hồ sơ theo dõi chu kỳ cá nhân',
                    details: [
                        'Vào mục "Theo dõi chu kỳ"',
                        'Nhập thông tin chu kỳ cơ bản',
                        'Ghi chép ngày bắt đầu chu kỳ gần nhất',
                        'Điều chỉnh độ dài chu kỳ trung bình',
                        'Thiết lập thông báo nhắc nhở'
                    ]
                },
                {
                    title: 'Ghi chép hàng ngày',
                    description: 'Theo dõi các thông tin quan trọng',
                    details: [
                        'Đánh dấu ngày bắt đầu và kết thúc chu kỳ',
                        'Ghi chép các triệu chứng: đau bụng, mệt mỏi',
                        'Theo dõi tâm trạng và năng lượng',
                        'Ghi chép các dấu hiệu bất thường',
                        'Lưu ý về thuốc men và chế độ ăn uống'
                    ]
                },
                {
                    title: 'Phân tích dữ liệu',
                    description: 'Hiểu rõ chu kỳ và sức khỏe',
                    details: [
                        'Xem biểu đồ chu kỳ theo thời gian',
                        'Phân tích mẫu hình chu kỳ',
                        'Nhận dự đoán chu kỳ tiếp theo',
                        'Xem báo cáo sức khỏe định kỳ',
                        'So sánh với dữ liệu trung bình'
                    ]
                },
                {
                    title: 'Chia sẻ với bác sĩ',
                    description: 'Sử dụng dữ liệu cho việc tư vấn y tế',
                    details: [
                        'Xuất báo cáo chu kỳ chi tiết',
                        'Chia sẻ với bác sĩ khi tư vấn',
                        'Thảo luận về các bất thường',
                        'Nhận khuyến nghị điều chỉnh',
                        'Theo dõi hiệu quả điều trị'
                    ]
                }
            ]
        },
        'blog': {
            title: 'Blog sức khỏe',
            icon: '📝',
            steps: [
                {
                    title: 'Đọc bài viết',
                    description: 'Tìm hiểu thông tin sức khỏe hữu ích',
                    details: [
                        'Duyệt danh sách bài viết mới nhất',
                        'Tìm kiếm theo chủ đề quan tâm',
                        'Đọc bài viết chi tiết',
                        'Lưu bài viết yêu thích',
                        'Chia sẻ bài viết hữu ích'
                    ]
                },
                {
                    title: 'Tạo bài viết',
                    description: 'Chia sẻ kiến thức và kinh nghiệm',
                    details: [
                        'Nhấn nút "Tạo bài viết"',
                        'Viết tiêu đề hấp dẫn',
                        'Soạn nội dung chi tiết và chính xác',
                        'Thêm hình ảnh minh họa phù hợp',
                        'Chọn danh mục và tags phù hợp'
                    ]
                },
                {
                    title: 'Quản lý bài viết',
                    description: 'Chỉnh sửa và cập nhật nội dung',
                    details: [
                        'Xem danh sách bài viết đã tạo',
                        'Chỉnh sửa nội dung khi cần',
                        'Cập nhật trạng thái bài viết',
                        'Xóa bài viết không phù hợp',
                        'Theo dõi lượt xem và tương tác'
                    ]
                }
            ]
        }
    };

    const sections = [
        { id: 'getting-started', title: 'Bắt đầu', icon: '🚀' },
        { id: 'sti-testing', title: 'Xét nghiệm STI', icon: '🔬' },
        { id: 'consultation', title: 'Tư vấn sức khỏe', icon: '👨‍⚕️' },
        { id: 'menstrual-cycle', title: 'Theo dõi chu kỳ', icon: '📅' },
        { id: 'blog', title: 'Blog sức khỏe', icon: '📝' }
    ];

    return (
        <div className={styles.guidesPage}>
            <Navbar />
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.guidesHeader}>
                    <div className={styles.guidesHeaderContent}>
                        <h1 className={styles.guidesTitle}>Hướng dẫn sử dụng</h1>
                        <p className={styles.guidesSubtitle}>
                            Hướng dẫn chi tiết cách sử dụng các tính năng của HealApp
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className={styles.navigationTabs}>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            className={`${styles.tabButton} ${activeSection === section.id ? styles.active : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <span className={styles.tabIcon}>{section.icon}</span>
                            <span className={styles.tabTitle}>{section.title}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className={styles.guidesContent}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}>{guidesData[activeSection].icon}</span>
                            {guidesData[activeSection].title}
                        </h2>
                    </div>

                    <div className={styles.stepsContainer}>
                        {guidesData[activeSection].steps.map((step, index) => (
                            <div key={index} className={styles.stepCard}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>{index + 1}</div>
                                    <div className={styles.stepInfo}>
                                        <h3 className={styles.stepTitle}>{step.title}</h3>
                                        <p className={styles.stepDescription}>{step.description}</p>
                                    </div>
                                </div>
                                <div className={styles.stepDetails}>
                                    <ul className={styles.detailsList}>
                                        {step.details.map((detail, detailIndex) => (
                                            <li key={detailIndex} className={styles.detailItem}>
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Links */}
                    <div className={styles.quickLinks}>
                        <h3 className={styles.quickLinksTitle}>Truy cập nhanh</h3>
                        <div className={styles.quickLinksGrid}>
                            <Link to="/sti-testing" className={styles.quickLink}>
                                <span className={styles.quickLinkIcon}>🔬</span>
                                <span>Xét nghiệm STI</span>
                            </Link>
                            <Link to="/consultation" className={styles.quickLink}>
                                <span className={styles.quickLinkIcon}>👨‍⚕️</span>
                                <span>Tư vấn sức khỏe</span>
                            </Link>
                            <Link to="/menstrual-cycle" className={styles.quickLink}>
                                <span className={styles.quickLinkIcon}>📅</span>
                                <span>Theo dõi chu kỳ</span>
                            </Link>
                            <Link to="/blog" className={styles.quickLink}>
                                <span className={styles.quickLinkIcon}>📝</span>
                                <span>Blog sức khỏe</span>
                            </Link>
                            <Link to="/questions" className={styles.quickLink}>
                                <span className={styles.quickLinkIcon}>❓</span>
                                <span>Hỏi đáp</span>
                            </Link>
                            <Link to="/faq" className={styles.quickLink}>
                                <span className={styles.quickLinkIcon}>💡</span>
                                <span>FAQ</span>
                            </Link>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className={styles.contactSection}>
                        <div className={styles.contactCard}>
                            <div className={styles.contactIcon}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                </svg>
                            </div>
                            <h3>Cần hỗ trợ thêm?</h3>
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

export default Guides; 