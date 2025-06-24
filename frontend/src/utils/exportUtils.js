import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Convert Vietnamese text to ASCII for better PDF compatibility
 * This is a fallback function for cases where Unicode fonts are not available
 */
const vietnameseToASCII = (str) => {
    if (!str) return '';

    const vietnameseMap = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'đ': 'd',
        'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
        'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
        'Đ': 'D'
    };

    return str.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, function (match) {
        return vietnameseMap[match] || match;
    });
};

/**
 * Test and improve Unicode font support for PDF
 */
const testUnicodeSupport = (pdf) => {
    const testStrings = [
        'Test Unicode: á à ả ã ạ ă ắ ằ ẳ ẵ ặ â ấ ầ ẩ ẫ ậ',
        'Test Unicode: é è ẻ ẽ ẹ ê ế ề ể ễ ệ',
        'Test Unicode: í ì ỉ ĩ ị',
        'Test Unicode: ó ò ỏ õ ọ ô ố ồ ổ ỗ ộ ơ ớ ờ ở ỡ ợ',
        'Test Unicode: ú ù ủ ũ ụ ư ứ ừ ử ữ ự',
        'Test Unicode: ý ỳ ỷ ỹ ỵ đ'
    ];

    let unicodeSupported = true;

    testStrings.forEach((testStr, index) => {
        try {
            pdf.text(testStr, 10, 20 + (index * 15));
        } catch (error) {
            console.warn(`Unicode test ${index + 1} failed:`, error);
            unicodeSupported = false;
        }
    });

    return unicodeSupported;
};

/**
 * Initialize PDF with Unicode font support
 */
const initializePDFWithUnicode = () => {
    const pdf = new jsPDF({
        unit: 'pt',
        orientation: 'portrait',
        format: 'a4'
    });

    // Try to use Unicode font for Vietnamese text
    try {
        // Import and use a Unicode font if available
        // For now, we'll use the built-in font with better encoding
        pdf.setFont('helvetica', 'normal');

        // Set encoding to support Unicode characters
        pdf.setFontSize(12);

        // Test if Unicode is supported
        try {
            pdf.text('Test Unicode: á à ả ã ạ', 10, 10);
        } catch (unicodeError) {
            console.warn('Unicode not fully supported, will use fallback');
        }
    } catch (fontError) {
        console.warn('Font initialization failed, using default font');
        pdf.setFont('helvetica', 'normal');
    }

    return pdf;
};

/**
 * Safe text function that handles Vietnamese characters
 */
const safeText = (pdf, text, x, y, options = {}) => {
    if (!text) return;

    try {
        // Try to use original text first
        pdf.text(text, x, y, options);
    } catch (error) {
        // If Unicode text fails, fallback to ASCII
        console.warn('Unicode text failed, using ASCII fallback:', error);
        const asciiText = vietnameseToASCII(text);
        pdf.text(asciiText, x, y, options);
    }
};

/**
 * Export comprehensive dashboard stats to PDF with custom font support
 */
export const exportToPDF = (stats) => {
    try {
        // Create PDF with custom configuration
        const pdf = new jsPDF({
            unit: 'pt',
            orientation: 'portrait',
            format: 'a4'
        });

        // Try to use custom font (you'll need to add the font file)
        // For now, we'll use a fallback approach
        try {
            // If you have a custom font, uncomment and modify these lines:
            // pdf.addFileToVFS("RobotoRegular.ttf", [base64_font_data]);
            // pdf.addFont("RobotoRegular.ttf", "Roboto", "normal");
            // pdf.setFont("Roboto", "normal");

            // Fallback to default font
            pdf.setFont('helvetica', 'normal');
        } catch (fontError) {
            console.warn('Custom font not available, using default font');
            pdf.setFont('helvetica', 'normal');
        }

        let currentY = 40;

        // === HEADER SECTION ===
        pdf.setFontSize(24);
        pdf.setTextColor(31, 41, 55);
        pdf.text('HEALAPP DASHBOARD REPORT', 40, currentY);

        currentY += 30;
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Report generated: ${new Date().toLocaleString('en-US')}`, 40, currentY);

        currentY += 20;
        pdf.text('Business performance overview', 40, currentY);

        currentY += 20;
        pdf.text(`Report period: ${getCurrentPeriod()}`, 40, currentY);

        // === EXECUTIVE SUMMARY ===
        currentY += 40;
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('EXECUTIVE SUMMARY', 40, currentY);

        currentY += 30;
        const executiveSummary = generateExecutiveSummary(stats);
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);

        executiveSummary.forEach((line) => {
            pdf.text(vietnameseToASCII(line), 50, currentY);
            currentY += 15;
        });

        // === OVERVIEW STATS TABLE ===
        currentY += 30;
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.text('OVERVIEW STATISTICS', 40, currentY);

        const overviewData = [
            ['Metric', 'Value', 'Vs Previous Period', 'Note'],
            ['Total users', formatNumber(stats.totalUsers), calculateUserGrowth(stats), 'All users in the system'],
            ['Consultants', formatNumber(stats.totalConsultants), 'N/A', 'Health consultants'],
            ['Customers', formatNumber(stats.totalUsers - stats.totalConsultants), 'N/A', 'Regular users'],
            ['Total consultations', formatNumber(stats.totalConsultations), 'N/A', 'Completed consultations'],
            ['STI tests', formatNumber(stats.totalSTITests), 'N/A', 'Booked STI test packages'],
            ['Total revenue', formatCurrencyPlain(stats.totalRevenue), getRevenueGrowthText(stats.revenueGrowthRate), 'Accumulated revenue']
        ];

        pdf.autoTable({
            startY: currentY + 20,
            head: [overviewData[0]],
            body: overviewData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            styles: {
                fontSize: 9,
                cellPadding: 8,
                lineColor: [200, 200, 200],
                lineWidth: 0.5
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 120 },
                1: { halign: 'right', cellWidth: 100 },
                2: { halign: 'center', cellWidth: 100 },
                3: { cellWidth: 200 }
            }
        });

        currentY = pdf.lastAutoTable.finalY + 40;

        // === BUSINESS KPIs SECTION ===
        if (currentY > 700) {
            pdf.addPage();
            currentY = 40;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.text('CHI SO KINH DOANH QUAN TRONG (KPI)', 40, currentY);

        const kpiData = [
            ['KPI', 'Gia tri', 'Danh gia', 'Y nghia', 'Khuyen nghi'],
            [
                'Gia tri don hang TB',
                formatCurrencyPlain(stats.averageOrderValue),
                getKPIAssessment('aov', stats.averageOrderValue),
                'Doanh thu TB moi giao dich',
                getKPIRecommendation('aov', stats.averageOrderValue)
            ],
            [
                'Doanh thu/Nguoi dung',
                formatCurrencyPlain(stats.revenuePerUser),
                getKPIAssessment('rpu', stats.revenuePerUser),
                'Doanh thu TB moi user',
                getKPIRecommendation('rpu', stats.revenuePerUser)
            ],
            [
                'Ty le giu chan KH',
                `${(stats.customerRetentionRate || 0).toFixed(1)}%`,
                getKPIAssessment('retention', stats.customerRetentionRate),
                'KH quay lai trong 30 ngay',
                getKPIRecommendation('retention', stats.customerRetentionRate)
            ],
            [
                'Tang truong doanh thu',
                `${stats.revenueGrowthRate >= 0 ? '+' : ''}${(stats.revenueGrowthRate || 0).toFixed(1)}%`,
                getKPIAssessment('growth', stats.revenueGrowthRate),
                'So voi thang truoc',
                getKPIRecommendation('growth', stats.revenueGrowthRate)
            ]
        ];

        pdf.autoTable({
            startY: currentY + 20,
            head: [kpiData[0]],
            body: kpiData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9
            },
            styles: {
                fontSize: 8,
                cellPadding: 6,
                lineColor: [200, 200, 200],
                lineWidth: 0.5
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 100 },
                1: { halign: 'right', cellWidth: 80 },
                2: { halign: 'center', cellWidth: 80 },
                3: { cellWidth: 120 },
                4: { cellWidth: 140 }
            }
        });

        currentY = pdf.lastAutoTable.finalY + 40;

        // === DETAILED METRICS ===
        if (currentY > 650) {
            pdf.addPage();
            currentY = 40;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.text('CHI TIET METRICS VA TINH TOAN', 40, currentY);

        const detailedMetrics = [
            ['Metric', 'Cong thuc', 'Ket qua', 'Benchmark'],
            ['Customer Lifetime Value', 'RPU * Retention Rate * 12', formatCurrencyPlain(calculateCLV(stats)), '> 2M VND'],
            ['User Engagement Rate', 'Active Users / Total Users', `${calculateEngagementRate(stats).toFixed(1)}%`, '> 60%'],
            ['Service Utilization', 'Total Services / Total Users', `${calculateServiceUtilization(stats).toFixed(2)}`, '> 1.5'],
            ['Revenue per Consultant', 'Total Revenue / Consultants', formatCurrencyPlain(calculateRevenuePerConsultant(stats)), '> 50M VND'],
            ['Market Penetration', 'Paying Users / Total Users', `${calculateMarketPenetration(stats).toFixed(1)}%`, '> 30%']
        ];

        pdf.autoTable({
            startY: currentY + 20,
            head: [detailedMetrics[0]],
            body: detailedMetrics.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: [139, 92, 246],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            styles: {
                fontSize: 9,
                cellPadding: 8
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 140 },
                1: { cellWidth: 150 },
                2: { halign: 'right', cellWidth: 120 },
                3: { halign: 'center', cellWidth: 110 }
            }
        });

        // === FOOTER ===
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            pdf.text('HealApp Dashboard - Bao mat va noi bo', 40, pdf.internal.pageSize.height - 40);
            pdf.text(`Trang ${i} / ${pageCount}`, pdf.internal.pageSize.width - 100, pdf.internal.pageSize.height - 40);
            pdf.text('Lien he: admin@healapp.vn | Hotline: 1900-xxxx', 40, pdf.internal.pageSize.height - 25);
        }

        // Save file
        pdf.save(`HealApp_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Co loi khi xuat PDF. Vui long thu lai sau!');
    }
};

