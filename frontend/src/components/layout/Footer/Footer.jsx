import React from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                {/* Main Footer Content */}
                <div className={styles.footerContent}>
                    {/* Company Info */}
                    <div className={styles.footerSection}>
                        <div className={styles.footerLogo}>
                            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="HealApp" className={styles.logoImg} />
                            <span className={styles.logoText}>HealApp</span>
                        </div>
                        <p className={styles.footerDescription}>
                            Nền tảng chăm sóc sức khỏe sinh sản hàng đầu,
                            cung cấp các dịch vụ y tế chuyên nghiệp với
                            sự bảo mật và riêng tư tuyệt đối.
                        </p>
                        <div className={styles.socialLinks}>
                            <a href="https://www.facebook.com/alice2304/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a href="https://x.com/AliCe23004" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </a>
                            <a href="#" className={styles.socialLink} aria-label="Instagram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            <a href="#" className={styles.socialLink} aria-label="LinkedIn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Services */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Dịch vụ</h3>
                        <ul className={styles.linkList}>
                            <li><Link to="/sti-testing" className={styles.footerLink}>Xét nghiệm STI</Link></li>
                            <li><Link to="/menstrual-cycle" className={styles.footerLink}>Theo dõi chu kỳ</Link></li>
                            <li><Link to="/consultation" className={styles.footerLink}>Tư vấn sức khỏe</Link></li>
                            <li><Link to="/questions" className={styles.footerLink}>Hỏi đáp chuyên gia</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Tài nguyên</h3>
                        <ul className={styles.linkList}>
                            <li><Link to="/blog" className={styles.footerLink}>Blog sức khỏe</Link></li>
                            <li><Link to="/faq" className={styles.footerLink}>Câu hỏi thường gặp</Link></li>
                            <li><Link to="/guides" className={styles.footerLink}>Hướng dẫn sử dụng</Link></li>
                            <li><Link to="/privacy" className={styles.footerLink}>Chính sách bảo mật</Link></li>
                            <li><Link to="/terms" className={styles.footerLink}>Điều khoản sử dụng</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Liên hệ</h3>
                        <div className={styles.contactInfo}>
                            <div className={styles.contactItem}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>7 Đ. D1, Long Thạnh Mỹ, Thủ Đức, Hồ Chí Minh</span>
                            </div>
                            <div className={styles.contactItem}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <span>1900 1234</span>
                            </div>
                            <div className={styles.contactItem}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <span>support@healapp.com</span>
                            </div>
                            <div className={styles.contactItem}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                <span>24/7 Hỗ trợ khách hàng</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map and Payment Methods Row */}
                <div className={styles.mapPaymentRow}>
                    {/* Google Map Embed */}
                    <div className={styles.mapContainer}>
                        <iframe
                            src="https://www.google.com/maps?q=7+Đ.+D1,+Long+Thạnh+Mỹ,+Thủ+Đức,+Hồ+Chí+Minh&output=embed"
                            width="100%"
                            height="180"
                            style={{ border: 0, borderRadius: '8px' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="HealApp Location"
                        ></iframe>
                    </div>

                    {/* Payment Methods */}
                    <div className={styles.paymentSection}>
                        <h3 className={styles.sectionTitle}>Phương thức thanh toán</h3>
                        <div className={styles.paymentMethods}>
                            <div className={styles.paymentMethod}>
                                <svg width="40" height="25" viewBox="0 0 40 25" fill="none">
                                    <rect width="40" height="25" rx="4" fill="#1A1F71"/>
                                    <path d="M15 8h10v2H15V8zm0 4h8v2h-8v-2zm0 4h6v2h-6v-2z" fill="white"/>
                                    <path d="M8 12h4v6H8v-6z" fill="#F7B600"/>
                                </svg>
                                <span>Visa</span>
                            </div>
                            <div className={styles.paymentMethod}>
                                <svg width="40" height="25" viewBox="0 0 40 25" fill="none">
                                    <rect width="40" height="25" rx="4" fill="#EB001B"/>
                                    <circle cx="12" cy="12.5" r="6" fill="#F79E1B"/>
                                    <circle cx="28" cy="12.5" r="6" fill="#FF5F00"/>
                                    <path d="M16 12.5c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" fill="white"/>
                                </svg>
                                <span>Mastercard</span>
                            </div>

                        </div>
                        <p className={styles.paymentNote}>
                            Chúng tôi chấp nhận các phương thức thanh toán phổ biến
                        </p>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className={styles.footerBottom}>
                    <div className={styles.footerBottomContent}>
                        <p className={styles.copyright}>
                            © {currentYear} HealApp. Tất cả quyền được bảo lưu.
                        </p>
                        <div className={styles.footerBottomLinks}>
                            <Link to="/privacy" className={styles.bottomLink}>Chính sách bảo mật</Link>
                            <Link to="/terms" className={styles.bottomLink}>Điều khoản</Link>
                            <Link to="/sitemap" className={styles.bottomLink}>Sitemap</Link>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className={styles.trustBadges}>
                    <div className={styles.trustBadge}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="m9 12 2 2 4-4"></path>
                        </svg>
                        <span>Bảo mật SSL</span>
                    </div>
                    <div className={styles.trustBadge}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Chứng nhận y tế</span>
                    </div>
                    <div className={styles.trustBadge}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        <span>Theo chuẩn quốc tế</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;