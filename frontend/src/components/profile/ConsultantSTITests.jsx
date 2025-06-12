import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import AdvancedFilter from '../common/AdvancedFilter/AdvancedFilter';
import Pagination from '../common/Pagination/Pagination';
import styles from './ConsultantSTITests.module.css';

const ConsultantSTITests = () => {
    const { user } = useAuth();
    const toast = useToast();

    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending-notes'); // pending-notes, all-tests
    const [selectedTest, setSelectedTest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [testResults, setTestResults] = useState([]);
    const [consultantNote, setConsultantNote] = useState(''); const [updating, setUpdating] = useState(false);
    const [filters, setFilters] = useState({});
    const [filteredTests, setFilteredTests] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12); // Items per page (constant)

    // Ref for scrolling to tests list
    const testsListRef = useRef(null);

    useEffect(() => {
        loadTests();
    }, [activeTab]);

    const loadTests = async () => {
        try {
            setLoading(true);

            // API call để lấy tests dành cho consultant
            const token = localStorage.getItem('authToken');
            const endpoint = activeTab === 'pending-notes'
                ? '/sti-services/consultant/pending-notes-tests'
                : '/sti-services/consultant/all-tests';

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                toast.error('Phiên đăng nhập hết hạn');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTests(data.data);
                } else {
                    toast.error(data.message || 'Không thể tải danh sách test');
                }
            } else {
                toast.error('Có lỗi xảy ra khi tải dữ liệu');
            }
        } catch (error) {
            console.error('Error loading tests:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleViewTest = (test) => {
        setSelectedTest(test);
        setConsultantNote(test.consultantNotes || '');
        setShowModal(true);
    };

    const handleViewResults = async (test) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/sti-services/tests/${test.testId}/results`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTestResults(data.data);
                    setSelectedTest(test);
                    setShowResultModal(true);
                } else {
                    toast.error(data.message || 'Không thể tải kết quả test');
                }
            } else {
                toast.error('Có lỗi xảy ra khi tải kết quả');
            }
        } catch (error) {
            console.error('Error loading test results:', error);
            toast.error('Có lỗi xảy ra khi tải kết quả');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateNote = async () => {
        if (!consultantNote.trim()) {
            toast.error('Vui lòng nhập ghi chú');
            return;
        }

        try {
            setUpdating(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/sti-services/consultant/tests/${selectedTest.testId}/notes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    consultantNotes: consultantNote
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Cập nhật ghi chú thành công');
                setShowModal(false);
                loadTests(); // Reload to update the list
            } else {
                toast.error(data.message || 'Không thể cập nhật ghi chú');
            }
        } catch (error) {
            console.error('Error updating note:', error);
            toast.error('Có lỗi xảy ra khi cập nhật ghi chú');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'SAMPLED': '#17a2b8',
            'RESULTED': '#28a745',
            'COMPLETED': '#6f42c1'
        };
        return colors[status] || '#6c757d';
    };

    const getStatusText = (status) => {
        const statusTexts = {
            'SAMPLED': 'Đã lấy mẫu',
            'RESULTED': 'Có kết quả',
            'COMPLETED': 'Hoàn thành'
        };
        return statusTexts[status] || status;
    };

    const renderTestCard = (test) => (
        <div key={test.testId} className={styles.testCard}>
            <div className={styles.cardHeader}>
                <div className={styles.testInfo}>
                    <h3>Test #{test.testId}</h3>
                    <p className={styles.serviceName}>{test.serviceName}</p>
                </div>
                <div className={styles.statusContainer}>
                    <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(test.status) }}
                    >
                        {getStatusText(test.status)}
                    </span>
                    {!test.consultantNotes && (
                        <span className={styles.noNoteBadge}>Chưa có ghi chú</span>
                    )}
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.customerInfo}>
                    <h4>Thông tin khách hàng</h4>
                    <p><strong>Họ tên:</strong> {test.customerName}</p>
                    <p><strong>Email:</strong> {test.customerEmail}</p>
                    {test.customerPhone && (
                        <p><strong>SĐT:</strong> {test.customerPhone}</p>
                    )}
                </div>

                <div className={styles.testDetails}>
                    <p><strong>Ngày hẹn:</strong> {formatDateTime(test.appointmentDate)}</p>
                    {test.resultDate && (
                        <p><strong>Ngày có kết quả:</strong> {formatDateTime(test.resultDate)}</p>
                    )}
                    <p><strong>Giá:</strong> {test.totalPrice?.toLocaleString('vi-VN')} VNĐ</p>
                    {test.staffName && (
                        <p><strong>Nhân viên:</strong> {test.staffName}</p>
                    )}
                </div>

                {test.consultantNotes && (
                    <div className={styles.existingNote}>
                        <h4>Ghi chú hiện tại</h4>
                        <p>{test.consultantNotes}</p>
                    </div>
                )}
            </div>

            <div className={styles.cardActions}>
                <button
                    onClick={() => handleViewTest(test)}
                    className={styles.viewBtn}
                >
                    {test.consultantNotes ? 'Xem/Sửa ghi chú' : 'Thêm ghi chú'}
                </button>
                {(test.status === 'RESULTED' || test.status === 'COMPLETED') && (
                    <button
                        onClick={() => handleViewResults(test)}
                        className={styles.resultBtn}
                    >
                        Xem kết quả
                    </button>
                )}
            </div>
        </div>
    );

    // Filter tests based on selected filters
    const applyFilters = (testsToFilter, currentFilters) => {
        let filtered = [...testsToFilter];

        // Text search filter
        if (currentFilters.searchText) {
            const searchLower = currentFilters.searchText.toLowerCase();
            filtered = filtered.filter(test => {
                return (
                    test.testId?.toString().includes(searchLower) ||
                    test.serviceName?.toLowerCase().includes(searchLower) ||
                    test.customerName?.toLowerCase().includes(searchLower) ||
                    test.customerEmail?.toLowerCase().includes(searchLower) ||
                    test.consultantNotes?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Status filter
        if (currentFilters.status) {
            filtered = filtered.filter(test => test.status === currentFilters.status);
        }

        // Date range filter
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            filtered = filtered.filter(test => {
                const testDate = new Date(test.appointmentDate || test.createdAt);

                if (currentFilters.dateFrom) {
                    const fromDate = new Date(currentFilters.dateFrom);
                    if (testDate < fromDate) return false;
                }

                if (currentFilters.dateTo) {
                    const toDate = new Date(currentFilters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (testDate > toDate) return false;
                }

                return true;
            });
        }

        return filtered;
    };    // Effect to apply filters when tests or filters change
    useEffect(() => {
        const filtered = applyFilters(tests, filters);
        setFilteredTests(filtered);
        // Reset to first page when filters change
        setCurrentPage(1);
    }, [tests, filters]);

    // Reset to first page when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);

        // Scroll to tests list when changing pages
        if (testsListRef.current) {
            testsListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // Fallback: scroll to top of page
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    if (loading && tests.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className={styles.consultantTests}>
            <div className={styles.header}>
                <h2>Quản lý STI Tests - Consultant</h2>
                <button
                    onClick={loadTests}
                    className={styles.refreshBtn}
                    disabled={loading}
                >
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            <div className={styles.tabs}>
                <button
                    className={activeTab === 'pending-notes' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('pending-notes')}
                >
                    Chưa có ghi chú ({tests.length})
                </button>
                <button
                    className={activeTab === 'all-tests' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('all-tests')}
                >
                    Tất cả tests
                </button>            </div>

            {/* Advanced Filter Component */}
            <AdvancedFilter
                onFilterChange={handleFilterChange}
                statusOptions={[
                    { value: 'PENDING', label: 'Chờ xác nhận' },
                    { value: 'CONFIRMED', label: 'Đã xác nhận' },
                    { value: 'SAMPLED', label: 'Đã lấy mẫu' },
                    { value: 'RESULTED', label: 'Có kết quả' },
                    { value: 'COMPLETED', label: 'Hoàn thành' },
                    { value: 'CANCELED', label: 'Đã hủy' }
                ]}
                placeholder="Tìm kiếm theo mã test, khách hàng, dịch vụ..."
                showDateFilter={true}
                showStatusFilter={true}
            />            {tests.length > 0 && (
                <div className={styles.statsInfo}>
                    Hiển thị: {filteredTests.length}/{tests.length} xét nghiệm
                </div>
            )}

            <div className={styles.content}>
                {(() => {
                    const indexOfLastItem = currentPage * itemsPerPage;
                    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                    const currentItems = filteredTests.slice(indexOfFirstItem, indexOfLastItem);
                    const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

                    return (
                        <>
                            {filteredTests.length === 0 ? (
                                tests.length > 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.</p>
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>
                                        <p>
                                            {activeTab === 'pending-notes'
                                                ? 'Không có test nào cần thêm ghi chú'
                                                : 'Không có test nào'
                                            }
                                        </p>
                                    </div>
                                )
                            ) : (
                                <>
                                    <div ref={testsListRef} className={styles.testsGrid}>
                                        {currentItems.map(renderTestCard)}
                                    </div>

                                    {/* Pagination Component */}
                                    {totalPages > 1 && (
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                        />
                                    )}
                                </>
                            )}
                        </>
                    );
                })()}
            </div>

            {/* Note Modal */}
            {showModal && selectedTest && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Ghi chú cho Test #{selectedTest.testId}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className={styles.closeBtn}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.testSummary}>
                                <h4>Thông tin test</h4>
                                <p><strong>Khách hàng:</strong> {selectedTest.customerName}</p>
                                <p><strong>Dịch vụ:</strong> {selectedTest.serviceName}</p>
                                <p><strong>Trạng thái:</strong> {getStatusText(selectedTest.status)}</p>
                            </div>

                            <div className={styles.noteSection}>
                                <label htmlFor="consultantNote">Ghi chú của Consultant</label>
                                <textarea
                                    id="consultantNote"
                                    value={consultantNote}
                                    onChange={(e) => setConsultantNote(e.target.value)}
                                    placeholder="Nhập ghi chú dựa trên kết quả xét nghiệm..."
                                    rows={6}
                                    className={styles.noteTextarea}
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                onClick={() => setShowModal(false)}
                                className={styles.cancelBtn}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateNote}
                                className={styles.saveBtn}
                                disabled={updating}
                            >
                                {updating ? 'Đang lưu...' : 'Lưu ghi chú'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Modal */}
            {showResultModal && selectedTest && (
                <div className={styles.modalOverlay} onClick={() => setShowResultModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Kết quả Test #{selectedTest.testId}</h3>
                            <button
                                onClick={() => setShowResultModal(false)}
                                className={styles.closeBtn}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>                            <div className={styles.resultsTable}>                            <div className={styles.tableHeader}>
                            <div>Thành phần</div>
                            <div>Kết quả</div>
                            <div>Khoảng bình thường</div>
                            <div>Đơn vị</div>
                        </div>                            {testResults.map((result, index) => {
                            return (
                                <div key={index} className={styles.tableRow}>
                                    <div>{result.componentName}</div>
                                    <div className={styles.resultValue}>{result.resultValue}</div>
                                    <div>{result.normalRange || 'N/A'}</div>
                                    <div>{result.unit || 'N/A'}</div>
                                </div>
                            );
                        })}
                        </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                onClick={() => setShowResultModal(false)}
                                className={styles.closeModalBtn}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantSTITests;
