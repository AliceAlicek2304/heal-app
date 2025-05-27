import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import Navbar from '../../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import { blogService } from '../../../services/blogService';
import styles from './CreateBlog.module.css';

const CreateBlog = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        categoryId: '',
        thumbnail: null,
        sections: []
    });
    const [thumbnailPreview, setThumbnailPreview] = useState('');

    // Check authentication
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
            const resp = await blogService.getCategories();
            if (resp.success && resp.data) {
                setCategories(resp.data);
            } else {
                toast.error(resp.message || 'Không thể tải danh mục');
            }
        } catch (e) {
            console.error(e);
            toast.error('Có lỗi khi tải danh mục');
        }
    };

    const handleInputChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
    };

    const handleThumbnailChange = e => {
        const file = e.target.files[0];
        if (file) {
            setFormData(f => ({ ...f, thumbnail: file }));
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const addSection = () => {
        setFormData(f => ({
            ...f,
            sections: [
                ...f.sections,
                { sectionTitle: '', sectionContent: '', sectionImage: null, displayOrder: f.sections.length + 1 }
            ]
        }));
    };

    const removeSection = idx => {
        setFormData(f => ({
            ...f,
            sections: f.sections
                .filter((_, i) => i !== idx)
                .map((s, i) => ({ ...s, displayOrder: i + 1 }))
        }));
    };

    const handleSectionChange = (idx, field, value) => {
        setFormData(f => ({
            ...f,
            sections: f.sections.map((s, i) =>
                i === idx ? { ...s, [field]: value } : s
            )
        }));
    };

    const handleSectionImageChange = (idx, file) => {
        setFormData(f => ({
            ...f,
            sections: f.sections.map((s, i) =>
                i === idx ? { ...s, sectionImage: file } : s
            )
        }));
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề');
            return false;
        }
        if (!formData.content.trim()) {
            toast.error('Vui lòng nhập nội dung chính');
            return false;
        }
        if (!formData.categoryId) {
            toast.error('Vui lòng chọn danh mục');
            return false;
        }
        if (!formData.thumbnail) {
            toast.error('Vui lòng chọn ảnh đại diện');
            return false;
        }
        for (let i = 0; i < formData.sections.length; i++) {
            const s = formData.sections[i];
            if (!s.sectionTitle.trim()) {
                toast.error(`Vui lòng nhập tiêu đề phần ${i + 1}`);
                return false;
            }
            if (!s.sectionContent.trim()) {
                toast.error(`Vui lòng nhập nội dung phần ${i + 1}`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const blogData = {
                title: formData.title,
                content: formData.content,
                categoryId: parseInt(formData.categoryId),
                thumbnail: formData.thumbnail,
                sections: formData.sections.map(s => ({
                    sectionTitle: s.sectionTitle,
                    sectionContent: s.sectionContent,
                    displayOrder: s.displayOrder
                })),
                sectionImages: formData.sections
                    .map(s => s.sectionImage)
                    .filter(Boolean)
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
            toast.error('Lỗi khi tạo bài viết');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => navigate('/blog');

    if (isLoading) {
        return (
            <div className={styles.createBlogPage}>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.createBlogPage}>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.createBlogHeader}>
                    <h1>Tạo Bài Viết Mới</h1>
                    <p>Chia sẻ kiến thức y tế hữu ích với cộng đồng</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.createBlogForm}>
                    {/* Basic Information */}
                    <div className={styles.formSection}>
                        <h3>Thông tin cơ bản</h3>
                        <div className={styles.formGroup}>
                            <label>Tiêu đề <span className={styles.required}>*</span></label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="Nhập tiêu đề..."
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Danh mục <span className={styles.required}>*</span></label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Nội dung chính <span className={styles.required}>*</span></label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                rows={8}
                                required
                                placeholder="Nhập nội dung..."
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Ảnh đại diện <span className={styles.required}>*</span></label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                required
                            />
                            {thumbnailPreview && (
                                <div className={styles.imagePreview}>
                                    <img src={thumbnailPreview} alt="preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detail Sections */}
                    <div className={styles.formSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Các phần chi tiết (tùy chọn)</h3>
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
                        {formData.sections.map((s, i) => (
                            <div key={i} className={styles.blogSection}>
                                <div className={styles.sectionTitle}>
                                    <h4>Phần {i + 1}</h4>
                                    <button
                                        type="button"
                                        className={styles.btnDanger}
                                        onClick={() => removeSection(i)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        Xóa
                                    </button>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tiêu đề phần</label>
                                    <input
                                        type="text"
                                        value={s.sectionTitle}
                                        onChange={e => handleSectionChange(i, 'sectionTitle', e.target.value)}
                                        placeholder="Nhập tiêu đề phần"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Nội dung phần</label>
                                    <textarea
                                        value={s.sectionContent}
                                        onChange={e => handleSectionChange(i, 'sectionContent', e.target.value)}
                                        rows={4}
                                        placeholder="Nhập nội dung phần"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Ảnh minh họa</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleSectionImageChange(i, e.target.files[0])}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
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
                                    Đang tạo...
                                </>
                            ) : 'Tạo bài viết'}
                        </button>
                    </div>
                </form>

                {loading && (
                    <div className={styles.loadingOverlay}>
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateBlog;