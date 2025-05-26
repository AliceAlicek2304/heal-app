import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Navbar from '../../../components/layout/Navbar/Navbar';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import { blogService } from '../../../services/blogService';
import './CreateBlog.css';

const CreateBlog = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();       // dùng isLoading để chờ auth
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const alertRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        categoryId: '',
        thumbnail: null,
        sections: []
    });
    const [thumbnailPreview, setThumbnailPreview] = useState('');

    // Khi auth đang load, chỉ show spinner
    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            navigate('/');    // chưa login thì quay về Home (hoặc mở modal)
            return;
        }
        fetchCategories();
    }, [user, isLoading, navigate]);

    // Auto scroll đến alert khi có error hoặc success
    useEffect(() => {
        if ((error || success) && alertRef.current) {
            alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error, success]);

    const fetchCategories = async () => {
        try {
            const resp = await blogService.getCategories();
            if (resp.success && resp.data) {
                setCategories(resp.data);
            } else {
                setError(resp.message || 'Không thể tải danh mục');
            }
        } catch (e) {
            console.error(e);
            setError('Có lỗi khi tải danh mục');
        }
    };

    const handleInputChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
        setError(''); setSuccess('');
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
        if (!formData.title.trim()) return setError('Nhập tiêu đề'), false;
        if (!formData.content.trim()) return setError('Nhập nội dung chính'), false;
        if (!formData.categoryId) return setError('Chọn danh mục'), false;
        if (!formData.thumbnail) return setError('Chọn ảnh đại diện'), false;
        for (let i = 0; i < formData.sections.length; i++) {
            const s = formData.sections[i];
            if (!s.sectionTitle.trim()) return setError(`Nhập tiêu đề phần ${i + 1}`), false;
            if (!s.sectionContent.trim()) return setError(`Nhập nội dung phần ${i + 1}`), false;
        }
        return true;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true); setError(''); setSuccess('');
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
                setSuccess('Tạo bài viết thành công! Đang chờ duyệt.');
                setTimeout(() => navigate('/blog'), 3000);
            } else {
                setError(resp.message || 'Tạo bài viết thất bại');
            }
        } catch (e) {
            console.error(e);
            setError('Lỗi khi tạo bài viết');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => navigate('/blog');

    if (isLoading) {
        return (
            <div className="create-blog-page">
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
        <div className="create-blog-page">
            <Navbar />
            <div className="container">
                <div className="create-blog-header">
                    <h1>Tạo Bài Viết Mới</h1>
                    <p>Chia sẻ kiến thức y tế hữu ích với cộng đồng</p>
                </div>

                {(error || success) && (
                    <div ref={alertRef}
                        className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
                        {error || success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="create-blog-form">
                    {/* Thông tin cơ bản */}
                    <div className="form-section">
                        <h3>Thông tin cơ bản</h3>
                        <div className="form-group">
                            <label>Tiêu đề *</label>
                            <input
                                type="text" name="title" value={formData.title}
                                onChange={handleInputChange} required
                                placeholder="Nhập tiêu đề..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Danh mục *</label>
                            <select
                                name="categoryId" value={formData.categoryId}
                                onChange={handleInputChange} required
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Nội dung chính *</label>
                            <textarea
                                name="content" value={formData.content}
                                onChange={handleInputChange} rows={8}
                                required placeholder="Nhập nội dung..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Ảnh đại diện *</label>
                            <input
                                type="file" accept="image/*"
                                onChange={handleThumbnailChange}
                                required
                            />
                            {thumbnailPreview && (
                                <div className="image-preview">
                                    <img src={thumbnailPreview} alt="preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Phần chi tiết */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>Các phần chi tiết (tùy chọn)</h3>
                            <button type="button" className="btn btn-secondary"
                                onClick={addSection}>
                                Thêm phần
                            </button>
                        </div>
                        {formData.sections.map((s, i) => (
                            <div key={i} className="blog-section">
                                <div className="section-title">
                                    <h4>Phần {i + 1}</h4>
                                    <button type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => removeSection(i)}>
                                        Xóa
                                    </button>
                                </div>
                                <div className="form-group">
                                    <label>Tiêu đề phần</label>
                                    <input
                                        type="text" value={s.sectionTitle}
                                        onChange={e => handleSectionChange(i, 'sectionTitle', e.target.value)}
                                        placeholder="Nhập tiêu đề phần"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nội dung phần</label>
                                    <textarea
                                        value={s.sectionContent}
                                        onChange={e => handleSectionChange(i, 'sectionContent', e.target.value)}
                                        rows={4} placeholder="Nhập nội dung phần"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ảnh minh họa</label>
                                    <input
                                        type="file" accept="image/*"
                                        onChange={e => handleSectionImageChange(i, e.target.files[0])}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Nút hành động */}
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary"
                            onClick={handleCancel} disabled={loading}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary"
                            disabled={loading}>
                            {loading ? 'Đang tạo...' : 'Tạo bài viết'}
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

export default CreateBlog;