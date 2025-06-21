import { useState } from 'react';
import Toast from './Toast';

function FileUploader({ 
  onFilesSelected, 
  accept = "application/pdf", 
  multiple = false,
  showFileList = false, 
  showUI = true,
  allowAddMore = false, // For multiple file tools to add more files
  className = ""
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    if (files.length === 0) return;
    
    setSelectedFiles(files);
    onFilesSelected(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
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
    
    if (validFiles.length !== files.length) {
      const filteredCount = files.length - validFiles.length;
      setToast({
        message: `${filteredCount} file${filteredCount > 1 ? 's' : ''} filtered out (invalid type)`,
        type: 'warning'
      });
    }
    
    if (validFiles.length > 0) {
      setToast({
        message: `${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added successfully`,
        type: 'success'
      });
    }
    
    processFiles(validFiles);
  };

  const isImage = accept.startsWith('image/');
  const icon = isImage ? '🖼️' : '📄';

  const readableAccept = (accept) => {
    if (accept === 'application/pdf') return 'PDF files';
    if (accept.startsWith('image/')) return 'Image files';
    return accept;
  };

  const getUploadText = () => {
    if (multiple) {
      return allowAddMore ? 'Add more files' : 'Upload multiple files';
    }
    return 'Upload file';
  };

  const getSubText = () => {
    const fileType = readableAccept(accept);
    if (multiple) {
      return `Drop ${fileType} here or click to browse`;
    }
    return `Drop ${fileType} here or click to browse`;
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {showUI && (
        <div
          className={`
            relative flex flex-col items-center justify-center w-full h-48 p-6 
            text-gray-950 bg-gray-200/50 dark:text-gray-400 dark:bg-gray-800 
            rounded-lg cursor-pointer transition-all duration-200
            border-2 border-dashed 
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 scale-105' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            hover:shadow-lg hover:shadow-gray-400/30 dark:hover:shadow-gray-700/30
            ${allowAddMore ? 'border-green-300 dark:border-green-600' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
                     {/* Upload Icon */}
           <div className={`text-4xl mb-3 transition-transform duration-200 ${isDragOver ? 'scale-110 animate-bounce' : ''}`}>
             {isDragOver ? '📤' : (allowAddMore ? '➕' : '📁')}
           </div>
          
          {/* Main Text */}
          <p className="text-lg font-medium text-center mb-2">
            {isDragOver ? `Drop ${readableAccept(accept)} here` : getUploadText()}
          </p>
          
          {/* Sub Text */}
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {getSubText()}
          </p>
          
          {/* File Type Badge */}
          <div className="mt-3 px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded-full text-xs font-medium">
            {readableAccept(accept)} only
          </div>
          
          {/* Multiple Files Indicator */}
          {multiple && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Multiple
            </div>
          )}
          
          {/* Add More Indicator */}
          {allowAddMore && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Add More
            </div>
          )}
        </div>
      )}

      {/* Show uploaded file names */}
      {showFileList && selectedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 shadow-inner dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-200 mb-2">
            Selected Files ({selectedFiles.length})
          </h3>
         
          {selectedFiles.length === 0 ? (
            <p className="text-gray-950 dark:text-gray-200">No files selected.</p>
          ) : (
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, idx) => (
                <li key={idx} className="flex items-center text-gray-800 dark:text-gray-300 text-sm">
                  <span className="mr-2">{icon}</span>
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </li>
              ))}
            </ul>
                     )}
         </div>
       )}
       
       {/* Toast Notifications */}
       {toast && (
         <Toast
           message={toast.message}
           type={toast.type}
           onClose={() => setToast(null)}
         />
       )}
     </div>
   );
 }

export default FileUploader;
