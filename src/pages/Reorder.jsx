import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import LoadingSpinner from "../components/LoadingSpinner";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../components/FileUploader";
import Button from "../components/Button";
import SortableThumbnailsGrid from '../components/SortableThumbnailsGrid';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function Reorder() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      const pdfFile = files[0];
      setFile(pdfFile);
      await renderThumbnails(pdfFile);
    }
  };

  const renderThumbnails = async (pdfFile) => {
    setIsLoading(true);
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
      thumbs.push({ id: `page-${i}`, src: canvas.toDataURL(), pageNum: i });
    }
    setThumbnails(thumbs);
    setOrder(thumbs.map((thumb) => thumb.id));
    setIsLoading(false);
    setShowUploader(false);
  };

  const handleOrderChange = (newOrder) => {
    setOrder(newOrder.map(item => item.id));
    // Optionally, update thumbnails order if needed elsewhere
  };

  const handleDownloadReorderedPDF = async () => {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();
    for (const pageId of order) {
      const pageNum = parseInt(pageId.split("-")[1], 10);
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);
      newPdf.addPage(copiedPage);
    }
    setIsWorking(true);
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reordered.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
    setShowUploader(true);
  };

  // Get the thumbnails in the current order
  const orderedThumbs = order.map(id => thumbnails.find(t => t.id === id));

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Reorder PDF Pages</h1>
      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}
      {isLoading && !thumbnails.length && (
        <div className="mt-8">
          <LoadingSpinner message="Loading PDF pages..." />
        </div>
      )}
      {file && !isLoading && (
        <>
          <p className="mt-6 text-gray-700 dark:text-gray-300">Drag and drop to reorder pages:</p>
          <SortableThumbnailsGrid
            items={orderedThumbs}
            onOrderChange={handleOrderChange}
            getThumb={item => item.src}
            getId={item => item.id}
            getPageNum={item => item.pageNum}
          />
          <Button
            onClick={handleDownloadReorderedPDF}
            className="mt-8"
            variant="success"
            size="lg"
            disabled={isWorking}
          >
            {isWorking ? 'Creating Reordered Pdf' : 'Download Reordered PDF'}
          </Button>
        </>
      )}
    </div>
  );
}

export default Reorder;
