import React, { useState } from 'react';
import { menstrualCycleAIService } from '../../services/menstrualCycleAIService';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { parseDate, formatDateTime } from '../../utils/dateUtils';
import styles from './AIAnalysisModal.module.css';

const AIAnalysisModal = ({ isOpen, onClose, analysisType = 'personal' }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);

    const analysisTypes = {
        personal: {
            title: 'Phân tích chu kỳ cá nhân',
            description: 'Phân tích tổng quan về pattern chu kỳ của bạn',
            icon: '📊',
            service: menstrualCycleAIService.generatePersonalAnalysis
        },
        health: {
            title: 'Phân tích sức khỏe chi tiết',
            description: 'Đánh giá y tế và khuyến nghị chuyên môn',
            icon: '🏥',
            service: menstrualCycleAIService.generateHealthAnalysis
        },
        comparative: {
            title: 'So sánh với chuẩn y tế',
            description: 'Đánh giá so với tiêu chuẩn y tế quốc tế',
            icon: '⚖️',
            service: menstrualCycleAIService.generateComparativeAnalysis
        }
    };

    const currentType = analysisTypes[analysisType];

    const handleGenerateAnalysis = async () => {
        if (!currentType) {
            toast.error('Loại phân tích không hợp lệ');
            return;
        }

        try {
            setLoading(true);
            const response = await currentType.service();

            if (response.success) {
                setAnalysisData(response.data);
                toast.success('Phân tích AI thành công!');
            } else {
                toast.error(response.message || 'Không thể tạo phân tích AI');
            }
        } catch (error) {
            console.error('Error generating AI analysis:', error);
            toast.error('Đã xảy ra lỗi khi tạo phân tích AI');
        } finally {
            setLoading(false);
        }
    };

    const formatAnalysisText = (text) => {
        if (!text) return '';
        
        // Convert markdown-like formatting to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/## (.*?)\n/g, '<h2>$1</h2>')
            .replace(/### (.*?)\n/g, '<h3>$1</h3>')
            .replace(/- (.*?)\n/g, '<li>$1</li>')
            .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerInfo}>
                        <span className={styles.analysisIcon}>{currentType?.icon}</span>
                        <div>
                            <h2>{currentType?.title}</h2>
                            <p>{currentType?.description}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {!analysisData ? (
                        <div className={styles.generateSection}>
                            <div className={styles.generateInfo}>
                                <div className={styles.aiIcon}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                    </svg>
                                </div>
                                <h3>Phân tích AI thông minh</h3>
                                <p>
                                    AI sẽ phân tích dữ liệu chu kỳ kinh nguyệt của bạn và đưa ra:
                                </p>
                                <ul>
                                    <li>Đánh giá tổng quan về sức khỏe</li>
                                    <li>Phân tích pattern và xu hướng</li>
                                    <li>Khuyến nghị lối sống phù hợp</li>
                                    <li>Cảnh báo nếu có dấu hiệu bất thường</li>
                                </ul>
                            </div>
                            <button
                                className={styles.generateBtn}
                                onClick={handleGenerateAnalysis}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        Đang phân tích...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                        </svg>
                                        Bắt đầu phân tích AI
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className={styles.analysisSection}>
                            <div className={styles.analysisHeader}>
                                <div className={styles.analysisMeta}>
                                    <span className={styles.analysisDate}>
                                        Phân tích lúc: {formatDateTime(analysisData.generatedAt)}
                                    </span>
                                    {analysisData.totalCycles && (
                                        <span className={styles.cycleCount}>
                                            Dựa trên {analysisData.totalCycles} chu kỳ
                                        </span>
                                    )}
                                </div>
                                <button
                                    className={styles.regenerateBtn}
                                    onClick={handleGenerateAnalysis}
                                    disabled={loading}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="23,4 23,10 17,10"></polyline>
                                        <polyline points="1,20 1,14 7,14"></polyline>
                                        <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,4.36L23,14"></path>
                                    </svg>
                                    Phân tích lại
                                </button>
                            </div>

                            <div className={styles.analysisContent}>
                                <div 
                                    className={styles.analysisText}
                                    dangerouslySetInnerHTML={{ 
                                        __html: formatAnalysisText(
                                            analysisData.aiAnalysis || 
                                            analysisData.aiHealthAnalysis || 
                                            analysisData.comparativeAnalysis
                                        ) 
                                    }}
                                />
                            </div>

                            <div className={styles.analysisFooter}>
                                <div className={styles.disclaimer}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 16v-4"></path>
                                        <path d="M12 8h.01"></path>
                                    </svg>
                                    <span>
                                        Phân tích này chỉ mang tính chất tham khảo. Vui lòng tham khảo ý kiến bác sĩ nếu có vấn đề về sức khỏe.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAnalysisModal; 