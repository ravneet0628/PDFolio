import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import LoadingSpinner from '../components/LoadingSpinner';
import FileUploader from '../components/FileUploader';
import { splitPDF } from '../utils/splitPDF';
import ThumbnailsGrid from '../components/ThumbnailsGrid';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;


export default function Split() {
  const [file, setFile] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [thumbnails, setThumbnails] = useState([])
  const [selectedPages, setSelectedPages] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const handleFilesSelected = (files) => {
    if (files.length > 0) {
      const pdfFile = files[0]
      setFile(pdfFile)
      setSelectedPages([])
      renderThumbnails(pdfFile)
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
      link.download = `pages-${range[0]}-${range[1]}.pdf`;
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
      link.download = 'split.pdf'
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
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Split PDF</h1>
      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
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

          <div className="relative w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 px-8 py-8 mt-6 bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
              {thumbnails.map((src, idx) => {
                const pageNum = idx + 1;
                const isSelected = selectedPages.includes(pageNum);
                // Determine if a split bar should be shown after this page
                const showSplitBar = selectedPages.includes(pageNum);
                return (
                  <div key={idx} className="relative flex flex-col items-center">
                    <div
                      onClick={() => togglePage(pageNum)}
                      className={`cursor-pointer rounded-lg border-4 overflow-hidden transition w-full
                        ${isSelected
                          ? 'border-cyan-700 dark:border-cyan-400'
                          : 'border-transparent hover:border-cyan-600 dark:hover:border-cyan-400'}
                      `}
                    >
                      <img src={src} alt={`Page ${pageNum}`} className="w-full bg-white dark:bg-gray-900" />
                      <p className="text-center text-gray-700 dark:text-gray-200 mt-2">
                        Page {pageNum}
                      </p>
                    </div>
                    {/* Split bar indicator */}
                    {showSplitBar && idx !== thumbnails.length - 1 && (
                      <div className="w-full flex justify-center -mb-2">
                        <div className="h-6 w-1 bg-cyan-500 dark:bg-cyan-400 rounded-full shadow-lg animate-pulse flex items-center justify-center relative z-10">
                          <span className="absolute -left-6 text-xs text-cyan-700 dark:text-cyan-300 font-bold select-none">Split</span>
                          <svg className="w-4 h-4 absolute -right-5 top-1/2 -translate-y-1/2 text-cyan-700 dark:text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l-6 6m0 0l6 6m-6-6h18" /></svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-split download buttons */}
          {selectedPages.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-8 justify-center">
              {getSplitRanges().map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDownloadRange(range)}
                  className="bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow"
                >
                  {`Download Pages ${range[0]}-${range[1]}`}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
