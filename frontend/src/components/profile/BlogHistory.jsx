import React, { useState, useEffect } from 'react';
import { blogService } from '../../services/blogService';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import './BlogHistory.css';

const STATUS_CLASS = {
    PROCESSING: 'badge-processing',
    CONFIRMED: 'badge-confirmed',
    CANCELED: 'badge-canceled'
};

const BlogHistory = () => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMyPosts = async () => {
        setLoading(true);
        const resp = await blogService.getMyPosts({ page, size: 10 });
        if (resp.success && resp.data) {
            setPosts(resp.data.content || []);
            setTotalPages(resp.data.totalPages || 0);
        } else {
            setError(resp.message || 'Không thể tải bài viết');
        }
        setLoading(false);
    };

    useEffect(() => { fetchMyPosts(); }, [page]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="blog-history">
            <h2>Lịch sử bài viết</h2>

            {posts.length === 0 ? (
                <div className="empty-state">
                    <h3>Chưa có bài viết nào</h3>
                    <p>Bạn chưa tạo bài viết nào. Hãy bắt đầu chia sẻ kiến thức của mình!</p>
                </div>
            ) : (
                <>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Tiêu đề</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map(p => (
                                <tr key={p.id}>
                                    <td>{p.title}</td>
                                    <td>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <span className={`badge ${STATUS_CLASS[p.status] || ''}`}>
                                            {p.status === 'PROCESSING' ? 'Đang xử lý' :
                                                p.status === 'CONFIRMED' ? 'Đã duyệt' :
                                                    p.status === 'CANCELED' ? 'Đã hủy' : p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="action-btn"
                                            onClick={() => window.open(`/blog/${p.id}`, '_blank')}
                                            title="Xem chi tiết bài viết"
                                        >
                                            <i className="fas fa-eye"></i>
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="pagination">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    className={i === page ? 'active' : ''}
                                    onClick={() => setPage(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BlogHistory;