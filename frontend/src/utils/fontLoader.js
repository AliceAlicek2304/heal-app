/**
 * Font loader for Vietnamese text support in PDF exports
 */
import { addRobotoFonts, testVietnameseText } from './fonts';

/**
 * Load Roboto font for PDF
 */
export const loadRobotoFont = async (pdf) => {
    try {
        // Set up fonts and test Vietnamese support
        const vietnameseSupported = await addRobotoFonts(pdf);
        
        console.log('Vietnamese text support:', vietnameseSupported);
        return vietnameseSupported;
    } catch (error) {
        console.warn('Failed to load fonts:', error);
        // Fallback to default font
        pdf.setFont('helvetica');
        return false;
    }
};

/**
 * Safe Vietnamese text function
 */
export const safeVietnameseText = (pdf, text, x, y, options = {}) => {
    if (!text) return;
    
    try {
        // Try Vietnamese text first
        pdf.text(text, x, y, options);
    } catch (error) {
        console.warn('Vietnamese text failed, using ASCII fallback:', error);
        // Fallback to ASCII
        const asciiText = text.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
            .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
            .replace(/[ìíịỉĩ]/g, 'i')
            .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
            .replace(/[ùúụủũưừứựửữ]/g, 'u')
            .replace(/[ỳýỵỷỹ]/g, 'y')
            .replace(/đ/g, 'd');
        pdf.text(asciiText, x, y, options);
    }
}; 