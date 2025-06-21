import { useState } from "react";
import FileUploader from "../components/FileUploader";
import { PDFDocument } from "pdf-lib";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToasts } from '../components/ToastManager';
import { analyzeFileUpload } from '../utils/fileProcessing';
import Button from "../components/Button";
import SortableThumbnailsGrid from '../components/SortableThumbnailsGrid';
import GlobalDropZone from '../components/GlobalDropZone';
import { getOutputFileName } from '../utils/outputFilename';

function JpgToPdf() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // for file/image loading
  const [isWorking, setIsWorking] = useState(false); // for PDF generation
  const [showUploader, setShowUploader] = useState(true);
  const [error, setError] = useState("");
  const { addToast, ToastContainer } = useToasts();

  const handleFilesSelected = (newFiles) => {
    setIsLoading(true);
    setError("");
    
    // Analyze uploaded files with comprehensive edge case handling
    const analysis = analyzeFileUpload(
      Array.from(newFiles),
      'image/jpeg,image/png',
      files,
      { allowDuplicates: false }
    );
    
    // Show appropriate toasts based on analysis
    analysis.info.forEach(message => addToast(message, 'success', 3000));
    analysis.warnings.forEach(message => addToast(message, 'warning', 4000));
    analysis.errors.forEach(message => addToast(message, 'error', 5000));
    
    if (analysis.validFiles.length === 0) {
      setIsLoading(false);
      return;
    }
    
    // Append to existing files
    const updatedFiles = [...files, ...analysis.validFiles];
    
    setFiles(updatedFiles);
    setIsLoading(false);
    if (files.length === 0) {
      setShowUploader(false);
    }
  };

  const handleOrderChange = (newOrder) => {
    setFiles(newOrder);
  };

  const deleteFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.name !== id));
  };

  const generatePdf = async () => {
    if (files.length === 0) return;
    setIsWorking(true);
    setError("");
    const pdfDoc = await PDFDocument.create();
    for (const file of files) {
      const imageBytes = await file.arrayBuffer();
      let image;
      if (file.type.includes("png")) {
        image = await pdfDoc.embedPng(imageBytes);
      } else if (file.type.includes("jpeg") || file.type.includes("jpg")) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else {
        setError(`File ${file.name} is not a supported image type.`);
        continue;
      }
      const dims = image.scale(1);
      const page = pdfDoc.addPage([dims.width, dims.height]);
      page.drawImage(image, { x: 0, y: 0, width: dims.width, height: dims.height });
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getOutputFileName(files[0]?.name, 'converted');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <GlobalDropZone 
        onFilesDropped={handleFilesSelected} 
        accept="image/jpeg,image/png"
        enabled={!isLoading && !isWorking}
      />
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">JPG to PDF</h1>
      
      {files.length === 0 ? (
        // Initial upload - show full FileUploader
        showUploader && (
          <FileUploader 
            onFilesSelected={handleFilesSelected} 
            multiple 
            accept="image/jpeg,image/png"
          />
        )
      ) : (
        // Files already added - show compact add more section
        <div className="w-full max-w-md text-center mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Drag & drop more images anywhere on this page to add them
          </p>
          <Button
            onClick={() => document.querySelector('input[type="file"]')?.click()}
            variant="secondary"
            size="sm"
            className="text-sm"
          >
            🖼️ Browse for more images
          </Button>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={(e) => handleFilesSelected(Array.from(e.target.files))}
            className="hidden"
          />
        </div>
      )}
      {error && (
        <div className="w-full max-w-md mt-4 text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded p-3 text-center">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="w-full max-w-md mt-6">
          <LoadingSpinner message="Loading images..." />
        </div>
      )}
      {isWorking && (
        <div className="w-full max-w-md mt-6">
          <LoadingSpinner message="Generating PDF..." />
        </div>
      )}
      {files.length > 0 && !isLoading && !isWorking && (
        <>
          <div className="w-full max-w-4xl">
            <SortableThumbnailsGrid
              items={files}
              onOrderChange={handleOrderChange}
              onDelete={deleteFile}
              getThumb={file => URL.createObjectURL(file)}
              getId={file => file.name}
              getFilename={file => file.name}
            />
          </div>
          
          <div className="flex justify-center mt-8">
            <Button
              onClick={generatePdf}
              disabled={isWorking}
              variant="primary"
              size="lg"
              className="shadow"
            >
              {isWorking ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default JpgToPdf;
