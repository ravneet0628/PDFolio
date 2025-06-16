import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import LoadingSpinner from '../components/LoadingSpinner';
import FileUploader from '../components/FileUploader';
import { splitPDF } from '../utils/splitPDF';

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
            Click thumbnails below to select pages:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 px-8 py-8 mt-6 bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
            {thumbnails.map((src, idx) => {
              const pageNum = idx + 1
              const isSelected = selectedPages.includes(pageNum)
              return (
                <div
                  key={idx}
                  onClick={() => togglePage(pageNum)}
                  className={`cursor-pointer rounded-lg border-4 overflow-hidden transition
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
              )
            })}
          </div>

          {selectedPages.length > 0 && (
            <button
              onClick={handleSplit}
              className="mt-8 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              Split Selected Pages
            </button>
          )}
        </>
      )}
    </div>
  )
}
