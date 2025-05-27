/**
 * Validates an Aadhaar number
 * @param {string} aadhaar - The Aadhaar number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateAadhaar = (aadhaar) => {
  // Remove any spaces or special characters
  const cleanAadhaar = aadhaar.replace(/[^0-9]/g, '');

  // Check if it's exactly 12 digits
  if (cleanAadhaar.length !== 12) {
    return false;
  }

  // Implement Verhoeff algorithm for Aadhaar checksum validation
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];

  let c = 0;
  const digits = cleanAadhaar.split('').map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }

  return c === 0;
};

/**
 * Validates an Indian mobile number
 * @param {string} mobile - The mobile number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidMobile = (mobile) => {
  // Remove any spaces or special characters
  const cleanMobile = mobile.replace(/[^0-9]/g, '');

  // Check if it's exactly 10 digits and starts with 6-9
  return /^[6-9]\d{9}$/.test(cleanMobile);
};

export {
  validateAadhaar,
  isValidMobile
}; 