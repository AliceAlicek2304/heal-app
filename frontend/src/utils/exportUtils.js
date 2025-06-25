import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { addRobotoFonts } from './fonts';
import { formatDateTime } from './dateUtils';

// Helper: Chuyển tiếng Việt có dấu sang không dấu (fallback nếu PDF không render được Unicode)
const vietnameseToASCII = (str) => {
    if (!str) return '';
    const map = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'đ': 'd',
        'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
        'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Đ': 'D'
    };
    return str.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, m => map[m] || m);
};

// Helper: Safe text function
const safeText = (pdf, text, x, y, options = {}) => {
    if (!text) return;
    
    try {
        // Đảm bảo font được set đúng
        if (!options.font) {
            options.font = 'Roboto';
        }
        
        // Try original text first
        pdf.text(text, x, y, options);
    } catch (error) {
        console.warn('Text rendering failed, using ASCII fallback:', error);
        // Fallback to ASCII
        const asciiText = vietnameseToASCII(text);
        pdf.text(asciiText, x, y, options);
    }
};

// Helper: Safe text with better font handling
const safeTextWithFont = (pdf, text, x, y, fontSize = 12, fontStyle = 'normal') => {
    if (!text) return;
    
    try {
        pdf.setFont('Roboto', fontStyle);
        pdf.setFontSize(fontSize);
        pdf.text(text, x, y);
    } catch (error) {
        console.warn('Text rendering failed, using ASCII fallback:', error);
        // Fallback to ASCII
        const asciiText = vietnameseToASCII(text);
        pdf.setFont('Roboto', fontStyle);
        pdf.setFontSize(fontSize);
        pdf.text(asciiText, x, y);
    }
};

// Helper: Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

// Helper: Format number
const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num || 0);
};

