import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import LoadingSpinner from "../components/LoadingSpinner";
import { PDFDocument } from "pdf-lib";
import ThumbnailsGrid from "../components/ThumbnailsGrid";
import FileUploader from "../components/FileUploader";
import Button from "../components/Button";
import { getOutputFileName } from '../utils/outputFilename';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function Duplicate() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [duplicateCounts, setDuplicateCounts] = useState({}); // pageNum: count

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      const pdfFile = files[0];
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

  const handleDuplicateCountChange = (pageNum, value) => {
    setDuplicateCounts((prev) => ({
      ...prev,
      [pageNum]: Math.max(1, parseInt(value) || 1),
    }));
  };

  const handleDuplicateCountInc = (pageNum) => {
    setDuplicateCounts((prev) => ({
      ...prev,
      [pageNum]: (prev[pageNum] || 1) + 1,
    }));
  };

  const handleDuplicateCountDec = (pageNum) => {
    setDuplicateCounts((prev) => ({
      ...prev,
      [pageNum]: Math.max(1, (prev[pageNum] || 1) - 1),
    }));
  };

  const handleDuplicatePages = async () => {
    if (!file || selectedPages.length === 0) {
      alert("Please select pages to duplicate!");
      return;
    }
    setIsWorking(true);
    const arrayBuffer = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();
    const totalPages = originalPdf.getPageCount();
    // Build a map of pageNum to duplicate count (default 1 if selected, else 0)
    const pageDupMap = {};
    for (let i = 1; i <= totalPages; i++) {
      if (selectedPages.includes(i)) {
        pageDupMap[i] = duplicateCounts[i] || 1;
      }
    }
    // Insert pages, duplicating after each selected page
    let i = 0;
    while (i < totalPages) {
      const [copiedPage] = await newPdf.copyPages(originalPdf, [i]);
      newPdf.addPage(copiedPage);
      const pageNum = i + 1;
      if (pageDupMap[pageNum]) {
        for (let d = 0; d < pageDupMap[pageNum]; d++) {
          const [dupPage] = await newPdf.copyPages(originalPdf, [i]);
          newPdf.addPage(dupPage);
        }
      }
      i++;
    }
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getOutputFileName(file?.name, 'duplicated');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
    setShowUploader(true);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Duplicate PDF Pages</h1>

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
            renderPageFooter={(pageNum) =>
              selectedPages.includes(pageNum) ? (
                <div className="flex items-center gap-1 mt-1">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="px-2 py-1 text-lg font-bold"
                    onClick={e => { e.stopPropagation(); handleDuplicateCountDec(pageNum); }}
                    tabIndex={-1}
                  >
                    -
                  </Button>
                  <input
                    type="number"
                    min={1}
                    value={duplicateCounts[pageNum] || 1}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleDuplicateCountChange(pageNum, e.target.value)}
                    className="w-12 text-center rounded bg-gray-900 text-white border border-gray-600 text-sm py-1 appearance-none hide-number-arrows"
                    style={{ margin: 0 }}
                    title="Number of duplicates"
                  />
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    className="px-2 py-1 text-lg font-bold"
                    onClick={e => { e.stopPropagation(); handleDuplicateCountInc(pageNum); }}
                    tabIndex={-1}
                  >
                    +
                  </Button>
                </div>
              ) : null
            }
          />

          {/* Duplicate Button */}
          <Button
            onClick={handleDuplicatePages}
            className="mt-8"
            variant="primary"
            size="lg"
            disabled={selectedPages.length === 0 || isWorking}
          >
            {isWorking ? 'Duplicating...' : 'Duplicate Selected Pages'}
          </Button>
        </>
      )}
    </div>
  );
}

export default Duplicate;
