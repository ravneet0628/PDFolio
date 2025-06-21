import { useState } from "react";
import FileUploader from "../components/FileUploader";
import { useToasts } from '../components/ToastManager';
import { analyzeFileUpload } from '../utils/fileProcessing';
import { PDFDocument } from "pdf-lib";
import LoadingSpinner from "../components/LoadingSpinner";
import GlobalDropZone from '../components/GlobalDropZone';
import Button from "../components/Button";

function Compress() {
  const [file, setFile] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDownloadbutton, setShowDownloadbutton] = useState(false);
  const [showUI, setshowUI] = useState(true);
  const [showFileList, setShowFileList] = useState(false);
  const { addToast, ToastContainer } = useToasts();

  const handleFilesSelected = async (files) => {
    // Analyze uploaded files
    const analysis = analyzeFileUpload(
      files,
      'application/pdf',
      file ? [file] : [],
      { singleFileMode: true }
    );

    // Show appropriate toasts
    analysis.info.forEach(message => addToast(message, 'success', 3000));
    analysis.warnings.forEach(message => addToast(message, 'warning', 4000));
    analysis.errors.forEach(message => addToast(message, 'error', 5000));

    if (analysis.validFiles.length > 0) {
      setFile(analysis.validFiles[0]);
      setshowUI(false);
      setShowDownloadbutton(true);
      setShowFileList(true);
    }
  };

  const compressPDF = async () => {
    if (!file) return;
    setIsWorking(true);
    setProgress(0);

    const originalBytes = await file.arrayBuffer();
    const originalPdfDoc = await PDFDocument.load(originalBytes);
    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(originalPdfDoc, originalPdfDoc.getPageIndices());

    copiedPages.forEach((page) => newPdfDoc.addPage(page));
    setProgress(100);

    const compressedPdfBytes = await newPdfDoc.save();
    const blob = new Blob([compressedPdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "compressed.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsWorking(false);
    setShowDownloadbutton(false);
    setshowUI(true);
    setShowFileList(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Compress PDF</h1>
      
      {/* Global Drop Zone */}
      <GlobalDropZone 
        onFilesDropped={handleFilesSelected}
        acceptedTypes="application/pdf"
      />
      
      {!isWorking && (
        <FileUploader onFilesSelected={handleFilesSelected} showFileList={showFileList} showUI={showUI}/>
      )}
      
      {!showUI && file && !isWorking && (
        <div className="w-full max-w-4xl mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag & drop a new PDF anywhere on this page to replace current file
            </p>
            <Button
              onClick={() => document.querySelector('input[type="file"]')?.click()}
              variant="secondary"
              size="sm"
            >
              Browse Files
            </Button>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
              className="hidden"
            />
          </div>
        </div>
      )}

      {isWorking && (
        <div className="w-full max-w-md mt-6">
          <LoadingSpinner message="Compressing..." />
        </div>
      )}

      {showDownloadbutton && (
      <Button
        onClick={compressPDF}
        disabled={isWorking || !file}
        variant="success"
        size="lg"
        className="mt-8"
      >
        Download Compressed PDF
      </Button>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default Compress;
