import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToasts } from '../components/ToastManager';
import { analyzeFileUpload } from '../utils/fileProcessing';
import { PDFDocument } from "pdf-lib";
import ThumbnailsGrid from "../components/ThumbnailsGrid";
import FileUploader from "../components/FileUploader";
import GlobalDropZone from '../components/GlobalDropZone';
import Button from "../components/Button";
import { getOutputFileName } from '../utils/outputFilename';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function Extract() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
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
      const pdfFile = analysis.validFiles[0];
      setFile(pdfFile);
      setSelectedPages([]);
      renderThumbnails(pdfFile);
    }
  };

  const renderThumbnails = async (pdfFile) => {
    setIsLoading(true);
    setThumbnails([]);
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    setPageCount(pdf.numPages);
    const thumbs = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      thumbs.push(canvas.toDataURL());
    }
    setThumbnails(thumbs);
    setIsLoading(false);
    setShowUploader(false);
  };

  const togglePageSelection = (pageNum) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum]
    );
  };

  const selectAllPages = () => {
    setSelectedPages(Array.from({ length: pageCount }, (_, idx) => idx + 1));
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  const selectOddPages = () => {
    setSelectedPages(
      Array.from({ length: pageCount }, (_, idx) => idx + 1).filter((num) => num % 2 === 1)
    );
  };

  const selectEvenPages = () => {
    setSelectedPages(
      Array.from({ length: pageCount }, (_, idx) => idx + 1).filter((num) => num % 2 === 0)
    );
  };

  const handleDownloadExtractedPDF = async () => {
    if (!file || selectedPages.length === 0) {
      alert("Please select pages to extract!");
      return;
    }

    setIsWorking(true);

    const arrayBuffer = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    // Always sort pages to maintain order
    const sortedPages = [...selectedPages].sort((a, b) => a - b);

    for (const pageNum of sortedPages) {
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);
      newPdf.addPage(copiedPage);
    }

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getOutputFileName(file?.name, 'extracted');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false)
    setShowUploader(true);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Extract PDF Pages</h1>

      {/* Global Drop Zone */}
      <GlobalDropZone 
        onFilesDropped={handleFilesSelected}
        acceptedTypes="application/pdf"
      />

      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}
      
      {!showUploader && file && !isLoading && (
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

      {isLoading && (
        <div className="mt-8">
          <LoadingSpinner message="Loading PDF..." />
        </div>
      )}


      {file && !isLoading && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            <Button
              onClick={selectAllPages}
              variant="info"
              size="md"
            >
              Select All
            </Button>
            <Button
              onClick={deselectAllPages}
              variant="danger"
              size="md"
            >
              Deselect All
            </Button>
            <Button
              onClick={selectOddPages}
              variant="neutral"
              size="md"
            >
              Select Odd
            </Button>
            <Button
              onClick={selectEvenPages}
              variant="neutral"
              size="md"
            >
              Select Even
            </Button>
          </div>

          <ThumbnailsGrid
            thumbnails={thumbnails}
            selectedPages={selectedPages}
            onPageClick={togglePageSelection}
            allowSelection={true}
            />

          {/* Download Button */}
          <Button
            onClick={handleDownloadExtractedPDF}
            variant="success"
            size="lg"
            className="mt-8"
            disabled={isWorking}
          >
            {isWorking ? 'Extracting...' : 'Download Extracted PDF'}
          </Button>
        </>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default Extract;