/**
 * Export comprehensive dashboard stats to Excel with Vietnamese support
 */
export const exportToExcel = (stats) => {
    try {
        const wb = XLSX.utils.book_new();

        // === SHEET 1: EXECUTIVE DASHBOARD ===
        const executiveData = [
            ['BÁO CÁO DASHBOARD HEALAPP - EXECUTIVE SUMMARY'],
            [`Ngày báo cáo: ${new Date().toLocaleDateString('vi-VN')}`],
            [`Thời gian tạo: ${new Date().toLocaleTimeString('vi-VN')}`],
            [`Chu kỳ: ${getCurrentPeriod()}`],
            [''],
            ['=== TÓM TẮT QUAN TRỌNG ==='],
            ...generateExecutiveSummary(stats).map(item => [item]),
            [''],
            ['=== CHỈ SỐ CHÍNH ==='],
            ['Tổng người dùng', stats.totalUsers || 0, 'người'],
            ['Tư vấn viên', stats.totalConsultants || 0, 'người'],
            ['Khách hàng', (stats.totalUsers || 0) - (stats.totalConsultants || 0), 'người'],
            ['Tổng buổi tư vấn', stats.totalConsultations || 0, 'buổi'],
            ['Xét nghiệm STI', stats.totalSTITests || 0, 'lượt'],
            ['Tổng doanh thu', stats.totalRevenue || 0, 'VND'],
            [''],
            ['=== KPI KINH DOANH ==='],
            ['Giá trị đơn hàng TB', stats.averageOrderValue || 0, 'VND'],
            ['Doanh thu/User', stats.revenuePerUser || 0, 'VND'],
            ['Tỷ lệ giữ chân KH', stats.customerRetentionRate || 0, '%'],
            ['Tăng trưởng doanh thu', stats.revenueGrowthRate || 0, '%']
        ];

        const executiveWs = XLSX.utils.aoa_to_sheet(executiveData);
        XLSX.utils.book_append_sheet(wb, executiveWs, 'Executive Summary');

        // === SHEET 2: DETAILED METRICS ===
        const detailedData = [
            ['Chi tiết Metrics và Phân tích'],
            [''],
            ['=== METRICS CƠ BẢN ==='],
            ['Chỉ số', 'Giá trị', 'Đơn vị', 'Ghi chú', 'Tính toán'],
            ['Tổng người dùng', stats.totalUsers || 0, 'người', 'Tất cả users trong hệ thống', 'COUNT(users)'],
            ['Tư vấn viên', stats.totalConsultants || 0, 'người', 'Chuyên gia tư vấn', 'COUNT(users WHERE role=consultant)'],
            ['Khách hàng', (stats.totalUsers || 0) - (stats.totalConsultants || 0), 'người', 'Người dùng thường', 'totalUsers - consultants'],
            ['Tỷ lệ tư vấn viên', stats.totalUsers > 0 ? ((stats.totalConsultations || 0) / stats.totalUsers * 100).toFixed(2) : 0, '%', 'Tỷ lệ chuyên gia', 'consultants/totalUsers*100'],
            ['Buổi tư vấn/Tư vấn viên', stats.totalConsultants > 0 ? ((stats.totalConsultations || 0) / stats.totalConsultants).toFixed(1) : 0, 'buổi/người', 'Hiệu suất tư vấn viên', 'consultations/consultants'],
            ['STI test/User', stats.totalUsers > 0 ? ((stats.totalSTITests || 0) / stats.totalUsers).toFixed(2) : 0, 'test/người', 'Mức độ sử dụng dịch vụ', 'stiTests/totalUsers'],
            [''],
            ['=== METRICS NÂNG CAO ==='],
            ['Customer Lifetime Value', calculateCLV(stats), 'VND', 'Giá trị khách hàng trọn đời', 'RPU * Retention * 12'],
            ['User Engagement Rate', calculateEngagementRate(stats), '%', 'Tỷ lệ tham gia', 'activeUsers/totalUsers*100'],
            ['Service Utilization', calculateServiceUtilization(stats), 'dịch vụ/user', 'Mức độ sử dụng', 'totalServices/totalUsers'],
            ['Revenue per Consultant', calculateRevenuePerConsultant(stats), 'VND', 'Doanh thu mỗi tư vấn viên', 'totalRevenue/consultants'],
            ['Market Penetration', calculateMarketPenetration(stats), '%', 'Xâm nhập thị trường', 'payingUsers/totalUsers*100'],
            ['Average Session Value', calculateAverageSessionValue(stats), 'VND', 'Giá trị phiên TB', 'totalRevenue/totalSessions'],
            ['']
        ];

        const detailedWs = XLSX.utils.aoa_to_sheet(detailedData);
        XLSX.utils.book_append_sheet(wb, detailedWs, 'Chi tiet Metrics');

        // === SHEET 3: KPI ANALYSIS ===
        const kpiAnalysisData = [
            ['PHÂN TÍCH CHI TIẾT KPI'],
            [''],
            ['KPI', 'Giá trị', 'Đơn vị', 'Đánh giá', 'Benchmark', 'Ý nghĩa', 'Khuyến nghị'],
            [
                'Average Order Value',
                stats.averageOrderValue || 0,
                'VND',
                getKPIAssessment('aov', stats.averageOrderValue),
                '> 500,000 VND',
                'Giá trị trung bình mỗi đơn hàng, phản ánh mức chi tiêu khách hàng',
                getKPIRecommendation('aov', stats.averageOrderValue)
            ],
            [
                'Revenue Per User',
                stats.revenuePerUser || 0,
                'VND',
                getKPIAssessment('rpu', stats.revenuePerUser),
                '> 200,000 VND',
                'Doanh thu trung bình mỗi user, đo hiệu quả monetization',
                getKPIRecommendation('rpu', stats.revenuePerUser)
            ],
            [
                'Customer Retention Rate',
                stats.customerRetentionRate || 0,
                '%',
                getKPIAssessment('retention', stats.customerRetentionRate),
                '> 50%',
                'Tỷ lệ khách hàng quay lại, đo loyalty và chất lượng dịch vụ',
                getKPIRecommendation('retention', stats.customerRetentionRate)
            ],
            [
                'Revenue Growth Rate',
                stats.revenueGrowthRate || 0,
                '%',
                getKPIAssessment('growth', stats.revenueGrowthRate),
                '> 5%',
                'Tốc độ tăng trưởng doanh thu, xu hướng phát triển',
                getKPIRecommendation('growth', stats.revenueGrowthRate)
            ],
            [''],
            ['=== PHÂN TÍCH TRENDING ==='],
            ['Tháng này vs Tháng trước'],
            ['Doanh thu', getRevenueGrowthText(stats.revenueGrowthRate)],
            ['Người dùng mới', 'N/A (cần thêm dữ liệu historical)'],
            ['Tỷ lệ chuyển đổi', `${calculateMarketPenetration(stats).toFixed(1)}%`],
            ['']
        ];

        const kpiAnalysisWs = XLSX.utils.aoa_to_sheet(kpiAnalysisData);
        XLSX.utils.book_append_sheet(wb, kpiAnalysisWs, 'Phan tich KPI');

        // Auto-adjust column widths for all sheets
        [executiveWs, detailedWs, kpiAnalysisWs].forEach(ws => {
            const cols = [];
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (cell && cell.v) {
                        const cellLength = String(cell.v).length;
                        maxWidth = Math.max(maxWidth, cellLength);
                    }
                }
                cols.push({ width: Math.min(maxWidth + 2, 60) });
            }
            ws['!cols'] = cols;
        });

        // Export file
        const fileName = `HealApp_Dashboard_Comprehensive_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

    } catch (error) {
        console.error('Excel Export Error:', error);
        alert('Có lỗi khi xuất Excel. Vui lòng thử lại sau!');
    }
};

// === HELPER FUNCTIONS ===

const getCurrentPeriod = () => {
    const now = new Date();
    return `Thang ${now.getMonth() + 1}/${now.getFullYear()}`;
};

const generateExecutiveSummary = (stats) => {
    const summary = [];

    // Business performance
    if (stats.revenueGrowthRate > 10) {
        summary.push('✓ Doanh thu tang truong manh me, vuot muc tieu ke hoach');
    } else if (stats.revenueGrowthRate > 0) {
        summary.push('→ Doanh thu tang truong on dinh, dang trong xu huong tich cuc');
    } else {
        summary.push('⚠ Doanh thu giam sut, can co phuong an phuc hoi');
    }

    // User engagement
    if (stats.totalUsers > 1000) {
        summary.push('✓ He thong co quy mo nguoi dung lon, tiem nang phat trien cao');
    } else if (stats.totalUsers > 500) {
        summary.push('→ Co so nguoi dung o muc trung binh, can tang cuong marketing');
    } else {
        summary.push('⚠ Can mo rong co so nguoi dung de tang suc canh tranh');
    }

    // Service utilization
    const utilizationRate = calculateServiceUtilization(stats);
    if (utilizationRate > 1.5) {
        summary.push('✓ Muc do su dung dich vu cao, khach hang rat tich cuc');
    } else if (utilizationRate > 1.0) {
        summary.push('→ Su dung dich vu o muc trung binh, co the cai thien');
    } else {
        summary.push('⚠ Can tang cuong engagement va up-selling');
    }

    // Customer retention
    if (stats.customerRetentionRate > 60) {
        summary.push('✓ Ty le giu chan khach hang xuat sac, dich vu chat luong cao');
    } else if (stats.customerRetentionRate > 40) {
        summary.push('→ Retention o muc chap nhan duoc, can cai thien trai nghiem');
    } else {
        summary.push('⚠ Retention thap, can xem xet lai chat luong dich vu');
    }

    return summary;
};

const getKPIAssessment = (type, value) => {
    switch (type) {
        case 'aov':
            if (value >= 1000000) return 'Xuat sac';
            if (value >= 500000) return 'Tot';
            if (value >= 200000) return 'Trung binh';
            return 'Can cai thien';

        case 'rpu':
            if (value >= 500000) return 'Rat tot';
            if (value >= 200000) return 'Tot';
            if (value >= 100000) return 'On';
            return 'Thap';

        case 'retention':
            if (value >= 70) return 'Tuyet voi';
            if (value >= 50) return 'Tot';
            if (value >= 30) return 'Trung binh';
            return 'Can cai thien';

        case 'growth':
            if (value >= 15) return 'Tang truong manh';
            if (value >= 10) return 'Tang truong tot';
            if (value >= 5) return 'Tang truong nhe';
            if (value >= 0) return 'On dinh';
            return 'Giam sut';

        default:
            return 'N/A';
    }
};

const getKPIRecommendation = (type, value) => {
    switch (type) {
        case 'aov':
            if (value < 200000) return 'Tang cuong cross-sell, up-sell, premium packages';
            if (value < 500000) return 'Phat trien them dich vu gia tri cao';
            return 'Duy tri chat luong, mo rong portfolio';

        case 'rpu':
            if (value < 100000) return 'Cai thien engagement, retention campaigns';
            if (value < 300000) return 'Phat trien premium services';
            return 'Toi uu hoa customer journey';

        case 'retention':
            if (value < 30) return 'Uu tien cai thien chat luong dich vu, follow-up';
            if (value < 50) return 'Xay dung loyalty program, customer success';
            return 'Phat trien VIP program, exclusive benefits';

        case 'growth':
            if (value < 0) return 'Phan tich nguyen nhan, dieu chinh strategy khan cap';
            if (value < 5) return 'Tang cuong marketing, improve conversion';
            return 'Scale up thanh cong, maintain momentum';

        default:
            return '';
    }
};

// Advanced calculation functions
const calculateCLV = (stats) => {
    const rpu = stats.revenuePerUser || 0;
    const retention = (stats.customerRetentionRate || 0) / 100;
    return rpu * retention * 12; // 12 months
};

const calculateEngagementRate = (stats) => {
    const activeUsers = Math.min(stats.totalUsers || 0, (stats.totalConsultations || 0) + (stats.totalSTITests || 0));
    return stats.totalUsers > 0 ? (activeUsers / stats.totalUsers) * 100 : 0;
};

const calculateServiceUtilization = (stats) => {
    const totalServices = (stats.totalConsultations || 0) + (stats.totalSTITests || 0);
    return stats.totalUsers > 0 ? totalServices / stats.totalUsers : 0;
};

const calculateRevenuePerConsultant = (stats) => {
    return stats.totalConsultants > 0 ? (stats.totalRevenue || 0) / stats.totalConsultants : 0;
};

const calculateMarketPenetration = (stats) => {
    const estimatedPayingUsers = stats.averageOrderValue > 0 ? (stats.totalRevenue || 0) / stats.averageOrderValue : 0;
    return stats.totalUsers > 0 ? (estimatedPayingUsers / stats.totalUsers) * 100 : 0;
};

const calculateAverageSessionValue = (stats) => {
    const totalSessions = (stats.totalConsultations || 0) + (stats.totalSTITests || 0);
    return totalSessions > 0 ? (stats.totalRevenue || 0) / totalSessions : 0;
};

const calculateUserGrowth = (stats) => {
    return 'N/A (can du lieu lich su)';
};

const getRevenueGrowthText = (growthRate) => {
    if (growthRate > 0) return `+${growthRate.toFixed(1)}% (tang)`;
    if (growthRate < 0) return `${growthRate.toFixed(1)}% (giam)`;
    return '0% (on dinh)';
};

// Formatting helpers
const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num || 0);
};

const formatCurrencyPlain = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' VND';
};

/**
 * Export STI test result to PDF
 */
export const exportSTIResultToPDF = (data) => {
    let unicodeSupported = false; // Declare at function level

    try {
        const { test, results, customerInfo, testInfo } = data;

        // Create PDF with better Unicode support
        const pdf = new jsPDF({
            unit: 'pt',
            orientation: 'portrait',
            format: 'a4',
            putOnlyUsedFonts: true,
            floatPrecision: 16
        });

        // Test Unicode support
        unicodeSupported = testUnicodeSupport(pdf);
        console.log('Unicode support:', unicodeSupported);

        // Set font based on Unicode support
        try {
            if (unicodeSupported) {
                pdf.setFont('helvetica', 'normal');
            } else {
                pdf.setFont('helvetica', 'normal');
                console.warn('Using ASCII fallback for Vietnamese text');
            }
        } catch (fontError) {
            console.warn('Font setup failed, using default');
        }

        let currentY = 40;

        // === HEADER ===
        pdf.setFontSize(24);
        pdf.setTextColor(31, 41, 55);

        const headerText = unicodeSupported ? 'KẾT QUẢ XÉT NGHIỆM STI' : 'KET QUA XET NGHIEM STI';
        pdf.text(headerText, 40, currentY);

        currentY += 30;
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128);

        const reportDate = unicodeSupported
            ? `Báo cáo được tạo: ${new Date().toLocaleString('vi-VN')}`
            : `Bao cao duoc tao: ${new Date().toLocaleString('vi-VN')}`;
        pdf.text(reportDate, 40, currentY);

        currentY += 40;

        // === CUSTOMER INFORMATION ===
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);

        const customerHeader = unicodeSupported ? 'THÔNG TIN KHÁCH HÀNG' : 'THONG TIN KHACH HANG';
        pdf.text(customerHeader, 40, currentY);

        currentY += 25;
        pdf.setFontSize(11);
        pdf.setTextColor(55, 65, 81);

        const customerData = unicodeSupported ? [
            ['Thông tin', 'Chi tiết'],
            ['Họ tên', customerInfo.name || 'N/A'],
            ['Email', customerInfo.email || 'N/A'],
            ['Số điện thoại', customerInfo.phone || 'N/A'],
            ['Mã khách hàng', customerInfo.id || 'N/A']
        ] : [
            ['Thong tin', 'Chi tiet'],
            ['Ho ten', customerInfo.name || 'N/A'],
            ['Email', customerInfo.email || 'N/A'],
            ['So dien thoai', customerInfo.phone || 'N/A'],
            ['Ma khach hang', customerInfo.id || 'N/A']
        ];

        // Use autoTable with safe text handling
        pdf.autoTable({
            startY: currentY,
            head: [customerData[0]],
            body: customerData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            styles: {
                fontSize: 10,
                cellPadding: 8
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 150 },
                1: { cellWidth: 350 }
            },
            didParseCell: function (data) {
                // Handle Vietnamese text in cells
                if (data.cell.text && !unicodeSupported) {
                    data.cell.text = vietnameseToASCII(data.cell.text);
                }
            }
        });

        currentY = pdf.lastAutoTable.finalY + 30;

        // === TEST INFORMATION ===
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);

        const testHeader = unicodeSupported ? 'THÔNG TIN XÉT NGHIỆM' : 'THONG TIN XET NGHIEM';
        pdf.text(testHeader, 40, currentY);

        currentY += 25;

        const testData = unicodeSupported ? [
            ['Thông tin', 'Chi tiết'],
            ['Mã xét nghiệm', testInfo.id?.toString() || 'N/A'],
            ['Tên dịch vụ', testInfo.serviceName || 'N/A'],
            ['Mô tả', testInfo.serviceDescription || 'N/A'],
            ['Ngày hẹn', formatDateForPDF(testInfo.appointmentDate) || 'N/A'],
            ['Ngày có kết quả', formatDateForPDF(testInfo.resultDate) || 'N/A'],
            ['Nhân viên thực hiện', testInfo.staffName || 'N/A']
        ] : [
            ['Thong tin', 'Chi tiet'],
            ['Ma xet nghiem', testInfo.id?.toString() || 'N/A'],
            ['Ten dich vu', testInfo.serviceName || 'N/A'],
            ['Mo ta', testInfo.serviceDescription || 'N/A'],
            ['Ngay hen', formatDateForPDF(testInfo.appointmentDate) || 'N/A'],
            ['Ngay co ket qua', formatDateForPDF(testInfo.resultDate) || 'N/A'],
            ['Nhan vien thuc hien', testInfo.staffName || 'N/A']
        ];

        pdf.autoTable({
            startY: currentY,
            head: [testData[0]],
            body: testData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            styles: {
                fontSize: 10,
                cellPadding: 8
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 150 },
                1: { cellWidth: 350 }
            },
            didParseCell: function (data) {
                // Handle Vietnamese text in cells
                if (data.cell.text && !unicodeSupported) {
                    data.cell.text = vietnameseToASCII(data.cell.text);
                }
            }
        });

        currentY = pdf.lastAutoTable.finalY + 30;

        // === TEST RESULTS ===
        if (currentY > 650) {
            pdf.addPage();
            currentY = 40;
        }

        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);

        const resultsHeader = unicodeSupported ? 'KẾT QUẢ CHI TIẾT' : 'KET QUA CHI TIET';
        pdf.text(resultsHeader, 40, currentY);

        currentY += 25;

        if (results && results.length > 0) {
            // Group results by service if available
            const groupedResults = results.reduce((acc, result) => {
                const serviceName = result.serviceName || (unicodeSupported ? 'Xét nghiệm tổng hợp' : 'Xet nghiem tong hop');
                if (!acc[serviceName]) {
                    acc[serviceName] = [];
                }
                acc[serviceName].push(result);
                return acc;
            }, {});

            Object.keys(groupedResults).forEach((serviceName, serviceIndex) => {
                if (serviceIndex > 0) {
                    currentY += 20;
                }

                // Service header
                pdf.setFontSize(14);
                pdf.setTextColor(31, 41, 55);

                const displayServiceName = unicodeSupported ? serviceName : vietnameseToASCII(serviceName);
                pdf.text(displayServiceName, 40, currentY);

                currentY += 15;

                // Results table for this service
                const serviceResults = groupedResults[serviceName];
                const resultTableData = unicodeSupported ? [
                    ['Thành phần', 'Kết quả', 'Khoảng bình thường', 'Đơn vị'],
                    ...serviceResults.map(result => [
                        result.componentName || result.testName || 'N/A',
                        result.resultValue || 'N/A',
                        result.normalRange || 'N/A',
                        result.unit || 'N/A'
                    ])
                ] : [
                    ['Thanh phan', 'Ket qua', 'Khoang binh thuong', 'Don vi'],
                    ...serviceResults.map(result => [
                        result.componentName || result.testName || 'N/A',
                        result.resultValue || 'N/A',
                        result.normalRange || 'N/A',
                        result.unit || 'N/A'
                    ])
                ];

                pdf.autoTable({
                    startY: currentY,
                    head: [resultTableData[0]],
                    body: resultTableData.slice(1),
                    theme: 'striped',
                    headStyles: {
                        fillColor: [139, 92, 246],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    styles: {
                        fontSize: 9,
                        cellPadding: 6
                    },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 120 },
                        1: { cellWidth: 100 },
                        2: { cellWidth: 120 },
                        3: { cellWidth: 80 }
                    },
                    didParseCell: function (data) {
                        // Handle Vietnamese text in cells
                        if (data.cell.text && !unicodeSupported) {
                            data.cell.text = vietnameseToASCII(data.cell.text);
                        }
                    }
                });

                currentY = pdf.lastAutoTable.finalY + 10;
            });
        } else {
            pdf.setFontSize(12);
            pdf.setTextColor(107, 114, 128);
            const noResultsText = unicodeSupported ? 'Chưa có kết quả xét nghiệm' : 'Chua co ket qua xet nghiem';
            pdf.text(noResultsText, 40, currentY);
        }

        // === NOTES ===
        if (testInfo.consultantNotes) {
            currentY += 30;
            if (currentY > 700) {
                pdf.addPage();
                currentY = 40;
            }

            pdf.setFontSize(16);
            pdf.setTextColor(31, 41, 55);
            const notesHeader = unicodeSupported ? 'GHI CHÚ CỦA BÁC SĨ' : 'GHI CHU CUA BAC SI';
            pdf.text(notesHeader, 40, currentY);

            currentY += 25;
            pdf.setFontSize(11);
            pdf.setTextColor(55, 65, 81);

            // Handle long text with Vietnamese characters
            let notesText = testInfo.consultantNotes;
            if (!unicodeSupported) {
                notesText = vietnameseToASCII(notesText);
            }

            const splitNotes = pdf.splitTextToSize(notesText, 500);
            pdf.text(splitNotes, 40, currentY);
        }

        // === FOOTER ===
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            const footerText = unicodeSupported
                ? 'HealApp - Kết quả xét nghiệm STI'
                : 'HealApp - Ket qua xet nghiem STI';
            pdf.text(footerText, 40, pdf.internal.pageSize.height - 40);
            pdf.text(`Trang ${i} / ${pageCount}`, pdf.internal.pageSize.width - 100, pdf.internal.pageSize.height - 40);
            const contactText = unicodeSupported
                ? 'Liên hệ: admin@healapp.vn | Hotline: 1900-xxxx'
                : 'Lien he: admin@healapp.vn | Hotline: 1900-xxxx';
            pdf.text(contactText, 40, pdf.internal.pageSize.height - 25);
        }

        // Save file
        const fileName = `HealApp_STI_Result_${testInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error('PDF Export Error:', error);
        throw new Error(unicodeSupported ? 'Có lỗi khi xuất PDF' : 'Co loi khi xuat PDF');
    }
};

