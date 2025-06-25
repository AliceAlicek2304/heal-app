import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
        // Try original text first
        pdf.text(text, x, y, options);
    } catch (error) {
        console.warn('Text rendering failed, using ASCII fallback:', error);
        // Fallback to ASCII
        const asciiText = vietnameseToASCII(text);
        pdf.text(asciiText, x, y, options);
    }
};

// ==== EXPORT DASHBOARD PDF ====
export const exportToPDF = async (stats) => {
    try {
        const pdf = new jsPDF({ unit: 'pt', orientation: 'portrait', format: 'a4' });
        
        // Load Roboto font
        await addRobotoFonts(pdf);
        
        let y = 40;
        pdf.setFontSize(20);
        pdf.text('BÁO CÁO DASHBOARD HEALAPP', 40, y);
        y += 30;
        pdf.setFontSize(12);
        pdf.text(`Báo cáo được tạo: ${new Date().toLocaleString('vi-VN')}`, 40, y);
        y += 20;
        pdf.text('Báo cáo tổng quan hiệu suất kinh doanh', 40, y);
        y += 20;
        
        // Table
        const overviewData = [
            ['Chỉ số', 'Giá trị'],
            ['Tổng người dùng', stats.totalUsers],
            ['Tư vấn viên', stats.totalConsultants],
            ['Khách hàng', stats.totalUsers - stats.totalConsultants],
            ['Tổng buổi tư vấn', stats.totalConsultations],
            ['Xét nghiệm STI', stats.totalSTITests],
            ['Tổng doanh thu', stats.totalRevenue + ' VND']
        ];
        
        pdf.autoTable({
            startY: y + 20,
            head: [overviewData[0]],
            body: overviewData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 10, font: 'Roboto' },
            styles: { fontSize: 9, cellPadding: 8, font: 'Roboto' }
        });
        
        pdf.save(`HealApp_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
        console.error('PDF Export Error:', e);
        alert('Có lỗi khi xuất PDF!');
    }
};

// ==== EXPORT STI RESULT PDF ====
export const exportSTIResultToPDF = async (data) => {
    try {
        const { test, results, customerInfo, testInfo } = data;
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
export const exportToExcel = (stats) => {
    try {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['Chỉ số', 'Giá trị'],
            ['Tổng người dùng', stats.totalUsers],
            ['Tư vấn viên', stats.totalConsultants],
            ['Khách hàng', stats.totalUsers - stats.totalConsultants],
            ['Tổng buổi tư vấn', stats.totalConsultations],
            ['Xét nghiệm STI', stats.totalSTITests],
            ['Tổng doanh thu', stats.totalRevenue + ' VND']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
        XLSX.writeFile(wb, `HealApp_Dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
        alert('Có lỗi khi xuất Excel!');
    }
};

export const exportSTIResultToExcel = (data) => {
    try {
        const { test, results, customerInfo, testInfo } = data;
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
