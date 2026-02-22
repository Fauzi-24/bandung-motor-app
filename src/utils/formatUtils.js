/**
 * Formats a number logically for IDR currency display.
 * @param {number|string} num - The number to format.
 * @returns {string} - Formatted string (e.g., "1.000.000")
 */
export const formatIDR = (num) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Handles price input changes to ensure only numbers are allowed.
 * @param {string} value - The raw input value.
 * @returns {string} - Cleaned numeric string.
 */
export const cleanNumericValue = (value) => {
    return value.replace(/\./g, '').replace(/[^\d]/g, '');
};

/**
 * Standard date formatter for Indonesian locale.
 * @param {Date|string} date - Date object or ISO string.
 * @returns {string} - Formatted date string.
 */
export const formatDateIndo = (date) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
