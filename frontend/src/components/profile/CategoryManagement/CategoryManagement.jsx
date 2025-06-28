import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFolder, FaQuestion } from 'react-icons/fa';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import categoryService from '../../../services/categoryService';
import CategoryModal from './CategoryModal';
import styles from './CategoryManagement.module.css';

const CategoryManagement = () => {
    const [activeTab, setActiveTab] = useState('blog'); // 'blog' or 'question'
    const [blogCategories, setBlogCategories] = useState([]);
    const [questionCategories, setQuestionCategories] = useState([]); const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasAdminRights, setHasAdminRights] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [modalType, setModalType] = useState('blog'); // 'blog' or 'question'

    const { addToast } = useToast();
    const { user } = useAuth();

    // Check if user has admin or staff role (required for category management)
    useEffect(() => {
        if (user) {
            // Handle different role formats
            let userRoles = [];
            if (user.roles && Array.isArray(user.roles)) {
                userRoles = user.roles;
            } else if (user.roles) {
                userRoles = [user.roles];
            } else if (user.role) {
                userRoles = [user.role];
            }

            const hasPermission = userRoles.some(role =>
                ['ADMIN', 'ROLE_ADMIN', 'STAFF', 'ROLE_STAFF'].includes(role));

            // Set admin rights - ADMIN and STAFF can modify categories
            setHasAdminRights(hasPermission);
        }
    }, [user]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const [blogResult, questionResult] = await Promise.all([
                categoryService.blogCategories.getAll(),
                categoryService.questionCategories.getAll()
            ]);

            if (blogResult.success) {
                setBlogCategories(blogResult.data);
            } else {
                addToast(blogResult.message, 'error');
            }

            if (questionResult.success) {
                setQuestionCategories(questionResult.data);
            } else {
                addToast(questionResult.message, 'error');
            }
        } catch (error) {
            addToast('Lỗi khi tải danh mục', 'error');
        } finally {
            setLoading(false);
        }
    }; const handleCreate = (type) => {
        // Check if user has admin rights
        if (!hasAdminRights) {
            addToast('Bạn không có quyền tạo danh mục', 'error');
            return;
        }

        setSelectedCategory(null);
        setModalMode('create');
        setModalType(type);
        setShowModal(true);
    };

    const handleEdit = (category, type) => {
        // Check if user has admin rights
        if (!hasAdminRights) {
            addToast('Bạn không có quyền chỉnh sửa danh mục', 'error');
            return;
        }

        setSelectedCategory(category);
        setModalMode('edit');
        setModalType(type);
        setShowModal(true);
    };

    const handleDelete = async (category, type) => {
        // Check if user has admin rights
        if (!hasAdminRights) {
            addToast('Bạn không có quyền xóa danh mục', 'error');
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
            return;
        }

        try {
            const service = type === 'blog'
                ? categoryService.blogCategories
                : categoryService.questionCategories;

            const result = await service.delete(category.categoryId || category.categoryQuestionId);

            if (result.success) {
                addToast(result.message, 'success');
                loadCategories();
            } else {
                addToast(result.message, 'error');
            }
        } catch (error) {
            addToast('Lỗi khi xóa danh mục', 'error');
        }
    }; const handleSave = async (categoryData) => {
        // Check if user has admin rights
        if (!hasAdminRights) {
            addToast('Bạn không có quyền thực hiện thao tác này', 'error');
            return;
        }

        try {
            const service = modalType === 'blog'
                ? categoryService.blogCategories
                : categoryService.questionCategories;

            let result;
            if (modalMode === 'create') {
                result = await service.create(categoryData);
            } else {
                const id = selectedCategory.categoryId || selectedCategory.categoryQuestionId;
                result = await service.update(id, categoryData);
            }

            if (result.success) {
                addToast(
                    `${modalMode === 'create' ? 'Tạo' : 'Cập nhật'} danh mục thành công!`,
                    'success'
                );
                setShowModal(false);
                loadCategories();
            } else {
                addToast(result.message, 'error');
            }
        } catch (error) {
            addToast('Lỗi khi lưu danh mục', 'error');
        }
    };

    const filteredBlogCategories = blogCategories.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredQuestionCategories = questionCategories.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải danh mục...</p>
            </div>
        );
    }

    return (
        <div className={styles.categoryManagement}>
            <div className={styles.header}>
                <h1 className={styles.title}>Quản lý danh mục</h1>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabNavigation}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'blog' ? styles.active : ''}`}
                    onClick={() => setActiveTab('blog')}
                >
                    <FaFolder />
                    <span>Danh mục Blog ({blogCategories.length})</span>
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'question' ? styles.active : ''}`}
                    onClick={() => setActiveTab('question')}
                >
                    <FaQuestion />
                    <span>Danh mục Câu hỏi ({questionCategories.length})</span>
                </button>
            </div>

            {/* Search and Actions */}
            <div className={styles.toolbar}>
                <div className={styles.searchContainer}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>                <button
                    onClick={() => handleCreate(activeTab)}
                    className={`${styles.createButton} ${!hasAdminRights ? styles.disabled : ''}`}
                    disabled={!hasAdminRights}
                    title={!hasAdminRights ? 'Bạn cần quyền Admin hoặc Staff để tạo danh mục' : ''}
                >
                    <FaPlus />
                    <span>Tạo danh mục mới</span>
                </button>
            </div>

            {/* Category List */}
            <div className={styles.categoryList}>
                {activeTab === 'blog' && (
                    <>
                        {filteredBlogCategories.length === 0 ? (
                            <div className={styles.noData}>
                                <FaFolder />
                                <p>Không tìm thấy danh mục blog nào</p>
                            </div>
                        ) : (
                            <div className={styles.categoryGrid}>
                                {filteredBlogCategories.map(category => (
                                    <div key={category.categoryId} className={styles.categoryCard}>
                                        <div className={styles.categoryHeader}>
                                            <h3 className={styles.categoryName}>{category.name}</h3>                                            <div className={styles.categoryActions}>
                                                <button
                                                    onClick={() => handleEdit(category, 'blog')}
                                                    className={`${styles.editButton} ${!hasAdminRights ? styles.disabled : ''}`}
                                                    disabled={!hasAdminRights}
                                                    title={!hasAdminRights ? 'Bạn cần quyền Admin hoặc Staff để chỉnh sửa' : 'Chỉnh sửa'}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category, 'blog')}
                                                    className={`${styles.deleteButton} ${!hasAdminRights ? styles.disabled : ''}`}
                                                    disabled={!hasAdminRights}
                                                    title={!hasAdminRights ? 'Bạn cần quyền Admin hoặc Staff để xóa' : 'Xóa'}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                        {category.description && (
                                            <p className={styles.categoryDescription}>
                                                {category.description}
                                            </p>
                                        )}
                                        <div className={styles.categoryStats}>
                                            <span className={styles.postCount}>
                                                {category.postCount || 0} bài viết
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'question' && (
                    <>
                        {filteredQuestionCategories.length === 0 ? (
                            <div className={styles.noData}>
                                <FaQuestion />
                                <p>Không tìm thấy danh mục câu hỏi nào</p>
                            </div>
                        ) : (
                            <div className={styles.categoryGrid}>
                                {filteredQuestionCategories.map(category => (
                                    <div key={category.categoryQuestionId} className={styles.categoryCard}>
                                        <div className={styles.categoryHeader}>
                                            <h3 className={styles.categoryName}>{category.name}</h3>                                            <div className={styles.categoryActions}>
                                                <button
                                                    onClick={() => handleEdit(category, 'question')}
                                                    className={`${styles.editButton} ${!hasAdminRights ? styles.disabled : ''}`}
                                                    disabled={!hasAdminRights}
                                                    title={!hasAdminRights ? 'Bạn cần quyền Admin hoặc Staff để chỉnh sửa' : 'Chỉnh sửa'}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category, 'question')}
                                                    className={`${styles.deleteButton} ${!hasAdminRights ? styles.disabled : ''}`}
                                                    disabled={!hasAdminRights}
                                                    title={!hasAdminRights ? 'Bạn cần quyền Admin hoặc Staff để xóa' : 'Xóa'}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                        {category.description && (
                                            <p className={styles.categoryDescription}>
                                                {category.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <CategoryModal
                    category={selectedCategory}
                    mode={modalMode}
                    type={modalType}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default CategoryManagement;