// Helper: Format percentage
const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value?.toFixed(1) || 0}%`;
};

// ==== EXPORT DASHBOARD PDF ====
export const exportToPDF = async (stats, additionalData = {}) => {
    try {
        const pdf = new jsPDF({ unit: 'pt', orientation: 'portrait', format: 'a4' });
        
        // Load Roboto font
        await addRobotoFonts(pdf);
        
        let y = 40;
        const margin = 40;
        
        // Header
        pdf.setFontSize(24);
        pdf.setFont('Roboto', 'bold');
        safeText(pdf, 'BÁO CÁO DASHBOARD HEALAPP', margin, y);
        y += 40;
        
        pdf.setFontSize(12);
        pdf.setFont('Roboto', 'normal');
        safeText(pdf, `Báo cáo được tạo: ${new Date().toLocaleString('vi-VN')}`, margin, y);
        y += 25;
        safeText(pdf, 'Báo cáo tổng quan hiệu suất kinh doanh và hoạt động hệ thống', margin, y);
        y += 40;
        
        // 1. OVERVIEW STATISTICS
        pdf.setFontSize(16);
        pdf.setFont('Roboto', 'bold');
        safeText(pdf, '1. THỐNG KÊ TỔNG QUAN', margin, y);
        y += 25;
        
        const overviewData = [
            ['Chỉ số', 'Giá trị', 'Mô tả'],
            ['Tổng người dùng', formatNumber(stats.totalUsers), 'Tổng số tài khoản đăng ký'],
            ['Tư vấn viên', formatNumber(stats.totalConsultants), 'Số lượng tư vấn viên hoạt động'],
            ['Khách hàng', formatNumber(stats.totalUsers - stats.totalConsultants), 'Số lượng khách hàng sử dụng dịch vụ'],
            ['Tổng buổi tư vấn', formatNumber(stats.totalConsultations), 'Tổng số buổi tư vấn đã thực hiện'],
            ['Xét nghiệm STI', formatNumber(stats.totalSTITests), 'Tổng số lượt xét nghiệm STI'],
            ['Tổng doanh thu', formatCurrency(stats.totalRevenue), 'Tổng doanh thu từ trước đến nay']
        ];
        
        pdf.autoTable({
            startY: y,
            head: [overviewData[0]],
            body: overviewData.slice(1),
            theme: 'grid',
            headStyles: { 
                fillColor: [59, 130, 246], 
                textColor: 255, 
                fontStyle: 'bold', 
                fontSize: 10, 
                font: 'Roboto' 
            },
            styles: { 
                fontSize: 9, 
                cellPadding: 8, 
                font: 'Roboto' 
            }
        });
        
        y = pdf.lastAutoTable.finalY + 30;
        
        // 2. BUSINESS KPIs
        pdf.setFontSize(16);
        pdf.setFont('Roboto', 'bold');
        safeText(pdf, '2. CHỈ SỐ KINH DOANH QUAN TRỌNG (KPIs)', margin, y);
        y += 25;
        
        const kpiData = [
            ['Chỉ số', 'Giá trị', 'Ý nghĩa'],
            ['Giá trị đơn hàng TB', formatCurrency(stats.averageOrderValue), 'Trung bình giá trị mỗi giao dịch'],
            ['Doanh thu/Người dùng', formatCurrency(stats.revenuePerUser), 'Doanh thu trung bình trên mỗi người dùng'],
            ['Tỷ lệ giữ chân KH', formatPercentage(stats.customerRetentionRate), 'Tỷ lệ khách hàng quay lại sử dụng dịch vụ'],
            ['Tăng trưởng doanh thu', formatPercentage(stats.revenueGrowthRate), 'Tỷ lệ tăng trưởng so với tháng trước'],
            ['Tăng trưởng người dùng', formatPercentage(stats.userGrowthRate), 'Tỷ lệ tăng trưởng người dùng mới'],
            ['Tăng trưởng đơn hàng', formatPercentage(stats.orderGrowthRate), 'Tỷ lệ tăng trưởng số lượng giao dịch']
        ];
        
        pdf.autoTable({
            startY: y,
            head: [kpiData[0]],
            body: kpiData.slice(1),
            theme: 'grid',
            headStyles: { 
                fillColor: [16, 163, 127], 
                textColor: 255, 
                fontStyle: 'bold', 
                fontSize: 10, 
                font: 'Roboto' 
            },
            styles: { 
                fontSize: 9, 
                cellPadding: 8, 
                font: 'Roboto' 
            }
        });
        
        y = pdf.lastAutoTable.finalY + 30;
        
        // 3. TOP CONSULTANTS (if available)
        if (additionalData.topConsultants && additionalData.topConsultants.length > 0) {
            pdf.setFontSize(16);
            pdf.setFont('Roboto', 'bold');
            safeText(pdf, '3. TOP TƯ VẤN VIÊN HOẠT ĐỘNG TỐT NHẤT', margin, y);
            y += 25;
            
            const consultantsData = [
                ['STT', 'Tên tư vấn viên', 'Email', 'Số buổi tư vấn', 'Đánh giá TB']
            ];
            
            additionalData.topConsultants.slice(0, 10).forEach((consultant, index) => {
                consultantsData.push([
                    (index + 1).toString(),
                    consultant.fullName || 'N/A',
                    consultant.email || 'N/A',
                    formatNumber(consultant.bookingCount || 0),
                    `${(consultant.avgRating || 0).toFixed(1)}/5`
                ]);
            });
            
            pdf.autoTable({
                startY: y,
                head: [consultantsData[0]],
                body: consultantsData.slice(1),
                theme: 'grid',
                headStyles: { 
                    fillColor: [217, 119, 6], 
                    textColor: 255, 
                    fontStyle: 'bold', 
                    fontSize: 10, 
                    font: 'Roboto' 
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 6, 
                    font: 'Roboto' 
                }
            });
            
            y = pdf.lastAutoTable.finalY + 30;
        }
        
        // 4. TOP STI SERVICES (if available)
        if (additionalData.topSTIServices && additionalData.topSTIServices.length > 0) {
            pdf.setFontSize(16);
            pdf.setFont('Roboto', 'bold');
            safeText(pdf, '4. TOP DỊCH VỤ XÉT NGHIỆM STI PHỔ BIẾN', margin, y);
            y += 25;
            
            const servicesData = [
                ['STT', 'Tên dịch vụ', 'Giá', 'Số lượt sử dụng', 'Đánh giá TB']
            ];
            
            additionalData.topSTIServices.slice(0, 10).forEach((service, index) => {
                servicesData.push([
                    (index + 1).toString(),
                    service.serviceName || 'N/A',
                    formatCurrency(service.price || 0),
                    formatNumber(service.bookingCount || 0),
                    `${(service.avgRating || 0).toFixed(1)}/5`
                ]);
            });
            
            pdf.autoTable({
                startY: y,
                head: [servicesData[0]],
                body: servicesData.slice(1),
                theme: 'grid',
                headStyles: { 
                    fillColor: [139, 92, 246], 
                    textColor: 255, 
                    fontStyle: 'bold', 
                    fontSize: 10, 
                    font: 'Roboto' 
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 6, 
                    font: 'Roboto' 
                }
            });
            
            y = pdf.lastAutoTable.finalY + 30;
        }
        
        // 5. TOP STI PACKAGES (if available)
        if (additionalData.topSTIPackages && additionalData.topSTIPackages.length > 0) {
            pdf.setFontSize(16);
            pdf.setFont('Roboto', 'bold');
            safeText(pdf, '5. TOP GÓI XÉT NGHIỆM STI PHỔ BIẾN', margin, y);
            y += 25;
            
            const packagesData = [
                ['STT', 'Tên gói', 'Giá', 'Số lượt sử dụng', 'Đánh giá TB']
            ];
            
            additionalData.topSTIPackages.slice(0, 10).forEach((packageItem, index) => {
                packagesData.push([
                    (index + 1).toString(),
                    packageItem.packageName || 'N/A',
                    formatCurrency(packageItem.totalPrice || 0),
                    formatNumber(packageItem.bookingCount || 0),
                    `${(packageItem.avgRating || 0).toFixed(1)}/5`
                ]);
            });
            
            pdf.autoTable({
                startY: y,
                head: [packagesData[0]],
                body: packagesData.slice(1),
                theme: 'grid',
                headStyles: { 
                    fillColor: [236, 72, 153], 
                    textColor: 255, 
                    fontStyle: 'bold', 
                    fontSize: 10, 
                    font: 'Roboto' 
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 6, 
                    font: 'Roboto' 
                }
            });
            
            y = pdf.lastAutoTable.finalY + 30;
        }
        
        // 6. REVENUE ANALYSIS (if available)
        if (additionalData.revenueData && additionalData.revenueData.length > 0) {
            pdf.setFontSize(16);
            pdf.setFont('Roboto', 'bold');
            safeText(pdf, '6. PHÂN TÍCH DOANH THU THEO THỜI GIAN', margin, y);
            y += 25;
            
            const revenueData = [
                ['Thời gian', 'Doanh thu', 'Số giao dịch', 'Trung bình/giao dịch']
            ];
            
            additionalData.revenueData.forEach(item => {
                const avgPerTransaction = item.transactions > 0 ? item.revenue / item.transactions : 0;
                revenueData.push([
                    item.period || 'N/A',
                    formatCurrency(item.revenue || 0),
                    formatNumber(item.transactions || 0),
                    formatCurrency(avgPerTransaction)
                ]);
            });
            
            pdf.autoTable({
                startY: y,
                head: [revenueData[0]],
                body: revenueData.slice(1),
                theme: 'grid',
                headStyles: { 
                    fillColor: [239, 68, 68], 
                    textColor: 255, 
                    fontStyle: 'bold', 
                    fontSize: 10, 
                    font: 'Roboto' 
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 6, 
                    font: 'Roboto' 
                }
            });
            
            y = pdf.lastAutoTable.finalY + 30;
        }
        
        // 7. REVENUE DISTRIBUTION (if available)
        if (additionalData.revenueDistribution && additionalData.revenueDistribution.length > 0) {
            pdf.setFontSize(16);
            pdf.setFont('Roboto', 'bold');
            safeText(pdf, '7. PHÂN BỔ DOANH THU THEO DỊCH VỤ', margin, y);
            y += 25;
            
            const distributionData = [
                ['Loại dịch vụ', 'Doanh thu', 'Tỷ lệ %']
            ];
            
            additionalData.revenueDistribution.forEach(item => {
                const percentage = item.percentage || 0;
                distributionData.push([
                    item.name || 'N/A',
                    formatCurrency(item.revenue || 0),
                    `${percentage.toFixed(1)}%`
                ]);
            });
            
            pdf.autoTable({
                startY: y,
                head: [distributionData[0]],
                body: distributionData.slice(1),
                theme: 'grid',
                headStyles: { 
                    fillColor: [34, 197, 94], 
                    textColor: 255, 
                    fontStyle: 'bold', 
                    fontSize: 10, 
                    font: 'Roboto' 
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 6, 
                    font: 'Roboto' 
                }
            });
            
            y = pdf.lastAutoTable.finalY + 30;
        }
        
        // 8. SUMMARY AND RECOMMENDATIONS
        pdf.setFontSize(16);
        pdf.setFont('Roboto', 'bold');
        safeText(pdf, '8. TÓM TẮT VÀ KHUYẾN NGHỊ', margin, y);
        y += 25;
        
        pdf.setFontSize(11);
        pdf.setFont('Roboto', 'normal');
        
        const summary = [
            `• Tổng doanh thu: ${formatCurrency(stats.totalRevenue)}`,
            `• Tỷ lệ tăng trưởng doanh thu: ${formatPercentage(stats.revenueGrowthRate)}`,
            `• Tỷ lệ giữ chân khách hàng: ${formatPercentage(stats.customerRetentionRate)}`,
            `• Giá trị đơn hàng trung bình: ${formatCurrency(stats.averageOrderValue)}`,
            '',
            'KHUYẾN NGHỊ:',
            `• ${stats.revenueGrowthRate >= 0 ? 'Duy trì' : 'Cải thiện'} chiến lược marketing để tăng doanh thu`,
            `• ${stats.customerRetentionRate >= 70 ? 'Tuyệt vời' : 'Cần cải thiện'} dịch vụ khách hàng để tăng tỷ lệ giữ chân`,
            `• ${stats.averageOrderValue >= 500000 ? 'Tốt' : 'Cần tối ưu'} chiến lược giá để tăng giá trị đơn hàng`,
            `• Tập trung vào ${stats.totalConsultations > stats.totalSTITests ? 'dịch vụ xét nghiệm STI' : 'dịch vụ tư vấn'} để tăng doanh thu`
        ];
        
        summary.forEach(line => {
            if (line.trim()) {
                safeTextWithFont(pdf, line, margin, y, 11, 'normal');
                y += 18;
            } else {
                y += 10;
            }
        });
        
        // Footer - đảm bảo không bị đè lên nội dung
        const pageHeight = pdf.internal.pageSize.height;
        const footerY = Math.max(y + 40, pageHeight - 80); // Đảm bảo footer cách nội dung ít nhất 40pt
        
        pdf.setFontSize(10);
        pdf.setFont('Roboto', 'italic');
        safeTextWithFont(pdf, 'Báo cáo được tạo tự động bởi hệ thống HealApp', margin, footerY, 10, 'italic');
        safeTextWithFont(pdf, 'Để biết thêm thông tin chi tiết, vui lòng liên hệ admin@healapp.com', margin, footerY + 15, 10, 'italic');
        
        pdf.save(`HealApp_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
        console.error('PDF Export Error:', e);
        alert('Có lỗi khi xuất PDF!');
    }
};

