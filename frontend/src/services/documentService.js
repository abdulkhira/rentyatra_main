import apiService from './api';

class DocumentService {
  // Upload Aadhar card images
  async uploadAadharCard(aadharNumber, frontImage, backImage) {
    try {
      const response = await apiService.uploadAadharCard(aadharNumber, frontImage, backImage);
      return response;
    } catch (error) {
      console.error('Aadhar upload error:', error);
      throw error;
    }
  }

  // Upload PAN card images
  async uploadPANCard(panNumber, frontImage, backImage) {
    try {
      const response = await apiService.uploadPANCard(panNumber, frontImage, backImage);
      return response;
    } catch (error) {
      console.error('PAN upload error:', error);
      throw error;
    }
  }

  // Upload profile image
  async uploadProfileImage(image) {
    try {
      const response = await apiService.uploadProfileImage(image);
      return response;
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  }

  // Get document verification status
  async getDocumentStatus() {
    try {
      const response = await apiService.getDocumentStatus();
      return response;
    } catch (error) {
      console.error('Get document status error:', error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(type) {
    try {
      const response = await apiService.deleteDocument(type);
      return response;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  // Validate Aadhar number
  validateAadharNumber(aadharNumber) {
    const aadharRegex = /^[2-9]{1}[0-9]{11}$/;
    return aadharRegex.test(aadharNumber);
  }

  // Validate PAN number
  validatePANNumber(panNumber) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(panNumber);
  }

  // Validate file size (max 5MB)
  validateFileSize(file, maxSizeMB = 5) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  // Validate file type (images only)
  validateFileType(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
  }

  // Create image preview
  createImagePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Compress image before upload
  async compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Create and export singleton instance
const documentService = new DocumentService();
export default documentService;
