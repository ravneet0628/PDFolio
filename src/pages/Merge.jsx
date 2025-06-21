import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToasts } from '../components/ToastManager';
import { analyzeFileUpload } from '../utils/fileProcessing';
import { mergePDFs } from '../utils/mergePDF';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import Button from "../components/Button";
import SortableThumbnailsGrid from '../components/SortableThumbnailsGrid';
import GlobalDropZone from '../components/GlobalDropZone';
import { getOutputFileName } from '../utils/outputFilename';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function Merge() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const { addToast, ToastContainer } = useToasts();

  const handleFilesSelected = async (uploadedFiles) => {
    setIsLoading(true);
    
    // Analyze uploaded files with comprehensive edge case handling
    const analysis = analyzeFileUpload(
      uploadedFiles, 
      'application/pdf', 
      files.map(f => f.file),
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
    
    const startIndex = files.length; // For unique IDs when adding more files
    const filesWithThumbnails = await Promise.all(
      analysis.validFiles.map(async (file, index) => ({
        id: `${startIndex + index}-${file.name}`,
        file,
        name: file.name,
        thumbnail: await renderThumbnail(file),
      }))
    );
    
    // Append to existing files
    const updatedFiles = [...files, ...filesWithThumbnails];
    
    setFiles(updatedFiles);
    setIsLoading(false);
    setShowGrid(true);
    // Keep uploader visible for adding more files
  };

  const renderThumbnail = async (file) => {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL();
  };

  const handleOrderChange = (newOrder) => {
    setFiles(newOrder);
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsWorking(true);
    const fileList = files.map((f) => f.file);
    const mergedBlob = await mergePDFs(fileList);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(mergedBlob);
    link.download = getOutputFileName(files[0]?.name, 'merged');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
    setFiles([]);
    setShowGrid(false);
    setShowUploader(true);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <GlobalDropZone 
        onFilesDropped={handleFilesSelected} 
        accept="application/pdf"
        enabled={!isLoading && !isWorking}
      />
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Merge PDFs</h1>
      
      {files.length === 0 ? (
        // Initial upload - show full FileUploader
        !isLoading && showUploader && (
          <FileUploader 
            onFilesSelected={handleFilesSelected} 
            multiple 
          />
        )
      ) : (
        // Files already added - show compact add more section
        <div className="w-full max-w-md text-center mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Drag & drop more PDFs anywhere on this page to add them
          </p>
          <Button
            onClick={() => document.querySelector('input[type="file"]')?.click()}
            variant="secondary"
            size="sm"
            className="text-sm"
          >
            📁 Browse for more PDFs
          </Button>
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={(e) => handleFilesSelected(Array.from(e.target.files))}
            className="hidden"
          />
        </div>
      )}
      {isLoading && files.length === 0 && (
        <div className="mt-8">
          <LoadingSpinner message="Processing PDF files..." />
        </div>
      )}
      {files.length > 0 && showGrid && (
        <>
          <div className="w-full max-w-4xl">
            <SortableThumbnailsGrid
              items={files}
              onOrderChange={handleOrderChange}
              getThumb={item => item.thumbnail}
              getId={item => item.id}
              getFilename={item => item.name}
            />
          </div>
          
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleMerge}
              disabled={isLoading || isWorking}
              variant="primary"
              size="lg"
              className="shadow"
            >
              {isWorking ? 'Merging...' : 'Merge PDFs'}
            </Button>
          </div>
        </>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default Merge;
