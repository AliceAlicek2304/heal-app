/**
 * Utility functions for text formatting
 */

/**
 * Convert line breaks (\n) to HTML <br> tags
 * @param {string} text - The text to convert
 * @returns {string} - Text with line breaks converted to <br> tags
 */
export const convertLineBreaksToHTML = (text) => {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
};

/**
 * Convert HTML <br> tags back to line breaks (\n)
 * @param {string} html - The HTML to convert
 * @returns {string} - HTML with <br> tags converted to line breaks
 */
export const convertHTMLToLineBreaks = (html) => {
    if (!html) return '';
    return html.replace(/<br\s*\/?>/gi, '\n');
};

/**
 * Preserve line breaks when displaying text
 * @param {string} text - The text to format
 * @returns {string} - Text formatted for display
 */
export const formatTextForDisplay = (text) => {
    if (!text) return '';
    return convertLineBreaksToHTML(text);
};

/**
 * Clean text for storage (remove extra spaces, normalize line breaks)
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
export const cleanTextForStorage = (text) => {
    if (!text) return '';
    return text
        .replace(/\r\n/g, '\n') // Convert Windows line breaks
        .replace(/\r/g, '\n')   // Convert Mac line breaks
        .trim();
};
