import { useState } from 'react';

function FileUploader({ onFilesSelected, accept= "application/pdf", showFileList = false, showUI = true }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    onFilesSelected(files);
  };

  const isImage = accept.startsWith('image/');
  const icon = isImage ? '🖼️' : '📄';

  const readableAccept = (accept) => {
    if (accept === 'application/pdf') return 'PDF';
    if (accept.startsWith('image/')) return 'Images';
    return accept;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {showUI && (
      <label className="flex flex-col items-center shadow-md justify-center w-full h-48 p-4 text-gray-950 bg-gray-200/50 dark:text-gray-400 dark:bg-gray-800 rounded-lg cursor-pointer hover:shadow-gray-400/50 hover:text-blue-400">
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-center">
          Click to upload<br />
          <span className="text-sm text-gray-500">(Only {readableAccept(accept)} allowed)</span>
        </p>
      </label>
      )}

      {/* Show uploaded file names */}
      {showFileList && selectedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 inset-shadow-sm dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-200">Selected Files</h3>
         
        {selectedFiles.length === 0 ? (
          <p className="mt-2 text-gray-950 dark:text-gray-200">No files selected.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {selectedFiles.map((file, idx) => (
              <li key={idx} className="text-gray-800 dark:text-gray-300 truncate">
                {icon} {file.name} ({(file.size / 1024).toFixed  (
                2)} KB)
              </li>
            ))}
          </ul>
        )}
        </div>
      )}
      
    </div>
  );
}

export default FileUploader;
