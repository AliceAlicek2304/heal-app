import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Navbar from '../../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import { questionService } from '../../../services/questionService';
import './CreateQuestion.css';

const CreateQuestion = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const alertRef = useRef(null);

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

    // Auto scroll khi có error hoặc success
    useEffect(() => {
        if ((error || success) && alertRef.current) {
            alertRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [error, success]);

    const fetchCategories = async () => {
        try {
            const response = await questionService.getCategories();
            if (response.success && response.data) {
                setCategories(response.data);
            } else {
                setError(response.message || 'Không thể tải danh mục câu hỏi');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Có lỗi xảy ra khi tải danh mục');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess('');
    };

    const validateForm = () => {
        if (!formData.content.trim()) {
            setError('Vui lòng nhập nội dung câu hỏi');
            return false;
        }
        if (!formData.categoryQuestionId) {
            setError('Vui lòng chọn danh mục câu hỏi');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            setError('');

            const questionData = {
                content: formData.content.trim(),
                categoryQuestionId: parseInt(formData.categoryQuestionId)
            };

            const response = await questionService.createQuestion(questionData);

            if (response.success) {
                setSuccess('Câu hỏi đã được gửi thành công! Chúng tôi sẽ xem xét và trả lời sớm nhất.');

                // Reset form
                setFormData({
                    content: '',
                    categoryQuestionId: ''
                });

            } else {
                setError(response.message || 'Không thể gửi câu hỏi');
            }
        } catch (error) {
            setError('Có lỗi xảy ra khi gửi câu hỏi');
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
            <div className="create-question-page">
                <Navbar />
                <div className="container" style={{
                    minHeight: 400, display: 'flex',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="create-question-page">
            <Navbar />
            <div className="container">
                <div className="create-question-header">
                    <h1>Đặt câu hỏi</h1>
                    <p>Hãy mô tả chi tiết vấn đề của bạn để nhận được tư vấn tốt nhất</p>
                </div>

                {/* Alert Messages */}
                {(error || success) && (
                    <div
                        ref={alertRef}
                        className={`alert ${error ? 'alert-error' : 'alert-success'}`}
                    >
                        {error || success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="create-question-form">
                    <div className="form-section">
                        <div className="form-group">
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
                                <small className="form-hint">
                                    Chọn danh mục phù hợp giúp chúng tôi định hướng câu trả lời tốt hơn
                                </small>
                            )}
                        </div>

                        <div className="form-group">
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
                            <small className="form-hint">
                                Hãy mô tả chi tiết triệu chứng, thời gian xuất hiện, các yếu tố liên quan...
                            </small>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Đang gửi...' : 'Gửi câu hỏi'}
                        </button>
                    </div>
                </form>

                {loading && (
                    <div className="loading-overlay">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateQuestion;