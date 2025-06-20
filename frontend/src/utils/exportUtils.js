import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Convert Vietnamese text to ASCII for better PDF compatibility
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
        pdf.text('BAO CAO DASHBOARD HEALAPP', 40, currentY);

        currentY += 30;
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Bao cao duoc tao: ${new Date().toLocaleString('vi-VN')}`, 40, currentY);

        currentY += 20;
        pdf.text('Bao cao tong quan hieu suat kinh doanh', 40, currentY);

        currentY += 20;
        pdf.text(`Chu ky bao cao: ${getCurrentPeriod()}`, 40, currentY);

        // === EXECUTIVE SUMMARY ===
        currentY += 40;
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('TOM TAT DIEU HANH', 40, currentY);

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
        pdf.text('THONG KE TONG QUAN', 40, currentY);

        const overviewData = [
            ['Chi so', 'Gia tri', 'So voi ky truoc', 'Ghi chu'],
            ['Tong nguoi dung', formatNumber(stats.totalUsers), calculateUserGrowth(stats), 'Tat ca users trong he thong'],
            ['Tu van vien', formatNumber(stats.totalConsultants), 'N/A', 'Chuyen gia tu van suc khoe'],
            ['Khach hang', formatNumber(stats.totalUsers - stats.totalConsultants), 'N/A', 'Nguoi dung thuong'],
            ['Tong buoi tu van', formatNumber(stats.totalConsultations), 'N/A', 'Cac buoi tu van da thuc hien'],
            ['Xet nghiem STI', formatNumber(stats.totalSTITests), 'N/A', 'Cac goi xet nghiem da dat'],
            ['Tong doanh thu', formatCurrencyPlain(stats.totalRevenue), getRevenueGrowthText(stats.revenueGrowthRate), 'Doanh thu tich luy tu truoc den nay']
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
            ['Tỷ lệ tư vấn viên', stats.totalUsers > 0 ? ((stats.totalConsultants || 0) / stats.totalUsers * 100).toFixed(2) : 0, '%', 'Tỷ lệ chuyên gia', 'consultants/totalUsers*100'],
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
    try {
        const { test, results, customerInfo, testInfo } = data;

        const pdf = new jsPDF({
            unit: 'pt',
            orientation: 'portrait',
            format: 'a4'
        });

        // Set font
        try {
            pdf.setFont('helvetica', 'normal');
        } catch (fontError) {
            console.warn('Font setting failed, using default');
        }

        let currentY = 40;

        // === HEADER ===
        pdf.setFontSize(24);
        pdf.setTextColor(31, 41, 55);
        pdf.text('KET QUA XET NGHIEM STI', 40, currentY);

        currentY += 30;
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Bao cao duoc tao: ${new Date().toLocaleString('vi-VN')}`, 40, currentY);

        currentY += 40;

        // === CUSTOMER INFORMATION ===
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('THONG TIN KHACH HANG', 40, currentY);

        currentY += 25;
        pdf.setFontSize(11);
        pdf.setTextColor(55, 65, 81);

        const customerData = [
            ['Thong tin', 'Chi tiet'],
            ['Ho ten', customerInfo.name || 'N/A'],
            ['Email', customerInfo.email || 'N/A'],
            ['So dien thoai', customerInfo.phone || 'N/A'],
            ['Ma khach hang', customerInfo.id || 'N/A']
        ];

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
            }
        });

        currentY = pdf.lastAutoTable.finalY + 30;

        // === TEST INFORMATION ===
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('THONG TIN XET NGHIEM', 40, currentY);

        currentY += 25;

        const testData = [
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
        pdf.text('KET QUA CHI TIET', 40, currentY);

        currentY += 25;

        if (results && results.length > 0) {
            // Group results by service if available
            const groupedResults = results.reduce((acc, result) => {
                const serviceName = result.serviceName || 'Xet nghiem tong hop';
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
                pdf.text(serviceName, 40, currentY);
                currentY += 15;

                // Results table for this service
                const serviceResults = groupedResults[serviceName];
                const resultTableData = [
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
                    }
                });

                currentY = pdf.lastAutoTable.finalY + 10;
            });
        } else {
            pdf.setFontSize(12);
            pdf.setTextColor(107, 114, 128);
            pdf.text('Chua co ket qua xet nghiem', 40, currentY);
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
            pdf.text('GHI CHU CUA BAC SI', 40, currentY);

            currentY += 25;
            pdf.setFontSize(11);
            pdf.setTextColor(55, 65, 81);

            const splitNotes = pdf.splitTextToSize(vietnameseToASCII(testInfo.consultantNotes), 500);
            pdf.text(splitNotes, 40, currentY);
        }

        // === FOOTER ===
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            pdf.text('HealApp - Ket qua xet nghiem STI', 40, pdf.internal.pageSize.height - 40);
            pdf.text(`Trang ${i} / ${pageCount}`, pdf.internal.pageSize.width - 100, pdf.internal.pageSize.height - 40);
            pdf.text('Lien he: admin@healapp.vn | Hotline: 1900-xxxx', 40, pdf.internal.pageSize.height - 25);
        }

        // Save file
        const fileName = `HealApp_STI_Result_${testInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error('PDF Export Error:', error);
        throw new Error('Co loi khi xuat PDF');
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
