import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { cleanTextForStorage } from '../../../utils/textUtils';
import Navbar from '../../../components/layout/Navbar/Navbar';
import Footer from '../../../components/layout/Footer/Footer';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import { blogService } from '../../../services/blogService';
import styles from './CreateBlog.module.css';

const CreateBlog = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        categoryId: '',
        thumbnail: null,
        sections: [
            {
                sectionTitle: '',
                sectionContent: '',
                displayOrder: 1,
                sectionImage: null
            }
        ]
    });

    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/blog');
            return;
        }
        fetchCategories();
    }, [user, navigate]);

    const fetchCategories = async () => {
        try {
            const response = await blogService.getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Không thể tải danh mục');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 5MB');
                return;
            }
            setFormData(prev => ({ ...prev, thumbnail: file }));
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleSectionChange = (index, field, value) => {
        const updatedSections = [...formData.sections];
        updatedSections[index] = {
            ...updatedSections[index],
            [field]: value
        };
        setFormData(prev => ({
            ...prev,
            sections: updatedSections
        }));
    };

    const handleSectionImageChange = (index, file) => {
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 5MB');
                return;
            }
        }
        const updatedSections = [...formData.sections];
        updatedSections[index] = {
            ...updatedSections[index],
            sectionImage: file
        };
        setFormData(prev => ({
            ...prev,
            sections: updatedSections
        }));
    };

    const addSection = () => {
        const newSection = {
            sectionTitle: '',
            sectionContent: '',
            displayOrder: formData.sections.length + 1,
            sectionImage: null
        };
        setFormData(prev => ({
            ...prev,
            sections: [...prev.sections, newSection]
        }));
    };

    const removeSection = (index) => {
        if (formData.sections.length <= 1) {
            toast.error('Phải có ít nhất một phần');
            return;
        }
        const updatedSections = formData.sections.filter((_, i) => i !== index);
        const reorderedSections = updatedSections.map((section, i) => ({
            ...section,
            displayOrder: i + 1
        }));
        setFormData(prev => ({
            ...prev,
            sections: reorderedSections
        }));
    };

    const removeThumbnail = () => {
        setFormData(prev => ({ ...prev, thumbnail: null }));
        setThumbnailPreview(null);
    };

    const removeSectionImage = (index) => {
        handleSectionImageChange(index, null);
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề');
            return false;
        }
        if (!formData.content.trim()) {
            toast.error('Vui lòng nhập nội dung tổng quan');
            return false;
        }
        if (!formData.categoryId) {
            toast.error('Vui lòng chọn danh mục');
            return false;
        }
        if (!formData.thumbnail) {
            toast.error('Vui lòng chọn ảnh thumbnail');
            return false;
        }
        for (let i = 0; i < formData.sections.length; i++) {
            const section = formData.sections[i];
            if (!section.sectionTitle.trim()) {
                toast.error(`Vui lòng nhập tiêu đề cho phần ${i + 1}`);
                return false;
            }
            if (!section.sectionContent.trim()) {
                toast.error(`Vui lòng nhập nội dung cho phần ${i + 1}`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);
        try {            const blogData = {
                title: formData.title.trim(),
                content: cleanTextForStorage(formData.content),
                categoryId: parseInt(formData.categoryId),
                thumbnail: formData.thumbnail,
                sections: formData.sections.map(s => ({
                    sectionTitle: s.sectionTitle.trim(),
                    sectionContent: cleanTextForStorage(s.sectionContent),
                    displayOrder: s.displayOrder,
                    sectionImage: s.sectionImage
                }))
            };

            const resp = await blogService.createBlogPost(blogData);
            if (resp.success) {
                toast.success('Tạo bài viết thành công! Đang chờ duyệt.');
                setTimeout(() => navigate('/blog'), 3000);
            } else {
                toast.error(resp.message || 'Tạo bài viết thất bại');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi khi tạo bài viết: ' + (e.message || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.createBlogPage}>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.createBlogHeader}>
                    <h1>Tạo Bài Viết Mới</h1>
                    <p>Chia sẻ kiến thức của bạn với cộng đồng</p>
                </div>

                <form className={styles.createBlogForm} onSubmit={handleSubmit}>
                    {loading && (
                        <div className={styles.loadingOverlay}>
                            <LoadingSpinner />
                            <p>Đang tạo bài viết...</p>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className={styles.formSection}>
                        <h3>Thông tin cơ bản</h3>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="title">
                                Tiêu đề <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                className={styles.formInput}
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Nhập tiêu đề bài viết"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="content">
                                Nội dung tổng quan <span className={styles.required}>*</span>
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                className={styles.formTextarea}
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="Mô tả tổng quan về nội dung bài viết"
                                rows="4"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="categoryId">
                                Danh mục <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                className={styles.formSelect}
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(category => (
                                    <option key={category.categoryId} value={category.categoryId}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="thumbnail">
                                Ảnh thumbnail <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="file"
                                id="thumbnail"
                                className={styles.formFile}
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                required
                            />
                            {thumbnailPreview && (
                                <div className={styles.imagePreview}>
                                    <img src={thumbnailPreview} alt="Thumbnail preview" />
                                    <button
                                        type="button"
                                        className={styles.removeImageBtn}
                                        onClick={removeThumbnail}
                                        title="Xóa ảnh"
                                    >
                                        ×
                                    </button>
                                    <div className={styles.imageInfo}>
                                        {formData.thumbnail?.name}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sections */}
                    <div className={styles.formSection}>
                        <h3>Nội dung chi tiết</h3>

                        {formData.sections.map((section, index) => (
                            <div key={index} className={styles.blogSection}>
                                <div className={styles.sectionTitle}>
                                    <h4>Phần {index + 1}</h4>
                                    {formData.sections.length > 1 && (
                                        <button
                                            type="button"
                                            className={styles.btnDanger}
                                            onClick={() => removeSection(index)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                            Xóa phần
                                        </button>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor={`sectionTitle-${index}`}>
                                        Tiêu đề phần <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id={`sectionTitle-${index}`}
                                        className={styles.formInput}
                                        value={section.sectionTitle}
                                        onChange={(e) => handleSectionChange(index, 'sectionTitle', e.target.value)}
                                        placeholder="Nhập tiêu đề cho phần này"
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor={`sectionContent-${index}`}>
                                        Nội dung phần <span className={styles.required}>*</span>
                                    </label>
                                    <textarea
                                        id={`sectionContent-${index}`}
                                        className={styles.formTextarea}
                                        value={section.sectionContent}
                                        onChange={(e) => handleSectionChange(index, 'sectionContent', e.target.value)}
                                        placeholder="Nhập nội dung chi tiết cho phần này"
                                        rows="6"
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor={`sectionImage-${index}`}>
                                        Ảnh minh họa (tùy chọn)
                                    </label>
                                    <input
                                        type="file"
                                        id={`sectionImage-${index}`}
                                        className={styles.formFile}
                                        accept="image/*"
                                        onChange={(e) => handleSectionImageChange(index, e.target.files[0])}
                                    />
                                    {section.sectionImage && (
                                        <div className={styles.imagePreview}>
                                            <img 
                                                src={URL.createObjectURL(section.sectionImage)} 
                                                alt={`Section ${index + 1} preview`} 
                                            />
                                            <button
                                                type="button"
                                                className={styles.removeImageBtn}
                                                onClick={() => removeSectionImage(index)}
                                                title="Xóa ảnh"
                                            >
                                                ×
                                            </button>
                                            <div className={styles.imageInfo}>
                                                {section.sectionImage.name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={addSection}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Thêm phần
                        </button>
                    </div>

                    {/* Form Actions */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={() => navigate('/blog')}
                            disabled={loading}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12,19 5,12 12,5"></polyline>
                            </svg>
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17,21 17,13 7,13 7,21"></polyline>
                                        <polyline points="7,3 7,8 15,8"></polyline>
                                    </svg>
                                    Tạo bài viết
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default CreateBlog;