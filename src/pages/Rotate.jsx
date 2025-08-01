import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToasts } from '../components/ToastManager';
import { analyzeFileUpload } from '../utils/fileProcessing';
import { PDFDocument, degrees } from "pdf-lib";
import { getOutputFileName } from '../utils/outputFilename';

import FileUploader from "../components/FileUploader";
import GlobalDropZone from '../components/GlobalDropZone';
import Button from "../components/Button";
import ThumbnailsGrid from "../components/ThumbnailsGrid";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function Rotate() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [pageRotations, setPageRotations] = useState({}); // only user-applied rotations
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [isWorking, setIsWorking] = useState(false); // Add loading state
  const [showuploader, setShowUploader] = useState(true);
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
      setPageRotations({});
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

  const applyRotation = (direction) => {
    if (selectedPages.length === 0) {
      alert("Please select pages first.");
      return;
    }

    setPageRotations((prev) => {
      const updated = { ...prev };
      selectedPages.forEach((pageNum) => {
        const current = updated[pageNum] || 0;
        updated[pageNum] =
          direction === "clockwise"
            ? (current + 90) % 360
            : (current + 270) % 360;
      });
      return updated;
    });
  };

  const handleDownloadRotatedPDF = async () => {
    if (!file) return;

    setIsWorking(true);

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);
      const pageNum = i + 1;
      if (pageRotations[pageNum]) {
        const existingRotation = page.getRotation().angle;
        const totalRotation = (existingRotation + pageRotations[pageNum]) % 360;
        page.setRotation(degrees(totalRotation));
      }
    }

    const rotatedPdfBytes = await pdfDoc.save();
    const blob = new Blob([rotatedPdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getOutputFileName(file?.name, 'rotated');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false)
    setShowUploader(true);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Rotate PDFs</h1>

      {/* Global Drop Zone */}
      <GlobalDropZone 
        onFilesDropped={handleFilesSelected}
        acceptedTypes="application/pdf"
      />

      {!isLoading && showuploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}
      
      {!showuploader && file && !isLoading && (
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
      
      {/* Show loading spinner when processing thumbnails */}
      {isLoading && !thumbnails.length && (
        <div className="mt-8">
          <LoadingSpinner message="Loading PDF pages..." />
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
            <Button
              onClick={() => applyRotation("counterclockwise")}
              variant="primary"
              size="md"
            >
              ↺ Rotate Left
            </Button>
            <Button
              onClick={() => applyRotation("clockwise")}
              variant="primary"
              size="md"
            >
              ↻ Rotate Right
            </Button>
          </div>

          {/* ThumbnailsGrid */}
          <ThumbnailsGrid
            thumbnails={thumbnails.map((thumb, idx) => ({
              src: thumb,
              rotation: pageRotations[idx + 1] || 0,
            }))}
            selectedPages={selectedPages}
            onPageClick={togglePageSelection}
            allowSelection={true}
          />

          {/* Download Button */}
          <Button
            onClick={handleDownloadRotatedPDF}
            variant="success"
            size="lg"
            className="mt-8"
            disabled={isWorking}
          >
            {isWorking ? 'Creating Rotated Pdf' : 'Download Rotated PDF'}
          </Button>
        </>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default Rotate;
