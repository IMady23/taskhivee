/**
 * Utility functions for handling files via localStorage
 */

// Helper to check if a URL is actually a localStorage key
export const isLocalAttachment = (url) => {
  return url && url.startsWith('local_file_');
};

// Convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Handle clicking on an attachment link
export const downloadAttachment = (e, url, fileName) => {
  if (isLocalAttachment(url)) {
    e.preventDefault(); // Prevent normal navigation
    const base64Data = localStorage.getItem(url);
    if (!base64Data) {
      console.error('File not found in localStorage:', url);
      alert('File not found on this device. It may have been uploaded from another browser or device.');
      return;
    }
    
    // Create an invisible anchor element to trigger the download
    const a = document.createElement('a');
    a.href = base64Data;
    a.download = fileName || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  // If it's a regular HTTP URL, let the browser handle it naturally by not calling preventDefault (or handling differently if needed)
};
