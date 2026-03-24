const Tesseract = require('tesseract.js');

/**
 * OCR Service for extracting text from Aadhar card images
 */
class OCRService {
  constructor() {
    this.worker = null;
  }

  /**
   * Initialize Tesseract worker
   */
  async initializeWorker() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng');
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      });
    }
    return this.worker;
  }

  /**
   * Extract Aadhar number from image
   * @param {string} imageUrl - Cloudinary image URL
   * @returns {Promise<string|null>} - Extracted Aadhar number or null
   */
  async extractAadharNumber(imageUrl) {
    try {
      const worker = await this.initializeWorker();
      
      // Perform OCR on the image
      const { data: { text } } = await worker.recognize(imageUrl);
      
      // Extract Aadhar number using regex
      const aadharNumber = this.extractAadharFromText(text);
      
      return aadharNumber;
    } catch (error) {
      console.error('OCR Error:', error);
      return null;
    }
  }

  /**
   * Extract Aadhar number from OCR text
   * @param {string} text - OCR extracted text
   * @returns {string|null} - Aadhar number or null
   */
  extractAadharFromText(text) {
    // Aadhar number pattern: 12 digits, first digit should be 2-9
    const aadharRegex = /[2-9]\d{11}/g;
    const matches = text.match(aadharRegex);
    
    if (matches && matches.length > 0) {
      // Return the first valid Aadhar number found
      return matches[0];
    }
    
    // Alternative pattern: look for 12 consecutive digits
    const digitRegex = /\d{12}/g;
    const digitMatches = text.match(digitRegex);
    
    if (digitMatches && digitMatches.length > 0) {
      // Check if it starts with 2-9
      for (const match of digitMatches) {
        if (match[0] >= '2' && match[0] <= '9') {
          return match;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract PAN number from image
   * @param {string} imageUrl - Cloudinary image URL
   * @returns {Promise<string|null>} - Extracted PAN number or null
   */
  async extractPANNumber(imageUrl) {
    try {
      const worker = await this.initializeWorker();
      
      // Perform OCR on the image
      const { data: { text } } = await worker.recognize(imageUrl);
      
      // Extract PAN number using regex
      const panNumber = this.extractPANFromText(text);
      
      return panNumber;
    } catch (error) {
      console.error('OCR Error:', error);
      return null;
    }
  }

  /**
   * Extract PAN number from OCR text
   * @param {string} text - OCR extracted text
   * @returns {string|null} - PAN number or null
   */
  extractPANFromText(text) {
    // PAN number pattern: 5 letters + 4 digits + 1 letter
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
    const matches = text.match(panRegex);
    
    if (matches && matches.length > 0) {
      return matches[0];
    }
    
    return null;
  }

  /**
   * Extract name from Aadhar card
   * @param {string} imageUrl - Cloudinary image URL
   * @returns {Promise<string|null>} - Extracted name or null
   */
  async extractNameFromAadhar(imageUrl) {
    try {
      const worker = await this.initializeWorker();
      
      // Perform OCR on the image
      const { data: { text } } = await worker.recognize(imageUrl);
      
      // Extract name (this is more complex and may need refinement)
      const name = this.extractNameFromText(text);
      
      return name;
    } catch (error) {
      console.error('OCR Error:', error);
      return null;
    }
  }

  /**
   * Extract name from OCR text
   * @param {string} text - OCR extracted text
   * @returns {string|null} - Name or null
   */
  extractNameFromText(text) {
    // Look for patterns that might be names
    // This is a simplified approach and may need refinement
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip lines that are too short or contain numbers
      if (trimmedLine.length < 3 || /\d/.test(trimmedLine)) {
        continue;
      }
      
      // Look for lines that might be names (contain letters and spaces)
      if (/^[A-Za-z\s]+$/.test(trimmedLine) && trimmedLine.length > 5) {
        return trimmedLine;
      }
    }
    
    return null;
  }

  /**
   * Terminate the worker
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Create and export singleton instance
const ocrService = new OCRService();

module.exports = ocrService;
