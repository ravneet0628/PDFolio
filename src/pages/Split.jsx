import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import LoadingSpinner from '../components/LoadingSpinner';
import FileUploader from '../components/FileUploader';
import { useToasts } from '../components/ToastManager';
import { analyzeFileUpload } from '../utils/fileProcessing';
import { splitPDF } from '../utils/splitPDF';
import ThumbnailsGrid from '../components/ThumbnailsGrid';
import Button from "../components/Button";
import GlobalDropZone from '../components/GlobalDropZone';
import { getOutputFileName } from '../utils/outputFilename';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;


export default function Split() {
  const [file, setFile] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [thumbnails, setThumbnails] = useState([])
  const [selectedPages, setSelectedPages] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const { addToast, ToastContainer } = useToasts();

  const handleFilesSelected = (files) => {
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
  }

  const renderThumbnails = async (pdfFile) => {
    try {
      setIsLoading(true);
      setThumbnails([]);
      setPageCount(0);
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);
      const thumbs = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        thumbs.push(canvas.toDataURL());
      }
      setThumbnails(thumbs);
      setIsLoading(false);
      setShowUploader(false);
    } catch (err) {
      setIsLoading(false);
      setShowUploader(true);
      setFile(null);
      setThumbnails([]);
      setPageCount(0);
      alert('Failed to load PDF. Please try another file.');
      console.error('Error rendering thumbnails:', err);
    }
  }

  const togglePage = (num) => {
    setSelectedPages((old) =>
      old.includes(num) ? old.filter((p) => p !== num) : [...old, num]
    )
  }

  // Helper: get split ranges from selectedPages
  const getSplitRanges = () => {
    if (!pageCount) return [];
    const sorted = [...selectedPages].sort((a, b) => a - b);
    const breaks = [0, ...sorted, pageCount];
    const ranges = [];
    for (let i = 1; i < breaks.length; i++) {
      if (breaks[i - 1] + 1 <= breaks[i]) {
        ranges.push([breaks[i - 1] + 1, breaks[i]]);
      }
    }
    return ranges;
  };

  // Multi-split download handler
  const handleDownloadRange = async (range) => {
    setIsWorking(true);
    try {
      // Use a fresh ArrayBuffer for each library
      const arrayBuffer1 = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer1 }).promise;
      const arrayBuffer2 = await file.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      const srcPdf = await PDFDocument.load(arrayBuffer2);
      const newPdf = await PDFDocument.create();
      const indices = [];
      for (let i = range[0]; i <= range[1]; i++) indices.push(i - 1);
      const copiedPages = await newPdf.copyPages(srcPdf, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = getOutputFileName(file?.name, 'split', `${range[0]}-${range[1]}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to split and download.');
      console.error(err);
    }
    setIsWorking(false);
  };

  const handleSplit = async () => {
    if (!file || selectedPages.length === 0) {
      return alert('Please select at least one page to split.')
    }
    setIsWorking(true);
    try {
      const blob = await splitPDF(file, selectedPages)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = getOutputFileName(file?.name, 'split');
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error(err)
      alert('Failed to split PDF.')
    }
    setIsWorking(false);
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Split PDF</h1>
      
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
      {isWorking && (
        <div className="mt-8 w-full max-w-md animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded overflow-hidden">
            <div className="h-4 bg-green-600 dark:bg-green-400 animate-pulse w-full"></div>
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-1">Splitting PDF...</p>
        </div>
      )}
      {file && !isLoading && !isWorking && (
        <>
          <p className="mt-6 text-gray-700 dark:text-gray-300">
            Click thumbnails below to select split points:
          </p>

          <ThumbnailsGrid
            thumbnails={thumbnails}
            splitPoints={selectedPages}
            onPageClick={togglePage}
            allowSplitSelection={true}
          />

          {/* Multi-split download buttons */}
          {selectedPages.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-8 justify-center">
              {getSplitRanges().map((range, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleDownloadRange(range)}
                  variant="primary"
                  size="md"
                  className="shadow"
                >
                  {`Download Pages ${range[0]}-${range[1]}`}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}