/**
 * Export STI test result to Excel
 */
export const exportSTIResultToExcel = (data) => {
    try {
        const { test, results, customerInfo, testInfo } = data;
        const wb = XLSX.utils.book_new();

        // === SHEET 1: TEST OVERVIEW ===
        const overviewData = [
            ['KẾT QUẢ XÉT NGHIỆM STI - HEALAPP'],
            [`Báo cáo được tạo: ${new Date().toLocaleString('vi-VN')}`],
            [''],
            ['=== THÔNG TIN KHÁCH HÀNG ==='],
            ['Họ tên', customerInfo.name || 'N/A'],
            ['Email', customerInfo.email || 'N/A'],
            ['Số điện thoại', customerInfo.phone || 'N/A'],
            ['Mã khách hàng', customerInfo.id || 'N/A'],
            [''],
            ['=== THÔNG TIN XÉT NGHIỆM ==='],
            ['Mã xét nghiệm', testInfo.id || 'N/A'],
            ['Tên dịch vụ', testInfo.serviceName || 'N/A'],
            ['Mô tả', testInfo.serviceDescription || 'N/A'],
            ['Ngày hẹn', formatDateForExcel(testInfo.appointmentDate) || 'N/A'],
            ['Ngày có kết quả', formatDateForExcel(testInfo.resultDate) || 'N/A'],
            ['Nhân viên thực hiện', testInfo.staffName || 'N/A'],
            ['']
        ];

        if (testInfo.consultantNotes) {
            overviewData.push(
                ['=== GHI CHÚ CỦA BÁC SĨ ==='],
                [testInfo.consultantNotes],
                ['']
            );
        }

        const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, overviewWs, 'Tong quan');

        // === SHEET 2: DETAILED RESULTS ===
        if (results && results.length > 0) {
            const resultData = [
                ['CHI TIẾT KẾT QUẢ XÉT NGHIỆM'],
                [''],
                ['Thành phần', 'Kết quả', 'Khoảng bình thường', 'Đơn vị', 'Dịch vụ', 'Ghi chú']
            ];

            results.forEach(result => {
                resultData.push([
                    result.componentName || result.testName || 'N/A',
                    result.resultValue || 'N/A',
                    result.normalRange || 'N/A',
                    result.unit || 'N/A',
                    result.serviceName || 'N/A',
                    result.notes || ''
                ]);
            });

            const resultWs = XLSX.utils.aoa_to_sheet(resultData);
            XLSX.utils.book_append_sheet(wb, resultWs, 'Ket qua chi tiet');

            // === SHEET 3: ANALYSIS BY SERVICE ===
            const groupedResults = results.reduce((acc, result) => {
                const serviceName = result.serviceName || 'Xét nghiệm tổng hợp';
                if (!acc[serviceName]) {
                    acc[serviceName] = [];
                }
                acc[serviceName].push(result);
                return acc;
            }, {});

            const analysisData = [
                ['PHÂN TÍCH THEO DỊCH VỤ'],
                ['']
            ];

            Object.keys(groupedResults).forEach(serviceName => {
                analysisData.push([`=== ${serviceName.toUpperCase()} ===`]);
                analysisData.push(['Thành phần', 'Kết quả', 'Khoảng bình thường', 'Đơn vị']);

                groupedResults[serviceName].forEach(result => {
                    analysisData.push([
                        result.componentName || result.testName || 'N/A',
                        result.resultValue || 'N/A',
                        result.normalRange || 'N/A',
                        result.unit || 'N/A'
                    ]);
                });

                analysisData.push(['']); // Empty row between services
            });

            const analysisWs = XLSX.utils.aoa_to_sheet(analysisData);
            XLSX.utils.book_append_sheet(wb, analysisWs, 'Phan tich theo dich vu');
        }

        // Auto-adjust column widths
        [overviewWs, wb.Sheets['Ket qua chi tiet'], wb.Sheets['Phan tich theo dich vu']].forEach(ws => {
            if (!ws) return;

            const cols = [];
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (cell && cell.v) {
                        const cellLength = String(cell.v).length;
                        maxWidth = Math.max(maxWidth, cellLength);
                    }
                }
                cols.push({ width: Math.min(maxWidth + 2, 60) });
            }
            ws['!cols'] = cols;
        });

        // Export file
        const fileName = `HealApp_STI_Result_${testInfo.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

    } catch (error) {
        console.error('Excel Export Error:', error);
        throw new Error('Có lỗi khi xuất Excel');
    }
};

// Helper functions for STI export
const formatDateForPDF = (dateInput) => {
    if (!dateInput) return null;

    try {
        let date;
        if (Array.isArray(dateInput)) {
            // Array format: [year, month, day, hour, minute, second, nanosecond]
            date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2],
                dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0);
        } else {
            date = new Date(dateInput);
        }

        return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'N/A';
    }
};

const formatDateForExcel = (dateInput) => {
    if (!dateInput) return null;

    try {
        let date;
        if (Array.isArray(dateInput)) {
            // Array format: [year, month, day, hour, minute, second, nanosecond]
            date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2],
                dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0);
        } else {
            date = new Date(dateInput);
        }

        return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'N/A';
    }
};

/**
 * Export STI test list to PDF for admin management
 */
export const exportSTITestListToPDF = (data) => {
    let unicodeSupported = false;

    try {
        const { tests, filters, exportInfo } = data;

        // Create PDF with better Unicode support
        const pdf = new jsPDF({
            unit: 'pt',
            orientation: 'landscape', // Use landscape for better table fit
            format: 'a4',
            putOnlyUsedFonts: true,
            floatPrecision: 16
        });

        // Test Unicode support
        unicodeSupported = testUnicodeSupport(pdf);
        console.log('Unicode support for STI list:', unicodeSupported);

        // Set font based on Unicode support
        try {
            if (unicodeSupported) {
                pdf.setFont('helvetica', 'normal');
            } else {
                pdf.setFont('helvetica', 'normal');
                console.warn('Using ASCII fallback for Vietnamese text in STI list');
            }
        } catch (fontError) {
            console.warn('Font setup failed, using default');
        }

        let currentY = 40;

        // === HEADER ===
        pdf.setFontSize(20);
        pdf.setTextColor(31, 41, 55);

        const headerText = unicodeSupported ? 'DANH SÁCH STI TEST - QUẢN LÝ' : 'DANH SACH STI TEST - QUAN LY';
        pdf.text(headerText, 40, currentY);

        currentY += 25;
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128);

        const reportDate = unicodeSupported
            ? `Báo cáo được tạo: ${new Date().toLocaleString('vi-VN')}`
            : `Bao cao duoc tao: ${new Date().toLocaleString('vi-VN')}`;
        pdf.text(reportDate, 40, currentY);

        currentY += 20;
        const exportInfoText = unicodeSupported
            ? `Tổng số test: ${exportInfo.totalTests} | Xuất bởi: ${exportInfo.exportedBy}`
            : `Tong so test: ${exportInfo.totalTests} | Xuat boi: ${exportInfo.exportedBy}`;
        pdf.text(exportInfoText, 40, currentY);

        currentY += 30;

        // === FILTERS INFO ===
        if (filters.searchTerm || filters.selectedStatus || filters.selectedPaymentStatus) {
            pdf.setFontSize(14);
            pdf.setTextColor(31, 41, 55);

            const filtersHeader = unicodeSupported ? 'BỘ LỌC ÁP DỤNG' : 'BO LOC AP DUNG';
            pdf.text(filtersHeader, 40, currentY);

            currentY += 20;
            pdf.setFontSize(10);
            pdf.setTextColor(55, 65, 81);

            const filterTexts = [];
            if (filters.searchTerm) {
                filterTexts.push(unicodeSupported
                    ? `Tìm kiếm: "${filters.searchTerm}"`
                    : `Tim kiem: "${filters.searchTerm}"`
                );
            }
            if (filters.selectedStatus) {
                filterTexts.push(unicodeSupported
                    ? `Trạng thái: ${filters.selectedStatus}`
                    : `Trang thai: ${filters.selectedStatus}`
                );
            }
            if (filters.selectedPaymentStatus) {
                filterTexts.push(unicodeSupported
                    ? `Thanh toán: ${filters.selectedPaymentStatus}`
                    : `Thanh toan: ${filters.selectedPaymentStatus}`
                );
            }

            filterTexts.forEach(text => {
                pdf.text(text, 50, currentY);
                currentY += 15;
            });

            currentY += 20;
        }

        // === TEST LIST TABLE ===
        if (tests && tests.length > 0) {
            pdf.setFontSize(14);
            pdf.setTextColor(31, 41, 55);

            const tableHeader = unicodeSupported ? 'DANH SÁCH CHI TIẾT' : 'DANH SACH CHI TIET';
            pdf.text(tableHeader, 40, currentY);

            currentY += 20;

            // Prepare table data
            const tableData = unicodeSupported ? [
                ['ID', 'Khách hàng', 'Dịch vụ/Package', 'Ngày hẹn', 'Giá', 'Trạng thái', 'Thanh toán', 'Phương thức', 'Ngày tạo']
            ] : [
                ['ID', 'Khach hang', 'Dich vu/Package', 'Ngay hen', 'Gia', 'Trang thai', 'Thanh toan', 'Phuong thuc', 'Ngay tao']
            ];

            tests.forEach(test => {
                const row = [
                    `#${test.testId}`,
                    test.customerName || 'N/A',
                    test.packageName || test.serviceName || 'N/A',
                    formatDateForPDF(test.appointmentDate) || 'Chưa có lịch hẹn',
                    formatCurrencyForPDF(test.totalPrice),
                    getStatusLabel(test.status, unicodeSupported),
                    getPaymentStatusLabel(test.paymentStatus, unicodeSupported),
                    getPaymentMethodLabel(test.paymentMethod, unicodeSupported),
                    formatDateForPDF(test.createdAt)
                ];
                tableData.push(row);
            });

            // Use autoTable with safe text handling
            pdf.autoTable({
                startY: currentY,
                head: [tableData[0]],
                body: tableData.slice(1),
                theme: 'grid',
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.5
                },
                columnStyles: {
                    0: { cellWidth: 60, halign: 'center' },
                    1: { cellWidth: 120 },
                    2: { cellWidth: 140 },
                    3: { cellWidth: 100, halign: 'center' },
                    4: { cellWidth: 80, halign: 'right' },
                    5: { cellWidth: 80, halign: 'center' },
                    6: { cellWidth: 80, halign: 'center' },
                    7: { cellWidth: 80, halign: 'center' },
                    8: { cellWidth: 100, halign: 'center' }
                },
                didParseCell: function (data) {
                    // Handle Vietnamese text in cells
                    if (data.cell.text && !unicodeSupported) {
                        data.cell.text = vietnameseToASCII(data.cell.text);
                    }
                }
            });

            currentY = pdf.lastAutoTable.finalY + 20;
        }

        // === SUMMARY STATS ===
        if (currentY > 500) {
            pdf.addPage();
            currentY = 40;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);

        const summaryHeader = unicodeSupported ? 'THỐNG KÊ TỔNG HỢP' : 'THONG KE TONG HOP';
        pdf.text(summaryHeader, 40, currentY);

        currentY += 25;

        // Calculate summary stats
        const statusCounts = tests.reduce((acc, test) => {
            acc[test.status] = (acc[test.status] || 0) + 1;
            return acc;
        }, {});

        const paymentStatusCounts = tests.reduce((acc, test) => {
            acc[test.paymentStatus] = (acc[test.paymentStatus] || 0) + 1;
            return acc;
        }, {});

        const totalRevenue = tests.reduce((sum, test) => sum + (test.totalPrice || 0), 0);

        const summaryData = unicodeSupported ? [
            ['Chỉ số', 'Giá trị', 'Tỷ lệ'],
            ['Tổng số test', tests.length.toString(), '100%'],
            ['Đã hoàn thành', (statusCounts.COMPLETED || 0).toString(), `${((statusCounts.COMPLETED || 0) / tests.length * 100).toFixed(1)}%`],
            ['Đã thanh toán', (paymentStatusCounts.COMPLETED || 0).toString(), `${((paymentStatusCounts.COMPLETED || 0) / tests.length * 100).toFixed(1)}%`],
            ['Tổng doanh thu', formatCurrencyForPDF(totalRevenue), 'N/A']
        ] : [
            ['Chi so', 'Gia tri', 'Ty le'],
            ['Tong so test', tests.length.toString(), '100%'],
            ['Da hoan thanh', (statusCounts.COMPLETED || 0).toString(), `${((statusCounts.COMPLETED || 0) / tests.length * 100).toFixed(1)}%`],
            ['Da thanh toan', (paymentStatusCounts.COMPLETED || 0).toString(), `${((paymentStatusCounts.COMPLETED || 0) / tests.length * 100).toFixed(1)}%`],
            ['Tong doanh thu', formatCurrencyForPDF(totalRevenue), 'N/A']
        ];

        pdf.autoTable({
            startY: currentY,
            head: [summaryData[0]],
            body: summaryData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            styles: {
                fontSize: 9,
                cellPadding: 6
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 120 },
                1: { halign: 'center', cellWidth: 100 },
                2: { halign: 'center', cellWidth: 80 }
            },
            didParseCell: function (data) {
                // Handle Vietnamese text in cells
                if (data.cell.text && !unicodeSupported) {
                    data.cell.text = vietnameseToASCII(data.cell.text);
                }
            }
        });

        // === FOOTER ===
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            const footerText = unicodeSupported
                ? 'HealApp - Quản lý STI Test'
                : 'HealApp - Quan ly STI Test';
            pdf.text(footerText, 40, pdf.internal.pageSize.height - 40);
            pdf.text(`Trang ${i} / ${pageCount}`, pdf.internal.pageSize.width - 100, pdf.internal.pageSize.height - 40);
            const contactText = unicodeSupported
                ? 'Liên hệ: admin@healapp.vn | Hotline: 1900-xxxx'
                : 'Lien he: admin@healapp.vn | Hotline: 1900-xxxx';
            pdf.text(contactText, 40, pdf.internal.pageSize.height - 25);
        }

        // Save file
        const fileName = `HealApp_STI_Test_List_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error('PDF Export Error:', error);
        throw new Error(unicodeSupported ? 'Có lỗi khi xuất PDF' : 'Co loi khi xuat PDF');
    }
};

/**
 * Export STI test list to Excel for admin management
 */
export const exportSTITestListToExcel = (data) => {
    try {
        const { tests, filters, exportInfo } = data;
        const wb = XLSX.utils.book_new();

        // === SHEET 1: TEST LIST ===
        const testListData = [
            ['DANH SÁCH STI TEST - HEALAPP'],
            [`Báo cáo được tạo: ${new Date().toLocaleString('vi-VN')}`],
            [`Tổng số test: ${exportInfo.totalTests}`],
            [`Xuất bởi: ${exportInfo.exportedBy}`],
            ['']
        ];

        // Add filters info
        if (filters.searchTerm || filters.selectedStatus || filters.selectedPaymentStatus) {
            testListData.push(['=== BỘ LỌC ÁP DỤNG ===']);
            if (filters.searchTerm) {
                testListData.push(['Tìm kiếm', filters.searchTerm]);
            }
            if (filters.selectedStatus) {
                testListData.push(['Trạng thái', filters.selectedStatus]);
            }
            if (filters.selectedPaymentStatus) {
                testListData.push(['Thanh toán', filters.selectedPaymentStatus]);
            }
            testListData.push(['']);
        }

        // Add table headers
        testListData.push([
            'ID', 'Khách hàng', 'Dịch vụ/Package', 'Ngày hẹn', 'Giá',
            'Trạng thái', 'Thanh toán', 'Phương thức', 'Ngày tạo', 'Ghi chú'
        ]);

        // Add test data
        tests.forEach(test => {
            testListData.push([
                test.testId,
                test.customerName || 'N/A',
                test.packageName || test.serviceName || 'N/A',
                formatDateForExcel(test.appointmentDate) || 'Chưa có lịch hẹn',
                test.totalPrice || 0,
                test.status || 'N/A',
                test.paymentStatus || 'N/A',
                test.paymentMethod || 'N/A',
                formatDateForExcel(test.createdAt),
                test.customerNotes || test.consultantNotes || ''
            ]);
        });

        const testListWs = XLSX.utils.aoa_to_sheet(testListData);
        XLSX.utils.book_append_sheet(wb, testListWs, 'Danh sach test');

        // === SHEET 2: SUMMARY STATS ===
        const statusCounts = tests.reduce((acc, test) => {
            acc[test.status] = (acc[test.status] || 0) + 1;
            return acc;
        }, {});

        const paymentStatusCounts = tests.reduce((acc, test) => {
            acc[test.paymentStatus] = (acc[test.paymentStatus] || 0) + 1;
            return acc;
        }, {});

        const totalRevenue = tests.reduce((sum, test) => sum + (test.totalPrice || 0), 0);

        const summaryData = [
            ['THỐNG KÊ TỔNG HỢP STI TEST'],
            [''],
            ['Chỉ số', 'Giá trị', 'Tỷ lệ', 'Ghi chú'],
            ['Tổng số test', tests.length, '100%', 'Tất cả test trong hệ thống'],
            ['Đã hoàn thành', statusCounts.COMPLETED || 0, `${((statusCounts.COMPLETED || 0) / tests.length * 100).toFixed(1)}%`, 'Test đã hoàn thành'],
            ['Đã thanh toán', paymentStatusCounts.COMPLETED || 0, `${((paymentStatusCounts.COMPLETED || 0) / tests.length * 100).toFixed(1)}%`, 'Test đã thanh toán'],
            ['Tổng doanh thu', totalRevenue, 'N/A', 'Tổng doanh thu từ STI test'],
            [''],
            ['=== PHÂN TÍCH THEO TRẠNG THÁI ==='],
            ['Trạng thái', 'Số lượng', 'Tỷ lệ'],
            ...Object.entries(statusCounts).map(([status, count]) => [
                status, count, `${(count / tests.length * 100).toFixed(1)}%`
            ]),
            [''],
            ['=== PHÂN TÍCH THEO THANH TOÁN ==='],
            ['Trạng thái thanh toán', 'Số lượng', 'Tỷ lệ'],
            ...Object.entries(paymentStatusCounts).map(([status, count]) => [
                status, count, `${(count / tests.length * 100).toFixed(1)}%`
            ])
        ];

        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Thong ke');

        // Auto-adjust column widths
        [testListWs, summaryWs].forEach(ws => {
            const cols = [];
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (cell && cell.v) {
                        const cellLength = String(cell.v).length;
                        maxWidth = Math.max(maxWidth, cellLength);
                    }
                }
                cols.push({ width: Math.min(maxWidth + 2, 60) });
            }
            ws['!cols'] = cols;
        });

        // Export file
        const fileName = `HealApp_STI_Test_List_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

    } catch (error) {
        console.error('Excel Export Error:', error);
        throw new Error('Có lỗi khi xuất Excel');
    }
};

