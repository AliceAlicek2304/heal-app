import React from 'react';
import './STIServiceCard.css';

const STIServiceCard = ({ service, onBookTest, onAuthRequired }) => {
    const handleBookClick = () => {
        onBookTest(service);
    };

    const getStatusColor = (status) => {
        // Handle boolean values
        if (typeof status === 'boolean') {
            return status ? 'success' : 'danger';
        }

        // Handle string values
        if (typeof status === 'string') {
            switch (status.toLowerCase()) {
                case 'active':
                case 'true':
                    return 'success';
                case 'inactive':
                case 'false':
                    return 'danger';
                default:
                    return 'secondary';
            }
        }

        // Default fallback
        return 'secondary';
    };

    const getStatusText = (isActive) => {
        // Handle both boolean and string values
        if (typeof isActive === 'boolean') {
            return isActive ? 'Hoạt động' : 'Tạm ngưng';
        }

        if (typeof isActive === 'string') {
            const lower = isActive.toLowerCase();
            if (lower === 'active' || lower === 'true') {
                return 'Hoạt động';
            }
            return 'Tạm ngưng';
        }

        return 'Không xác định';
    };

    const isServiceActive = (status) => {
        if (typeof status === 'boolean') {
            return status;
        }

        if (typeof status === 'string') {
            const lower = status.toLowerCase();
            return lower === 'active' || lower === 'true';
        }

        return false;
    };

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="sti-service-card">
            <div className="service-header">
                <div className="service-title">
                    <h3 title={service.name || service.serviceName}>
                        {truncateText(service.name || service.serviceName, 40)}
                    </h3>
                    <span className={`status-badge ${getStatusColor(service.isActive)}`}>
                        {getStatusText(service.isActive)}
                    </span>
                </div>
            </div>

            <div className="service-content">
                <div className="service-description">
                    <p title={service.description}>
                        {truncateText(service.description || 'Dịch vụ xét nghiệm STI chuyên nghiệp', 80)}
                    </p>
                </div>

                {service.testComponents && service.testComponents.length > 0 && (
                    <div className="service-components">
                        <h4>Các xét nghiệm bao gồm:</h4>
                        <ul>
                            {service.testComponents.slice(0, 3).map((component, index) => (
                                <li key={component.componentId || index} title={component.testName}>
                                    {truncateText(component.testName, 35)}
                                    {component.referenceRange && (
                                        <span className="reference-range" title={component.referenceRange}>
                                            {' (' + truncateText(component.referenceRange, 15) + ')'}
                                        </span>
                                    )}
                                </li>
                            ))}
                            {service.testComponents.length > 3 && (
                                <li className="more-items">
                                    và {service.testComponents.length - 3} xét nghiệm khác...
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                <div className="service-details">
                    <div className="detail-item">
                        <span className="label">Số lượng xét nghiệm:</span>
                        <span className="value">
                            {service.componentCount || service.testComponents?.length || 0} xét nghiệm
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Thời gian lấy mẫu:</span>
                        <span className="value">15-30 phút</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Thời gian có kết quả:</span>
                        <span className="value">1-3 ngày làm việc</span>
                    </div>
                </div>

                <div className="service-price">
                    <div className="price-info">
                        <span className="price-label">Giá dịch vụ:</span>
                        <span className="price-value">
                            {service.price ?
                                `${service.price.toLocaleString('vi-VN')} VNĐ` :
                                'Liên hệ'
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="service-actions">
                <button
                    className="btn btn-primary btn-book"
                    onClick={handleBookClick}
                    disabled={!isServiceActive(service.isActive)}
                >
                    <i className="fas fa-calendar-plus"></i>
                    {isServiceActive(service.isActive) ? 'Đặt lịch xét nghiệm' : 'Tạm ngưng dịch vụ'}
                </button>
            </div>
        </div>
    );
};

export default STIServiceCard;