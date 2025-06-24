import React from 'react';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import styles from './Privacy.module.css';

const Privacy = () => {
    const currentDate = new Date().toLocaleDateString('vi-VN');

    return (
        <div className={styles.privacyPage}>
            <Navbar />
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.privacyHeader}>
                    <div className={styles.privacyHeaderContent}>
                        <h1 className={styles.privacyTitle}>Chính sách bảo mật</h1>
                        <p className={styles.privacySubtitle}>
                            Cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn
                        </p>
                        <div className={styles.lastUpdated}>
                            Cập nhật lần cuối: {currentDate}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className={styles.privacyContent}>
                    {/* Introduction */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>1. Giới thiệu</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                HealApp ("chúng tôi", "của chúng tôi", hoặc "nền tảng") cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. 
                                Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi bạn sử dụng 
                                nền tảng chăm sóc sức khỏe sinh sản của chúng tôi.
                            </p>
                            <p>
                                Bằng việc sử dụng HealApp, bạn đồng ý với việc thu thập và sử dụng thông tin theo chính sách này. 
                                Nếu bạn không đồng ý với chính sách này, vui lòng không sử dụng dịch vụ của chúng tôi.
                            </p>
                        </div>
                    </section>

                    {/* Information Collection */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>2. Thông tin chúng tôi thu thập</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>2.1. Thông tin cá nhân</h3>
                            <ul className={styles.infoList}>
                                <li>Họ tên, ngày sinh, giới tính</li>
                                <li>Địa chỉ email và số điện thoại</li>
                                <li>Địa chỉ nhà và thông tin liên hệ</li>
                                <li>Thông tin y tế cơ bản và lịch sử sức khỏe</li>
                                <li>Thông tin thanh toán (được mã hóa)</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>2.2. Thông tin sử dụng dịch vụ</h3>
                            <ul className={styles.infoList}>
                                <li>Lịch sử đặt lịch và tư vấn</li>
                                <li>Kết quả xét nghiệm và báo cáo y tế</li>
                                <li>Dữ liệu theo dõi chu kỳ kinh nguyệt</li>
                                <li>Nội dung bài viết và câu hỏi đăng tải</li>
                                <li>Đánh giá và phản hồi về dịch vụ</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>2.3. Thông tin kỹ thuật</h3>
                            <ul className={styles.infoList}>
                                <li>Địa chỉ IP và thông tin thiết bị</li>
                                <li>Dữ liệu sử dụng ứng dụng và trang web</li>
                                <li>Cookies và công nghệ theo dõi tương tự</li>
                                <li>Thông tin trình duyệt và hệ điều hành</li>
                            </ul>
                        </div>
                    </section>

                    {/* Information Usage */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>3. Cách chúng tôi sử dụng thông tin</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>3.1. Mục đích sử dụng</h3>
                            <ul className={styles.infoList}>
                                <li>Cung cấp và cải thiện dịch vụ chăm sóc sức khỏe</li>
                                <li>Xử lý đặt lịch và thanh toán</li>
                                <li>Gửi thông báo và cập nhật quan trọng</li>
                                <li>Phân tích và nghiên cứu để cải thiện dịch vụ</li>
                                <li>Tuân thủ các yêu cầu pháp lý</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>3.2. Chia sẻ thông tin</h3>
                            <p>
                                Chúng tôi <strong>KHÔNG</strong> bán, trao đổi hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba. 
                                Thông tin chỉ được chia sẻ trong các trường hợp sau:
                            </p>
                            <ul className={styles.infoList}>
                                <li>Với sự đồng ý rõ ràng của bạn</li>
                                <li>Với nhân viên y tế được ủy quyền</li>
                                <li>Khi có yêu cầu pháp lý bắt buộc</li>
                                <li>Để bảo vệ quyền lợi và an toàn của người dùng</li>
                            </ul>
                        </div>
                    </section>

                    {/* Data Security */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>4. Bảo mật thông tin</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                Chúng tôi áp dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn:
                            </p>
                            <ul className={styles.infoList}>
                                <li>Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải</li>
                                <li>Mã hóa đầu cuối cho thông tin nhạy cảm</li>
                                <li>Kiểm soát truy cập nghiêm ngặt</li>
                                <li>Giám sát bảo mật 24/7</li>
                                <li>Backup dữ liệu định kỳ và an toàn</li>
                                <li>Tuân thủ tiêu chuẩn bảo mật quốc tế (ISO 27001)</li>
                            </ul>
                        </div>
                    </section>

                    {/* User Rights */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>5. Quyền của người dùng</h2>
                        <div className={styles.sectionContent}>
                            <p>Theo Luật Bảo vệ dữ liệu cá nhân, bạn có các quyền sau:</p>
                            <ul className={styles.infoList}>
                                <li><strong>Quyền được biết:</strong> Biết về việc thu thập và sử dụng thông tin</li>
                                <li><strong>Quyền đồng ý:</strong> Đồng ý hoặc từ chối việc thu thập thông tin</li>
                                <li><strong>Quyền truy cập:</strong> Xem và sao chép thông tin cá nhân</li>
                                <li><strong>Quyền sửa đổi:</strong> Cập nhật và chỉnh sửa thông tin không chính xác</li>
                                <li><strong>Quyền xóa:</strong> Yêu cầu xóa thông tin cá nhân</li>
                                <li><strong>Quyền hạn chế:</strong> Hạn chế việc xử lý thông tin</li>
                                <li><strong>Quyền di chuyển:</strong> Xuất dữ liệu sang nền tảng khác</li>
                            </ul>
                        </div>
                    </section>

                    {/* Data Retention */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>6. Lưu trữ và xóa dữ liệu</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>6.1. Thời gian lưu trữ</h3>
                            <ul className={styles.infoList}>
                                <li>Thông tin tài khoản: Cho đến khi bạn xóa tài khoản</li>
                                <li>Dữ liệu y tế: Tối thiểu 10 năm theo quy định y tế</li>
                                <li>Lịch sử giao dịch: 7 năm theo quy định thuế</li>
                                <li>Dữ liệu sử dụng: 2 năm cho mục đích phân tích</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>6.2. Xóa dữ liệu</h3>
                            <p>
                                Bạn có thể yêu cầu xóa thông tin cá nhân bằng cách:
                            </p>
                            <ul className={styles.infoList}>
                                <li>Liên hệ qua email: privacy@healapp.com</li>
                                <li>Gọi hotline: 1900 1234</li>
                                <li>Sử dụng tính năng xóa tài khoản trong ứng dụng</li>
                            </ul>
                        </div>
                    </section>

                    {/* Cookies */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>7. Cookies và công nghệ theo dõi</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                Chúng tôi sử dụng cookies và công nghệ tương tự để:
                            </p>
                            <ul className={styles.infoList}>
                                <li>Ghi nhớ tùy chọn và cài đặt của bạn</li>
                                <li>Phân tích lưu lượng truy cập và sử dụng</li>
                                <li>Cải thiện hiệu suất và trải nghiệm người dùng</li>
                                <li>Cung cấp nội dung được cá nhân hóa</li>
                            </ul>
                            <p>
                                Bạn có thể kiểm soát cookies thông qua cài đặt trình duyệt. 
                                Tuy nhiên, việc tắt cookies có thể ảnh hưởng đến chức năng của nền tảng.
                            </p>
                        </div>
                    </section>

                    {/* Children Privacy */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>8. Bảo vệ trẻ em</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                HealApp không thu thập thông tin từ trẻ em dưới 13 tuổi một cách có ý thức. 
                                Nếu bạn là cha mẹ hoặc người giám hộ và biết con bạn đã cung cấp thông tin cá nhân, 
                                vui lòng liên hệ với chúng tôi ngay lập tức.
                            </p>
                            <p>
                                Đối với thanh thiếu niên từ 13-18 tuổi, chúng tôi yêu cầu sự đồng ý của cha mẹ 
                                hoặc người giám hộ trước khi thu thập thông tin.
                            </p>
                        </div>
                    </section>

                    {/* Changes to Policy */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>9. Thay đổi chính sách</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. 
                                Khi có thay đổi quan trọng, chúng tôi sẽ:
                            </p>
                            <ul className={styles.infoList}>
                                <li>Thông báo qua email cho tất cả người dùng</li>
                                <li>Hiển thị thông báo trong ứng dụng</li>
                                <li>Cập nhật ngày "Cập nhật lần cuối"</li>
                                <li>Yêu cầu xác nhận đồng ý với chính sách mới</li>
                            </ul>
                        </div>
                    </section>

                    {/* Contact Information */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>10. Liên hệ</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ:
                            </p>
                            <div className={styles.contactInfo}>
                                <div className={styles.contactItem}>
                                    <strong>Email:</strong> privacy@healapp.com
                                </div>
                                <div className={styles.contactItem}>
                                    <strong>Hotline:</strong> 1900 1234
                                </div>
                                <div className={styles.contactItem}>
                                    <strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM
                                </div>
                                <div className={styles.contactItem}>
                                    <strong>Thời gian:</strong> Thứ 2 - Thứ 6, 8:00 - 18:00
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Contact Section */}
                <div className={styles.contactSection}>
                    <div className={styles.contactCard}>
                        <div className={styles.contactIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                <path d="m9 12 2 2 4-4"></path>
                            </svg>
                        </div>
                        <h3>Cần hỗ trợ về bảo mật?</h3>
                        <p>Đội ngũ bảo mật của chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
                        <div className={styles.contactButtons}>
                            <a href="mailto:privacy@healapp.com" className={styles.btnPrimary}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                Gửi email
                            </a>
                            <a href="tel:19001234" className={styles.btnSecondary}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                Gọi ngay: 1900 1234
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Privacy; 