// Helper functions for STI list export
const getStatusLabel = (status, unicodeSupported) => {
    const statusMap = {
        'PENDING': unicodeSupported ? 'Chờ xử lý' : 'Cho xu ly',
        'CONFIRMED': unicodeSupported ? 'Đã xác nhận' : 'Da xac nhan',
        'SAMPLED': unicodeSupported ? 'Đã lấy mẫu' : 'Da lay mau',
        'RESULTED': unicodeSupported ? 'Có kết quả' : 'Co ket qua',
        'COMPLETED': unicodeSupported ? 'Hoàn thành' : 'Hoan thanh',
        'CANCELED': unicodeSupported ? 'Đã hủy' : 'Da huy'
    };
    return statusMap[status] || status;
};

const getPaymentStatusLabel = (status, unicodeSupported) => {
    const statusMap = {
        'PENDING': unicodeSupported ? 'Chờ thanh toán' : 'Cho thanh toan',
        'COMPLETED': unicodeSupported ? 'Đã thanh toán' : 'Da thanh toan',
        'FAILED': unicodeSupported ? 'Thất bại' : 'That bai',
        'EXPIRED': unicodeSupported ? 'Hết hạn' : 'Het han',
        'REFUNDED': unicodeSupported ? 'Đã hoàn tiền' : 'Da hoan tien'
    };
    return statusMap[status] || status;
};

const getPaymentMethodLabel = (method, unicodeSupported) => {
    const methodMap = {
        'COD': unicodeSupported ? 'Tiền mặt' : 'Tien mat',
        'VISA': unicodeSupported ? 'Thẻ' : 'The',
        'QR_CODE': unicodeSupported ? 'QR Code' : 'QR Code'
    };
    return methodMap[method] || method;
};

const formatCurrencyForPDF = (amount) => {
    if (!amount) return '0 VND';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
};
