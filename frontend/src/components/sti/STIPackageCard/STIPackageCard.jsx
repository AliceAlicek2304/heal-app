import React from 'react';
import styles from './STIPackageCard.module.css';

const STIPackageCard = ({ package: pkg, onBooking }) => {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0);
    };

    const calculateSavings = () => {
        if (!pkg.totalIndividualPrice || !pkg.packagePrice) return 0;
        return pkg.totalIndividualPrice - pkg.packagePrice;
    };

    const calculateDiscountPercentage = () => {
        if (!pkg.totalIndividualPrice || pkg.totalIndividualPrice === 0) return 0;
        const savings = calculateSavings();
        return Math.round((savings / pkg.totalIndividualPrice) * 100);
    };

    const handleBooking = () => {
        if (onBooking) {
            onBooking(pkg);
        }
    };

    return (
        <div className={styles.packageCard}>
            <div className={styles.packageHeader}>
                <div className={styles.packageBadge}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>GÓI COMBO</span>
                </div>
                {calculateDiscountPercentage() > 0 && (
                    <div className={styles.discountBadge}>
                        -{calculateDiscountPercentage()}%
                    </div>
                )}
            </div>

            <div className={styles.packageInfo}>
                <h3 className={styles.packageName}>{pkg.packageName}</h3>
                {pkg.description && (
                    <p className={styles.packageDescription}>{pkg.description}</p>
                )}
            </div>

            <div className={styles.packageServices}>
                <div className={styles.servicesHeader}>
                    <span>Bao gồm {pkg.serviceCount} dịch vụ:</span>
                </div>
                <div className={styles.servicesList}>
                    {pkg.services?.map((service, index) => (
                        <div key={service.serviceId} className={styles.serviceItem}>
                            <div className={styles.serviceIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                            </div>
                            <div className={styles.serviceDetails}>
                                <span className={styles.serviceName}>{service.name}</span>
                                <span className={styles.serviceComponents}>
                                    {service.componentCount} xét nghiệm
                                </span>
                            </div>
                            <span className={styles.servicePrice}>
                                {formatPrice(service.price)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.packagePricing}>
                {pkg.totalIndividualPrice && (
                    <div className={styles.originalPrice}>
                        <span className={styles.priceLabel}>Giá lẻ:</span>
                        <span className={styles.originalPriceValue}>
                            {formatPrice(pkg.totalIndividualPrice)}
                        </span>
                    </div>
                )}

                <div className={styles.packagePrice}>
                    <span className={styles.priceLabel}>Giá combo:</span>
                    <span className={styles.packagePriceValue}>
                        {formatPrice(pkg.packagePrice)}
                    </span>
                </div>

                {calculateSavings() > 0 && (
                    <div className={styles.savings}>
                        <span className={styles.savingsText}>
                            Tiết kiệm {formatPrice(calculateSavings())}
                        </span>
                    </div>
                )}
            </div>

            <div className={styles.packageMeta}>
                <div className={styles.totalComponents}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"></path>
                        <path d="M21 11h-4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"></path>
                        <path d="M5 11V7a7 7 0 0 1 14 0v4"></path>
                    </svg>
                    <span>Tổng {pkg.totalComponentCount} xét nghiệm</span>
                </div>
            </div>

            <div className={styles.packageActions}>
                <button
                    className={styles.bookingBtn}
                    onClick={handleBooking}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Đặt Gói Combo
                </button>
            </div>
        </div>
    );
};

export default STIPackageCard;