// ==== EXPORT STI RESULT PDF ====
export const exportSTIResultToPDF = async (data) => {
    try {
        const { results, customerInfo, testInfo } = data;
        const pdf = new jsPDF({ unit: 'pt', orientation: 'portrait', format: 'a4' });
        
        // Load Roboto font
        await addRobotoFonts(pdf);
        
        let y = 40;
        pdf.setFontSize(20);
        pdf.text('KẾT QUẢ XÉT NGHIỆM STI', 40, y);
        y += 30;
        pdf.setFontSize(12);
        pdf.text(`Báo cáo được tạo: ${new Date().toLocaleString('vi-VN')}`, 40, y);
        y += 30;
        pdf.setFontSize(14);
        pdf.text('THÔNG TIN KHÁCH HÀNG', 40, y);
        y += 20;
        
        const customerData = [
            ['Họ tên', customerInfo.name],
            ['Email', customerInfo.email],
            ['Số điện thoại', customerInfo.phone],
            ['Mã khách hàng', customerInfo.id]
        ];
        
        pdf.autoTable({
            startY: y,
            head: [['Thông tin', 'Chi tiết']],
            body: customerData,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 8, font: 'Roboto' },
            headStyles: { font: 'Roboto' }
        });
        
        y = pdf.lastAutoTable.finalY + 20;
        pdf.setFontSize(14);
        pdf.text('THÔNG TIN XÉT NGHIỆM', 40, y);
        y += 20;
        
        const testData = [
            ['Mã xét nghiệm', testInfo.id],
            ['Tên dịch vụ', testInfo.serviceName],
            ['Mô tả', testInfo.serviceDescription],
            ['Ngày hẹn', formatDateTime(testInfo.appointmentDate)],
            ['Ngày có kết quả', formatDateTime(testInfo.resultDate)],
            ['Nhân viên thực hiện', testInfo.staffName]
        ];
        
        pdf.autoTable({
            startY: y,
            head: [['Thông tin', 'Chi tiết']],
            body: testData,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 8, font: 'Roboto' },
            headStyles: { font: 'Roboto' }
        });
        
        y = pdf.lastAutoTable.finalY + 20;
        pdf.setFontSize(14);
        pdf.text('KẾT QUẢ CHI TIẾT', 40, y);
        y += 20;
        
        const resultTable = [
            ['Thành phần', 'Kết quả', 'Khoảng bình thường', 'Đơn vị'],
            ...results.map(r => [r.componentName || r.testName, r.resultValue, r.normalRange, r.unit])
        ];
        
        pdf.autoTable({
            startY: y,
            head: [resultTable[0]],
            body: resultTable.slice(1),
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 8, font: 'Roboto' },
            headStyles: { font: 'Roboto' }
        });
        
        pdf.save(`HealApp_STI_Result_${testInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
        console.error('PDF Export Error:', e);
        alert('Có lỗi khi xuất PDF!');
    }
};

// ==== EXPORT EXCEL ====
export const exportToExcel = (stats, additionalData = {}) => {
    try {
        const wb = XLSX.utils.book_new();
        
        // 1. Overview Statistics Sheet
        const overviewData = [
            ['BÁO CÁO DASHBOARD HEALAPP'],
            [`Báo cáo được tạo: ${new Date().toLocaleString('vi-VN')}`],
            [''],
            ['1. THỐNG KÊ TỔNG QUAN'],
            ['Chỉ số', 'Giá trị', 'Mô tả'],
            ['Tổng người dùng', stats.totalUsers, 'Tổng số tài khoản đăng ký'],
            ['Tư vấn viên', stats.totalConsultants, 'Số lượng tư vấn viên hoạt động'],
            ['Khách hàng', stats.totalUsers - stats.totalConsultants, 'Số lượng khách hàng sử dụng dịch vụ'],
            ['Tổng buổi tư vấn', stats.totalConsultations, 'Tổng số buổi tư vấn đã thực hiện'],
            ['Xét nghiệm STI', stats.totalSTITests, 'Tổng số lượt xét nghiệm STI'],
            ['Tổng doanh thu', stats.totalRevenue, 'Tổng doanh thu từ trước đến nay']
        ];
        
        const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, overviewWs, 'Tổng quan');
        
        // 2. Business KPIs Sheet
        const kpiData = [
            ['2. CHỈ SỐ KINH DOANH QUAN TRỌNG (KPIs)'],
            ['Chỉ số', 'Giá trị', 'Ý nghĩa'],
            ['Giá trị đơn hàng TB', stats.averageOrderValue, 'Trung bình giá trị mỗi giao dịch'],
            ['Doanh thu/Người dùng', stats.revenuePerUser, 'Doanh thu trung bình trên mỗi người dùng'],
            ['Tỷ lệ giữ chân KH', stats.customerRetentionRate, 'Tỷ lệ khách hàng quay lại sử dụng dịch vụ'],
            ['Tăng trưởng doanh thu', stats.revenueGrowthRate, 'Tỷ lệ tăng trưởng so với tháng trước'],
            ['Tăng trưởng người dùng', stats.userGrowthRate, 'Tỷ lệ tăng trưởng người dùng mới'],
            ['Tăng trưởng đơn hàng', stats.orderGrowthRate, 'Tỷ lệ tăng trưởng số lượng giao dịch']
        ];
        
        const kpiWs = XLSX.utils.aoa_to_sheet(kpiData);
        XLSX.utils.book_append_sheet(wb, kpiWs, 'KPIs');
        
        // 3. Top Consultants Sheet (if available)
        if (additionalData.topConsultants && additionalData.topConsultants.length > 0) {
            const consultantsData = [
                ['3. TOP TƯ VẤN VIÊN HOẠT ĐỘNG TỐT NHẤT'],
                ['STT', 'Tên tư vấn viên', 'Email', 'Số buổi tư vấn', 'Đánh giá TB']
            ];
            
            additionalData.topConsultants.forEach((consultant, index) => {
                consultantsData.push([
                    index + 1,
                    consultant.fullName || 'N/A',
                    consultant.email || 'N/A',
                    consultant.bookingCount || 0,
                    consultant.avgRating || 0
                ]);
            });
            
            const consultantsWs = XLSX.utils.aoa_to_sheet(consultantsData);
            XLSX.utils.book_append_sheet(wb, consultantsWs, 'Top Consultants');
        }
        
        // 4. Top STI Services Sheet (if available)
        if (additionalData.topSTIServices && additionalData.topSTIServices.length > 0) {
            const servicesData = [
                ['4. TOP DỊCH VỤ XÉT NGHIỆM STI PHỔ BIẾN'],
                ['STT', 'Tên dịch vụ', 'Giá', 'Số lượt sử dụng', 'Đánh giá TB']
            ];
            
            additionalData.topSTIServices.forEach((service, index) => {
                servicesData.push([
                    index + 1,
                    service.serviceName || 'N/A',
                    service.price || 0,
                    service.bookingCount || 0,
                    service.avgRating || 0
                ]);
            });
            
            const servicesWs = XLSX.utils.aoa_to_sheet(servicesData);
            XLSX.utils.book_append_sheet(wb, servicesWs, 'Top STI Services');
        }
        
        // 5. Top STI Packages Sheet (if available)
        if (additionalData.topSTIPackages && additionalData.topSTIPackages.length > 0) {
            const packagesData = [
                ['5. TOP GÓI XÉT NGHIỆM STI PHỔ BIẾN'],
                ['STT', 'Tên gói', 'Giá', 'Số lượt sử dụng', 'Đánh giá TB']
            ];
            
            additionalData.topSTIPackages.forEach((packageItem, index) => {
                packagesData.push([
                    index + 1,
                    packageItem.packageName || 'N/A',
                    packageItem.totalPrice || 0,
                    packageItem.bookingCount || 0,
                    packageItem.avgRating || 0
                ]);
            });
            
            const packagesWs = XLSX.utils.aoa_to_sheet(packagesData);
            XLSX.utils.book_append_sheet(wb, packagesWs, 'Top STI Packages');
        }
        
        // 6. Revenue Analysis Sheet (if available)
        if (additionalData.revenueData && additionalData.revenueData.length > 0) {
            const revenueData = [
                ['6. PHÂN TÍCH DOANH THU THEO THỜI GIAN'],
                ['Thời gian', 'Doanh thu', 'Số giao dịch', 'Trung bình/giao dịch']
            ];
            
            additionalData.revenueData.forEach(item => {
                const avgPerTransaction = item.transactions > 0 ? item.revenue / item.transactions : 0;
                revenueData.push([
                    item.period || 'N/A',
                    item.revenue || 0,
                    item.transactions || 0,
                    avgPerTransaction
                ]);
            });
            
            const revenueWs = XLSX.utils.aoa_to_sheet(revenueData);
            XLSX.utils.book_append_sheet(wb, revenueWs, 'Phân tích doanh thu');
        }
        
        // 7. Revenue Distribution Sheet (if available)
        if (additionalData.revenueDistribution && additionalData.revenueDistribution.length > 0) {
            const distributionData = [
                ['7. PHÂN BỔ DOANH THU THEO DỊCH VỤ'],
                ['Loại dịch vụ', 'Doanh thu', 'Tỷ lệ %']
            ];
            
            additionalData.revenueDistribution.forEach(item => {
                const percentage = item.percentage || 0;
                distributionData.push([
                    item.name || 'N/A',
                    item.revenue || 0,
                    percentage
                ]);
            });
            
            const distributionWs = XLSX.utils.aoa_to_sheet(distributionData);
            XLSX.utils.book_append_sheet(wb, distributionWs, 'Phân bổ doanh thu');
        }
        
        // 8. Summary Sheet
        const summaryData = [
            ['8. TÓM TẮT VÀ KHUYẾN NGHỊ'],
            [''],
            ['TÓM TẮT:'],
            ['Tổng doanh thu', stats.totalRevenue],
            ['Tỷ lệ tăng trưởng doanh thu', `${stats.revenueGrowthRate}%`],
            ['Tỷ lệ giữ chân khách hàng', `${stats.customerRetentionRate}%`],
            ['Giá trị đơn hàng trung bình', stats.averageOrderValue],
            [''],
            ['KHUYẾN NGHỊ:'],
            [stats.revenueGrowthRate >= 0 ? 'Duy trì' : 'Cải thiện', 'chiến lược marketing để tăng doanh thu'],
            [stats.customerRetentionRate >= 70 ? 'Tuyệt vời' : 'Cần cải thiện', 'dịch vụ khách hàng để tăng tỷ lệ giữ chân'],
            [stats.averageOrderValue >= 500000 ? 'Tốt' : 'Cần tối ưu', 'chiến lược giá để tăng giá trị đơn hàng'],
            [stats.totalConsultations > stats.totalSTITests ? 'Tập trung vào dịch vụ xét nghiệm STI' : 'Tập trung vào dịch vụ tư vấn', 'để tăng doanh thu']
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Tóm tắt');
        
        XLSX.writeFile(wb, `HealApp_Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
        console.error('Excel Export Error:', e);
        alert('Có lỗi khi xuất Excel!');
    }
};

export const exportSTIResultToExcel = (data) => {
    try {
        const { results, customerInfo, testInfo } = data;
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['Họ tên', customerInfo.name],
            ['Email', customerInfo.email],
            ['Số điện thoại', customerInfo.phone],
            ['Mã khách hàng', customerInfo.id],
            [],
            ['Mã xét nghiệm', testInfo.id],
            ['Tên dịch vụ', testInfo.serviceName],
            ['Mô tả', testInfo.serviceDescription],
            ['Ngày hẹn', formatDateTime(testInfo.appointmentDate)],
            ['Ngày có kết quả', formatDateTime(testInfo.resultDate)],
            ['Nhân viên thực hiện', testInfo.staffName],
            [],
            ['Thành phần', 'Kết quả', 'Khoảng bình thường', 'Đơn vị'],
            ...results.map(r => [r.componentName || r.testName, r.resultValue, r.normalRange, r.unit])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Kết quả xét nghiệm');
        XLSX.writeFile(wb, `HealApp_STI_Result_${testInfo.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
        alert('Có lỗi khi xuất Excel!');
    }
};
