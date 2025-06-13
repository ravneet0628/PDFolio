import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

function FileUploader({ onFilesSelected, isLoading = false, showFileList = false }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    onFilesSelected(files); // pass files to parent (Merge.jsx)
  };

  // Show loading state if processing
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center w-full h-48 p-4 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg">
          <LoadingSpinner message="Processing files..." />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <label className="flex flex-col items-center justify-center w-full h-48 p-4 text-gray-400 bg-gray-800 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:text-blue-400">
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-center">
          Click to upload<br />
          <span className="text-sm text-gray-500">(Only PDFs allowed)</span>
        </p>
      </label>

      {/* Show uploaded file names */}
      {showFileList && selectedFiles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selectedFiles.map((file, idx) => (
            <li key={idx} className="text-gray-300 truncate">
              📄 {file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileUploader;
