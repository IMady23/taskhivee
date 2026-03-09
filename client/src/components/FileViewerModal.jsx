import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

/**
 * FileViewerModal - Modal to view submitted files
 * Handles Base64 data URLs properly
 */
export default function FileViewerModal({ isOpen, onClose, file }) {
  if (!isOpen || !file) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name || 'submission';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = file.type?.startsWith('image/') || file.url?.startsWith('data:image/');
  const isPDF = file.type === 'application/pdf' || file.url?.includes('application/pdf');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0b0f14] border border-[#1e293b] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#1e293b]">
            <div>
              <h3 className="text-xl font-bold text-white">{file.name || 'Submission'}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {file.size ? `${(file.size / 1024).toFixed(2)} KB` : ''} • {file.type || 'Unknown type'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 bg-[#151921]">
            {isImage ? (
              <div className="flex items-center justify-center min-h-full">
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : isPDF ? (
              <iframe
                src={file.url}
                className="w-full h-[70vh] rounded-lg border border-[#1e293b]"
                title={file.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                  <Download size={40} className="text-blue-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Preview Not Available</h4>
                <p className="text-gray-400 mb-6 max-w-md">
                  This file type cannot be previewed in the browser. Click the download button above to view it on your device.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                  <Download size={20} />
                  Download {file.name}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
