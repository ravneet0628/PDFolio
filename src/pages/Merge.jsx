import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import { mergePDFs } from '../utils/mergePDF';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import Button from "../components/Button";
import SortableThumbnailsGrid from '../components/SortableThumbnailsGrid';
import { getOutputFileName } from '../utils/outputFilename';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function Merge() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  const handleFilesSelected = async (uploadedFiles) => {
    setIsLoading(true);
    const filesWithThumbnails = await Promise.all(
      uploadedFiles.map(async (file, index) => ({
        id: `${index}-${file.name}`,
        file,
        name: file.name,
        thumbnail: await renderThumbnail(file),
      }))
    );
    setFiles(filesWithThumbnails);
    setIsLoading(false);
    setShowUploader(false);
    setShowGrid(true);
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
    setShowUploader(true);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Merge PDFs</h1>
      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}
      {isLoading && files.length === 0 && (
        <div className="mt-8">
          <LoadingSpinner message="Processing PDF files..." />
        </div>
      )}
      {files.length > 0 && showGrid && (
        <>
          <p className="mt-6 text-gray-700 dark:text-gray-300">Drag PDFs to reorder:</p>
          <SortableThumbnailsGrid
            items={files}
            onOrderChange={handleOrderChange}
            getThumb={item => item.thumbnail}
            getId={item => item.id}
            getFilename={item => item.name}
          />
          <Button
            onClick={handleMerge}
            disabled={isLoading}
            variant="primary"
            size="lg"
            className="mt-8"
          >
            {isWorking ? 'Merging...' : 'Merge PDFs'}
          </Button>
        </>
      )}
    </div>
  );
}

export default Merge;
