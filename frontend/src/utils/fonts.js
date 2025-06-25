/**
 * Font utilities for PDF generation with Vietnamese text support
 */

/**
 * Add Roboto fonts to jsPDF instance
 * @param {jsPDF} doc - jsPDF instance
 */
export const addRobotoFonts = async (doc) => {
  try {
    // Load Roboto font from TTF file
    const fontPath = '/fonts/Roboto-VariableFont_wdth,wght.ttf';
    
    // Add font to jsPDF
    doc.addFont(fontPath, 'Roboto', 'normal');
    doc.addFont(fontPath, 'Roboto', 'bold');
    
    // Set as default font
    doc.setFont('Roboto');
    
    console.log('Roboto fonts loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading Roboto fonts:', error);
    // Fallback to default font
    doc.setFont('helvetica');
    return false;
  }
};

/**
 * Test Vietnamese text rendering
 * @param {jsPDF} doc - jsPDF instance
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {boolean} silent - If true, don't actually draw text
 */
export const testVietnameseText = (doc, x = 20, y = 20, silent = false) => {
  try {
    doc.setFontSize(12);
    
    const testTexts = [
      'Test Unicode: á à ã â ă ấ ầ ẩ ẫ ậ',
      'Test Unicode: é è ẽ ê ế ề ể ễ ệ',
      'Test Unicode: í ì ĩ î ị',
      'Test Unicode: ó ò õ ô ố ồ ổ ỗ ộ',
      'Test Unicode: ú ù ũ ư ứ ừ ử ữ ự',
      'Test Unicode: ý ỳ ỹ ỵ',
      'KẾT QUẢ XÉT NGHIỆM STI',
      'Báo cáo được tạo: ' + new Date().toLocaleString('vi-VN'),
      'THÔNG TIN KHÁCH HÀNG',
      'Thông tin Chi tiết'
    ];
    
    if (!silent) {
      testTexts.forEach((text, index) => {
        doc.text(text, x, y + (index * 10));
      });
    }
    
    console.log('Vietnamese text test completed');
    return true;
  } catch (error) {
    console.error('Error testing Vietnamese text:', error);
    return false;
  }
}; 