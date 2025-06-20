import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { cleanTextForStorage } from '../../../utils/textUtils';
import Navbar from '../../../components/layout/Navbar/Navbar';
import Footer from '../../../components/layout/Footer/Footer';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import { blogService } from '../../../services/blogService';
import styles from './EditBlog.module.css';

const EditBlog = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [originalPost, setOriginalPost] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        categoryId: '',
        thumbnail: null,
        sections: []
    });

    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/blog');
            return;
        }

        fetchData();
    }, [user, navigate, postId]);

    const fetchData = async () => {
        try {
            setInitialLoading(true);

            // Fetch categories và blog post song song
            const [categoriesResponse, blogResponse] = await Promise.all([
                blogService.getCategories(),
                blogService.getBlogPostById(postId)
            ]);            // Set categories
            if (categoriesResponse.success && categoriesResponse.data) {
                setCategories(categoriesResponse.data);
            }// Set blog data
            if (blogResponse.success && blogResponse.data) {
                const post = blogResponse.data;
                setOriginalPost(post);// Populate form với dữ liệu hiện tại
                const categoryIdStr = post.categoryId ? String(post.categoryId) : '';

                setFormData({
                    title: post.title || '',
                    content: post.content || '',
                    categoryId: categoryIdStr, // Convert to string for select
                    thumbnail: null, // Không set thumbnail cũ
                    sections: post.sections?.map(section => ({
                        sectionTitle: section.sectionTitle || '',
                        sectionContent: section.sectionContent || '',
                        displayOrder: section.displayOrder || 0,
                        sectionImage: null, // Không set image cũ
                        existingSectionImageUrl: section.sectionImage // Lưu URL ảnh cũ để hiển thị
                    })) || []
                });

                // Kiểm tra xem bài viết có thể chỉnh sửa không
                if (post.status === 'CONFIRMED') {
                    addToast('Bài viết đã được duyệt không thể chỉnh sửa', 'warning');
                    navigate('/profile/blog-history');
                    return;
                }

                // Set thumbnail preview nếu có
                if (post.thumbnailImage) {
                    setThumbnailPreview(blogService.getBlogImageUrl(post.thumbnailImage));
                }
            } else {
                addToast('Không thể tải dữ liệu bài viết', 'error');
                navigate('/profile/blog-history');
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
            navigate('/profile/blog-history');
        } finally {
            setInitialLoading(false);
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
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                addToast('File ảnh không được vượt quá 5MB', 'error');
                return;
            }

            setFormData(prev => ({
                ...prev,
                thumbnail: file
            }));

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setThumbnailPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeThumbnail = () => {
        setFormData(prev => ({
            ...prev,
            thumbnail: null
        }));
        setThumbnailPreview(originalPost?.thumbnailImage ? blogService.getBlogImageUrl(originalPost.thumbnailImage) : null);
    };

    const addSection = () => {
        setFormData(prev => ({
            ...prev,
            sections: [...prev.sections, {
                sectionTitle: '',
                sectionContent: '',
                displayOrder: prev.sections.length,
                sectionImage: null,
                existingSectionImageUrl: null
            }]
        }));
    };

    const removeSection = (index) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index).map((section, i) => ({
                ...section,
                displayOrder: i
            }))
        }));
    };

    const handleSectionChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map((section, i) =>
                i === index ? { ...section, [field]: value } : section
            )
        }));
    };

    const handleSectionImageChange = (index, file) => {
        if (file && file.size > 5 * 1024 * 1024) {
            addToast('File ảnh không được vượt quá 5MB', 'error');
            return;
        }

        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map((section, i) =>
                i === index ? { ...section, sectionImage: file } : section
            )
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.title.trim()) {
            addToast('Vui lòng nhập tiêu đề bài viết', 'error');
            return;
        }

        if (!formData.content.trim()) {
            addToast('Vui lòng nhập nội dung bài viết', 'error');
            return;
        } if (!formData.categoryId || formData.categoryId === '') {
            addToast('Vui lòng chọn danh mục', 'error');
            return;
        }        // Validate categoryId is a valid number
        const categoryIdNum = parseInt(formData.categoryId);
        if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
            addToast('Danh mục không hợp lệ - ID không đúng định dạng', 'error');
            return;
        }        // Validate categoryId exists in available categories
        const categoryExists = categories.some(cat => cat.categoryId === categoryIdNum);
        if (!categoryExists) {
            addToast('Danh mục không tồn tại trong hệ thống', 'error');
            return;
        } setLoading(true);
        try {
            // Prepare data for submission
            const submissionData = {
                title: formData.title.trim(),
                content: cleanTextForStorage(formData.content),
                categoryId: categoryIdNum, // Ensure it's a valid number
                thumbnail: formData.thumbnail, // File hoặc null
                sections: formData.sections.map((section, index) => ({
                    sectionTitle: section.sectionTitle.trim(),
                    sectionContent: cleanTextForStorage(section.sectionContent),
                    displayOrder: index,
                    sectionImage: section.sectionImage // File hoặc null
                }))
            }; const response = await blogService.updateBlogPost(postId, submissionData);

            if (response.success) {
                addToast('Cập nhật bài viết thành công!', 'success');
                navigate('/profile/blog-history');
            } else {
                addToast(response.message || 'Có lỗi xảy ra khi cập nhật bài viết', 'error');
            }
        } catch (error) {
            addToast('Có lỗi xảy ra khi cập nhật bài viết', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className={styles.editBlogContainer}>
                <Navbar />
                <div className={styles.editBlogContent}>
                    <div className={styles.container}>
                        <div className={styles.loadingContainer}>
                            <LoadingSpinner />
                            <p className={styles.loadingText}>Đang tải dữ liệu bài viết...</p>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.editBlogContainer}>
            <Navbar />
            <div className={styles.editBlogContent}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Chỉnh sửa bài viết</h1>
                        <p className={styles.subtitle}>Cập nhật thông tin bài viết của bạn</p>
                        {originalPost && (
                            <div className={styles.editIndicator}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Đang chỉnh sửa: {originalPost.title}
                            </div>
                        )}
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        {/* Tiêu đề */}
                        <div className={styles.formGroup}>
                            <label htmlFor="title" className={styles.label}>
                                Tiêu đề bài viết <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="Nhập tiêu đề bài viết..."
                                required
                            />
                        </div>                        {/* Danh mục */}
                        <div className={styles.formGroup}>
                            <label htmlFor="categoryId" className={styles.label}>
                                Danh mục <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                className={styles.select}
                                required
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(category => (
                                    <option key={category.categoryId} value={String(category.categoryId)}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Nội dung chính */}
                        <div className={styles.formGroup}>
                            <label htmlFor="content" className={styles.label}>
                                Nội dung bài viết <span className={styles.required}>*</span>
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                className={styles.textarea}
                                placeholder="Nhập nội dung bài viết..."
                                rows="8"
                                required
                            />
                        </div>

                        {/* Thumbnail */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Ảnh đại diện
                            </label>
                            <div className={styles.thumbnailSection}>
                                {thumbnailPreview ? (
                                    <div className={styles.thumbnailPreview}>
                                        <img
                                            src={thumbnailPreview}
                                            alt="Thumbnail preview"
                                            className={styles.thumbnailImage}
                                        />
                                        <button
                                            type="button"
                                            onClick={removeThumbnail}
                                            className={styles.removeButton}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div onClick={() => document.getElementById('thumbnailInput').click()}>
                                        <div className={styles.uploadIcon}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21,15 16,10 5,21"></polyline>
                                            </svg>
                                        </div>
                                        <p className={styles.uploadText}>Nhấn để chọn ảnh đại diện mới</p>
                                        <p className={styles.uploadHint}>PNG, JPG, GIF tối đa 5MB</p>
                                    </div>
                                )}
                                <input
                                    id="thumbnailInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                    className={styles.hiddenInput}
                                />
                            </div>
                        </div>

                        {/* Sections */}
                        <div className={styles.sectionsContainer}>
                            <div className={styles.sectionsHeader}>
                                <h3 className={styles.sectionsTitle}>Các phần nội dung (tùy chọn)</h3>
                                <button
                                    type="button"
                                    onClick={addSection}
                                    className={styles.addSectionBtn}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Thêm phần
                                </button>
                            </div>

                            {formData.sections.map((section, index) => (
                                <div key={index} className={styles.section}>
                                    <div className={styles.sectionHeader}>
                                        <span className={styles.sectionNumber}>Phần {index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeSection(index)}
                                            className={styles.removeSectionBtn}
                                        >
                                            Xóa
                                        </button>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Tiêu đề phần</label>
                                        <input
                                            type="text"
                                            value={section.sectionTitle}
                                            onChange={(e) => handleSectionChange(index, 'sectionTitle', e.target.value)}
                                            className={styles.input}
                                            placeholder="Nhập tiêu đề phần..."
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Nội dung phần</label>
                                        <textarea
                                            value={section.sectionContent}
                                            onChange={(e) => handleSectionChange(index, 'sectionContent', e.target.value)}
                                            className={styles.textarea}
                                            placeholder="Nhập nội dung phần..."
                                            rows="6"
                                        />
                                    </div>

                                    <div className={styles.sectionImageSection}>
                                        <label className={styles.label}>Ảnh cho phần này</label>
                                        {section.existingSectionImageUrl && !section.sectionImage && (
                                            <div className={styles.sectionImagePreview}>
                                                <img
                                                    src={blogService.getBlogImageUrl(section.existingSectionImageUrl)}
                                                    alt={`Section ${index + 1}`}
                                                    className={styles.sectionImage}
                                                />
                                                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                                                    Ảnh hiện tại (chọn file mới để thay đổi)
                                                </p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleSectionImageChange(index, e.target.files[0])}
                                            className={styles.input}
                                            style={{ marginTop: '0.5rem' }}
                                        />
                                        {section.sectionImage && (
                                            <p style={{ fontSize: '0.85rem', color: '#4285f4', marginTop: '0.25rem' }}>
                                                ✓ Đã chọn ảnh mới: {section.sectionImage.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Form Actions */}
                        <div className={styles.formActions}>
                            <button
                                type="button"
                                onClick={() => navigate('/profile/blog-history')}
                                className={styles.cancelBtn}
                                disabled={loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                            <polyline points="17,21 17,13 7,13 7,21"></polyline>
                                            <polyline points="7,3 7,8 15,8"></polyline>
                                        </svg>
                                        Cập nhật bài viết
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default EditBlog;
