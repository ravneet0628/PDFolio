import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import LoadingSpinner from "../components/LoadingSpinner";
import { PDFDocument } from "pdf-lib";
import ThumbnailsGrid from "../components/ThumbnailsGrid";
import FileUploader from "../components/FileUploader";
import { deletePagesFromPDF } from "../utils/deletePages";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function Delete() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      const pdfFile = files[0];
      setFile(pdfFile);
      setSelectedPages([]);
      setDownloadUrl(null);
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

  const handleDeletePages = async () => {
    if (!file || selectedPages.length === 0) {
      alert("Please select pages to delete!");
      return;
    }
    setIsWorking(true);
    const arrayBuffer = await file.arrayBuffer();
    const newPdfBytes = await deletePagesFromPDF(arrayBuffer, selectedPages);
    const blob = new Blob([newPdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "deleted-pages.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
    setShowUploader(true);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Delete PDF Pages</h1>

      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
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
            <button
              onClick={selectAllPages}
              className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Select All
            </button>
            <button
              onClick={deselectAllPages}
              className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Deselect All
            </button>
            <button
              onClick={selectOddPages}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Select Odd
            </button>
            <button
              onClick={selectEvenPages}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Select Even
            </button>
          </div>

          <ThumbnailsGrid
            thumbnails={thumbnails}
            selectedPages={selectedPages}
            onPageClick={togglePageSelection}
            allowSelection={true}
          />

          {/* Delete Button */}
          <button
            onClick={handleDeletePages}
            className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
            disabled={selectedPages.length === 0 || isWorking}
          >
            {isWorking ? 'Deleting...' : 'Delete Selected Pages'}
          </button>
        </>
      )}
    </div>
  );
}

export default Delete;
