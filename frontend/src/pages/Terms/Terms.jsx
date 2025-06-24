import React from 'react';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import styles from './Terms.module.css';

const Terms = () => {
    const currentDate = new Date().toLocaleDateString('vi-VN');

    return (
        <div className={styles.termsPage}>
            <Navbar />
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.termsHeader}>
                    <div className={styles.termsHeaderContent}>
                        <h1 className={styles.termsTitle}>Điều khoản sử dụng</h1>
                        <p className={styles.termsSubtitle}>
                            Quy định và điều khoản khi sử dụng nền tảng HealApp
                        </p>
                        <div className={styles.lastUpdated}>
                            Cập nhật lần cuối: {currentDate}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className={styles.termsContent}>
                    {/* Introduction */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>1. Chấp nhận điều khoản</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                Bằng việc truy cập và sử dụng nền tảng HealApp, bạn đồng ý tuân thủ và bị ràng buộc bởi 
                                các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, 
                                bạn không được phép sử dụng dịch vụ của chúng tôi.
                            </p>
                            <p>
                                HealApp là nền tảng chăm sóc sức khỏe sinh sản cung cấp các dịch vụ: xét nghiệm STI, 
                                tư vấn sức khỏe, theo dõi chu kỳ kinh nguyệt, blog y tế và hệ thống hỏi đáp chuyên gia.
                            </p>
                        </div>
                    </section>

                    {/* Account Registration */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>2. Đăng ký tài khoản</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>2.1. Yêu cầu đăng ký</h3>
                            <ul className={styles.infoList}>
                                <li>Bạn phải từ 18 tuổi trở lên hoặc có sự đồng ý của cha mẹ/người giám hộ</li>
                                <li>Cung cấp thông tin chính xác và đầy đủ</li>
                                <li>Bảo mật thông tin đăng nhập tài khoản</li>
                                <li>Chịu trách nhiệm về mọi hoạt động diễn ra trong tài khoản</li>
                                <li>Thông báo ngay lập tức nếu phát hiện vi phạm bảo mật</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>2.2. Hạn chế tài khoản</h3>
                            <ul className={styles.infoList}>
                                <li>Không được tạo nhiều tài khoản với mục đích gian lận</li>
                                <li>Không được chia sẻ tài khoản với người khác</li>
                                <li>Không được sử dụng tài khoản cho mục đích bất hợp pháp</li>
                                <li>Chúng tôi có quyền từ chối hoặc chấm dứt tài khoản vi phạm</li>
                            </ul>
                        </div>
                    </section>

                    {/* Acceptable Use */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>3. Sử dụng dịch vụ</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>3.1. Sử dụng được phép</h3>
                            <ul className={styles.infoList}>
                                <li>Sử dụng dịch vụ cho mục đích cá nhân và hợp pháp</li>
                                <li>Tuân thủ các hướng dẫn y tế và an toàn</li>
                                <li>Tôn trọng quyền riêng tư của người khác</li>
                                <li>Báo cáo nội dung vi phạm hoặc không phù hợp</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>3.2. Sử dụng bị cấm</h3>
                            <ul className={styles.infoList}>
                                <li>Đăng tải nội dung khiêu dâm, bạo lực hoặc phản cảm</li>
                                <li>Quấy rối, đe dọa hoặc xúc phạm người khác</li>
                                <li>Phát tán thông tin sai lệch về y tế</li>
                                <li>Sử dụng dịch vụ cho mục đích thương mại trái phép</li>
                                <li>Thực hiện hành vi gian lận hoặc lừa đảo</li>
                                <li>Vi phạm quyền sở hữu trí tuệ</li>
                            </ul>
                        </div>
                    </section>

                    {/* Medical Disclaimer */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>4. Tuyên bố miễn trừ y tế</h2>
                        <div className={styles.sectionContent}>
                            <div className={styles.warningBox}>
                                <h4>⚠️ Quan trọng</h4>
                                <p>
                                    HealApp cung cấp thông tin y tế để tham khảo và không thay thế cho việc khám bệnh, 
                                    chẩn đoán hoặc điều trị chuyên môn. Luôn tham khảo ý kiến bác sĩ trước khi đưa ra 
                                    quyết định y tế quan trọng.
                                </p>
                            </div>
                            
                            <h3 className={styles.subsectionTitle}>4.1. Giới hạn trách nhiệm</h3>
                            <ul className={styles.infoList}>
                                <li>Thông tin trên nền tảng chỉ mang tính chất tham khảo</li>
                                <li>Kết quả xét nghiệm cần được bác sĩ giải thích</li>
                                <li>Không đảm bảo tính chính xác 100% của thông tin</li>
                                <li>Không chịu trách nhiệm về hậu quả do tự điều trị</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>4.2. Trường hợp khẩn cấp</h3>
                            <p>
                                Trong trường hợp khẩn cấp y tế, vui lòng:
                            </p>
                            <ul className={styles.infoList}>
                                <li>Gọi ngay 115 hoặc đến bệnh viện gần nhất</li>
                                <li>Không chỉ dựa vào thông tin từ nền tảng</li>
                                <li>Liên hệ bác sĩ đang điều trị cho bạn</li>
                            </ul>
                        </div>
                    </section>

                    {/* Payment Terms */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>5. Điều khoản thanh toán</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>5.1. Phí dịch vụ</h3>
                            <ul className={styles.infoList}>
                                <li>Một số dịch vụ có thể tính phí</li>
                                <li>Giá cả được hiển thị rõ ràng trước khi thanh toán</li>
                                <li>Phí có thể thay đổi với thông báo trước</li>
                                <li>Thanh toán được thực hiện qua các cổng an toàn</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>5.2. Hoàn tiền</h3>
                            <ul className={styles.infoList}>
                                <li>Hoàn tiền 100% nếu dịch vụ không được cung cấp</li>
                                <li>Hoàn tiền 50% nếu hủy trước 24 giờ</li>
                                <li>Không hoàn tiền nếu hủy sau 24 giờ</li>
                                <li>Xử lý hoàn tiền trong vòng 5-7 ngày làm việc</li>
                            </ul>
                        </div>
                    </section>

                    {/* Privacy and Data */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>6. Bảo mật và dữ liệu</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                Việc thu thập và sử dụng thông tin cá nhân của bạn được điều chỉnh bởi 
                                <strong> Chính sách bảo mật</strong> của chúng tôi.
                            </p>
                            <ul className={styles.infoList}>
                                <li>Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn</li>
                                <li>Dữ liệu được mã hóa và lưu trữ an toàn</li>
                                <li>Chỉ chia sẻ thông tin khi có sự đồng ý</li>
                                <li>Bạn có quyền truy cập và chỉnh sửa thông tin cá nhân</li>
                            </ul>
                        </div>
                    </section>

                    {/* Intellectual Property */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>7. Sở hữu trí tuệ</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>7.1. Quyền sở hữu</h3>
                            <ul className={styles.infoList}>
                                <li>HealApp và nội dung liên quan thuộc sở hữu của chúng tôi</li>
                                <li>Không được sao chép, phân phối hoặc sử dụng trái phép</li>
                                <li>Logo, thương hiệu được bảo vệ bởi luật sở hữu trí tuệ</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>7.2. Nội dung người dùng</h3>
                            <ul className={styles.infoList}>
                                <li>Bạn giữ quyền sở hữu nội dung đăng tải</li>
                                <li>Cho phép chúng tôi sử dụng nội dung để cung cấp dịch vụ</li>
                                <li>Không được đăng tải nội dung vi phạm bản quyền</li>
                                <li>Chịu trách nhiệm về nội dung do mình đăng tải</li>
                            </ul>
                        </div>
                    </section>

                    {/* Termination */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>8. Chấm dứt dịch vụ</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>8.1. Chấm dứt bởi người dùng</h3>
                            <ul className={styles.infoList}>
                                <li>Bạn có thể xóa tài khoản bất cứ lúc nào</li>
                                <li>Dữ liệu sẽ được xóa theo quy định bảo mật</li>
                                <li>Một số thông tin có thể được lưu trữ theo yêu cầu pháp lý</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>8.2. Chấm dứt bởi chúng tôi</h3>
                            <ul className={styles.infoList}>
                                <li>Có thể chấm dứt dịch vụ nếu vi phạm điều khoản</li>
                                <li>Thông báo trước khi chấm dứt (trừ trường hợp vi phạm nghiêm trọng)</li>
                                <li>Không chịu trách nhiệm về hậu quả do chấm dứt dịch vụ</li>
                            </ul>
                        </div>
                    </section>

                    {/* Limitation of Liability */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>9. Giới hạn trách nhiệm</h2>
                        <div className={styles.sectionContent}>
                            <div className={styles.warningBox}>
                                <h4>⚠️ Giới hạn trách nhiệm</h4>
                                <p>
                                    Trong phạm vi luật pháp cho phép, HealApp không chịu trách nhiệm về bất kỳ 
                                    thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hoặc hậu quả nào phát sinh từ 
                                    việc sử dụng dịch vụ.
                                </p>
                            </div>
                            
                            <ul className={styles.infoList}>
                                <li>Không chịu trách nhiệm về quyết định y tế của người dùng</li>
                                <li>Không đảm bảo dịch vụ không bị gián đoạn</li>
                                <li>Không chịu trách nhiệm về thiệt hại do lỗi kỹ thuật</li>
                                <li>Giới hạn trách nhiệm theo quy định pháp luật</li>
                            </ul>
                        </div>
                    </section>

                    {/* Governing Law */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>10. Luật áp dụng và giải quyết tranh chấp</h2>
                        <div className={styles.sectionContent}>
                            <h3 className={styles.subsectionTitle}>10.1. Luật áp dụng</h3>
                            <ul className={styles.infoList}>
                                <li>Điều khoản này được điều chỉnh bởi luật pháp Việt Nam</li>
                                <li>Mọi tranh chấp sẽ được giải quyết tại tòa án có thẩm quyền</li>
                                <li>Nếu có điều khoản vô hiệu, các điều khoản khác vẫn có hiệu lực</li>
                            </ul>

                            <h3 className={styles.subsectionTitle}>10.2. Giải quyết tranh chấp</h3>
                            <ul className={styles.infoList}>
                                <li>Ưu tiên giải quyết thông qua thương lượng</li>
                                <li>Nếu không thể thương lượng, sẽ đưa ra tòa án</li>
                                <li>Liên hệ: legal@healapp.com để được hỗ trợ</li>
                            </ul>
                        </div>
                    </section>

                    {/* Changes to Terms */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>11. Thay đổi điều khoản</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                Chúng tôi có quyền cập nhật điều khoản này theo thời gian. 
                                Khi có thay đổi quan trọng:
                            </p>
                            <ul className={styles.infoList}>
                                <li>Thông báo qua email cho tất cả người dùng</li>
                                <li>Hiển thị thông báo trong ứng dụng</li>
                                <li>Cập nhật ngày "Cập nhật lần cuối"</li>
                                <li>Tiếp tục sử dụng đồng nghĩa với việc chấp nhận điều khoản mới</li>
                            </ul>
                        </div>
                    </section>

                    {/* Contact Information */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>12. Thông tin liên hệ</h2>
                        <div className={styles.sectionContent}>
                            <p>
                                Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng liên hệ:
                            </p>
                            <div className={styles.contactInfo}>
                                <div className={styles.contactItem}>
                                    <strong>Email pháp lý:</strong> legal@healapp.com
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
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h3>Cần hỗ trợ pháp lý?</h3>
                        <p>Đội ngũ pháp lý của chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
                        <div className={styles.contactButtons}>
                            <a href="mailto:legal@healapp.com" className={styles.btnPrimary}>
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

export default Terms; 