import React, { useState, useEffect } from 'react';
import { FaTimes, FaFolder, FaQuestion } from 'react-icons/fa';
import styles from './CategoryModal.module.css';

const CategoryModal = ({ category, mode, type, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || ''
            });
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
        setErrors({});
    }, [category]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên danh mục không được để trống';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Tên danh mục phải có ít nhất 3 ký tự';
        } else if (formData.name.trim().length > 100) {
            newErrors.name = 'Tên danh mục không được quá 100 ký tự';
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Mô tả không được quá 500 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await onSave({
                name: formData.name.trim(),
                description: formData.description.trim() || null
            });
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        const action = mode === 'create' ? 'Tạo' : 'Chỉnh sửa';
        const typeText = type === 'blog' ? 'danh mục Blog' : 'danh mục Câu hỏi';
        return `${action} ${typeText}`;
    };

    const getIcon = () => {
        return type === 'blog' ? <FaFolder /> : <FaQuestion />;
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>
                        {getIcon()}
                        <h2>{getTitle()}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                        type="button"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>
                            Tên danh mục <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={`Nhập tên ${type === 'blog' ? 'danh mục blog' : 'danh mục câu hỏi'}`}
                            className={`${styles.input} ${errors.name ? styles.error : ''}`}
                            maxLength={100}
                        />
                        {errors.name && (
                            <span className={styles.errorMessage}>{errors.name}</span>
                        )}
                        <div className={styles.characterCount}>
                            {formData.name.length}/100
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description" className={styles.label}>
                            Mô tả
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Nhập mô tả cho danh mục (tùy chọn)"
                            className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
                            rows={4}
                            maxLength={500}
                        />
                        {errors.description && (
                            <span className={styles.errorMessage}>{errors.description}</span>
                        )}
                        <div className={styles.characterCount}>
                            {formData.description.length}/500
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelButton}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.saveButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    Đang lưu...
                                </>
                            ) : (
                                mode === 'create' ? 'Tạo danh mục' : 'Cập nhật'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;
