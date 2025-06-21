import { useState, useEffect } from 'react';

function GlobalDropZone({ onFilesDropped, accept = "application/pdf", enabled = true }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const handleDragEnter = (e) => {
      e.preventDefault();
      setDragCounter(prev => prev + 1);
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setDragCounter(prev => prev - 1);
      if (dragCounter <= 1) {
        setIsDragOver(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      setDragCounter(0);
      
      const files = Array.from(e.dataTransfer.files);
      
      // Filter files based on accept type
      const validFiles = files.filter(file => {
        if (accept === 'application/pdf') {
          return file.type === 'application/pdf';
        }
        if (accept.startsWith('image/')) {
          return file.type.startsWith('image/');
        }
        return true;
      });
      
      if (validFiles.length > 0) {
        onFilesDropped(validFiles);
      }
    };

    // Add event listeners to the document
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [enabled, accept, onFilesDropped, dragCounter]);

  if (!enabled || !isDragOver) return null;

  const readableAccept = (accept) => {
    if (accept === 'application/pdf') return 'PDF files';
    if (accept.startsWith('image/')) return 'Image files';
    return 'files';
  };

  return (
    <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-4 border-dashed border-blue-500 max-w-md mx-4 text-center animate-pulse">
        <div className="text-6xl mb-4">📤</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Drop {readableAccept(accept)} here
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Release to upload your files
        </p>
      </div>
    </div>
  );
}

export default GlobalDropZone; 