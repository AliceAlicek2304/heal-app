import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import Navbar from '../../../components/layout/Navbar/Navbar';
import Footer from '../../../components/layout/Footer/Footer';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import { questionService } from '../../../services/questionService';
import styles from './CreateQuestion.module.css';

const CreateQuestion = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const formRef = useRef(null);

    const [formData, setFormData] = useState({
        content: '',
        categoryQuestionId: ''
    });

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            navigate('/');
            return;
        }
        fetchCategories();
    }, [user, isLoading, navigate]);

    const fetchCategories = async () => {
        try {
            const response = await questionService.getCategories();
            if (response.success && response.data) {
                setCategories(response.data);
            } else {
                toast.error(response.message || 'Không thể tải danh mục câu hỏi');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Có lỗi xảy ra khi tải danh mục');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.content.trim()) {
            toast.error('Vui lòng nhập nội dung câu hỏi');
            return false;
        }
        if (!formData.categoryQuestionId) {
            toast.error('Vui lòng chọn danh mục câu hỏi');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const questionData = {
                content: formData.content.trim(),
                categoryQuestionId: parseInt(formData.categoryQuestionId)
            };

            const response = await questionService.createQuestion(questionData);

            if (response.success) {
                toast.success('Câu hỏi đã được gửi thành công! Chúng tôi sẽ xem xét và trả lời sớm nhất.');

                // Reset form
                setFormData({
                    content: '',
                    categoryQuestionId: ''
                });

                // Redirect to questions page after a short delay
                setTimeout(() => {
                    navigate('/questions');
                }, 2000);

            } else {
                toast.error(response.message || 'Không thể gửi câu hỏi');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gửi câu hỏi');
            console.error('Error creating question:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/questions');
    };

    if (isLoading) {
        return (
            <div className={styles.createQuestionPage}>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.createQuestionPage}>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.createQuestionHeader}>
                    <h1>Đặt câu hỏi</h1>
                    <p>Hãy mô tả chi tiết vấn đề của bạn để nhận được tư vấn tốt nhất</p>
                </div>

                <form 
                    ref={formRef}
                    onSubmit={handleSubmit} 
                    className={styles.createQuestionForm}
                >
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label htmlFor="categoryQuestionId">Danh mục câu hỏi *</label>
                            <select
                                id="categoryQuestionId"
                                name="categoryQuestionId"
                                value={formData.categoryQuestionId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Chọn danh mục phù hợp</option>
                                {categories.map(category => (
                                    <option key={category.categoryQuestionId} value={category.categoryQuestionId}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {categories.length > 0 && (
                                <small className={styles.formHint}>
                                    Chọn danh mục phù hợp giúp chúng tôi định hướng câu trả lời tốt hơn
                                </small>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="content">Nội dung câu hỏi *</label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="Mô tả chi tiết vấn đề của bạn..."
                                rows="10"
                                required
                            />
                            <small className={styles.formHint}>
                                Hãy mô tả chi tiết triệu chứng, thời gian xuất hiện, các yếu tố liên quan...
                            </small>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                    </svg>
                                    Đang gửi...
                                </>
                            ) : 'Gửi câu hỏi'}
                        </button>
                    </div>
                </form>

                {loading && (
                    <div className={styles.loadingOverlay}>
                        <LoadingSpinner />
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default CreateQuestion;