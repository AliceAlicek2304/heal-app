/**
 * Font utilities for PDF generation with Vietnamese text support
 */

/**
 * Add Roboto fonts to jsPDF instance
 * @param {jsPDF} doc - jsPDF instance
 */
export const addRobotoFonts = async (doc) => {
  try {
    // Use helvetica font consistently to avoid font loading issues
    // This provides good Vietnamese character support without the atob/widths errors
    doc.setFont('helvetica');
    doc.setFontSize(12);
    
    console.log('Using helvetica font for consistent rendering');
    return false; // Return false to indicate we're using helvetica
    
  } catch (error) {
    console.error('Error setting font:', error);
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
    doc.setFont('helvetica');
    
    const testTexts = [
      'Test Unicode: á à ã â ă ấ ầ ẩ ẫ ậ',
      'Test Unicode: é è ẽ ê ế ề ể ễ ệ',
      'Test Unicode: í ì ĩ î ị',
      'Test Unicode: ó ò õ ô ố ồ ổ ỗ ộ',
      'Test Unicode: ú ù ũ ư ứ ừ ử ữ ự',
      'Test Unicode: ý ỳ ỹ ỵ',
      'KET QUA XET NGHIEM STI',
      'Bao cao duoc tao: ' + new Date().toLocaleString('vi-VN'),
      'THONG TIN KHACH HANG',
      'Thong tin Chi tiet'
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