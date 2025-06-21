import { useState, useEffect } from 'react';
import Toast from './Toast';

function ToastManager({ toasts, onRemoveToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration || 4000}
          onClose={() => onRemoveToast(toast.id)}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index
          }}
        />
      ))}
    </div>
  );
}

// Hook for managing multiple toasts
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Advanced toast methods for complex scenarios
  const addFileProcessingToasts = (results) => {
    const { validFiles, invalidFiles, duplicateFiles, totalFiles } = results;
    
    // Success toast for valid files
    if (validFiles > 0) {
      addToast(
        `${validFiles} file${validFiles > 1 ? 's' : ''} added successfully`,
        'success',
        3000
      );
    }
    
    // Warning for invalid files
    if (invalidFiles > 0) {
      addToast(
        `${invalidFiles} file${invalidFiles > 1 ? 's' : ''} filtered out (invalid type)`,
        'warning',
        4000
      );
    }
    
    // Info for duplicates
    if (duplicateFiles > 0) {
      addToast(
        `${duplicateFiles} duplicate file${duplicateFiles > 1 ? 's' : ''} skipped`,
        'info',
        3500
      );
    }
    
    // Error if no files processed
    if (validFiles === 0 && totalFiles > 0) {
      addToast(
        'No valid files could be processed',
        'error',
        5000
      );
    }
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    addFileProcessingToasts,
    ToastContainer: () => <ToastManager toasts={toasts} onRemoveToast={removeToast} />
  };
}

export default ToastManager; 