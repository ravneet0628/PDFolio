import { useState } from "react";
import FileUploader from "../components/FileUploader";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import ThumbnailsGrid from "../components/ThumbnailsGrid";
import { PDFDocument, rgb } from "pdf-lib";

function PageScaling() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [scalePercent, setScalePercent] = useState(100);
  const [nUp, setNUp] = useState(1); // 1 = normal, 2 = 2-up, 4 = 4-up

  // Render thumbnails for preview
  const renderThumbnails = async (pdfFile) => {
    setIsLoading(true);
    setThumbnails([]);
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    const pdfjsWorkerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
  };

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setShowUploader(false);
      await renderThumbnails(files[0]);
    }
  };

  // PDF scaling and n-up logic
  const handleDownload = async () => {
    if (!file) return;
    setIsWorking(true);
    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    let newPdf;
    if (nUp === 1) {
      // Simple scaling
      newPdf = await PDFDocument.create();
      for (let i = 0; i < srcPdf.getPageCount(); i++) {
        const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
        const page = copiedPage;
        const scale = scalePercent / 100;
        const { width, height } = page.getSize();
        page.setSize(width * scale, height * scale);
        newPdf.addPage(page);
      }
    } else {
      // n-up layout (2 or 4 per sheet)
      newPdf = await PDFDocument.create();
      const totalPages = srcPdf.getPageCount();
      const perSheet = nUp;
      for (let i = 0; i < totalPages; i += perSheet) {
        // Use size of first page as base
        const srcPage = srcPdf.getPage(i);
        const { width, height } = srcPage.getSize();
        let newWidth, newHeight, positions;
        if (nUp === 2) {
          newWidth = width;
          newHeight = height * 2;
          positions = [
            { x: 0, y: height },
            { x: 0, y: 0 },
          ];
        } else {
          // 4-up
          newWidth = width * 2;
          newHeight = height * 2;
          positions = [
            { x: 0, y: height },
            { x: width, y: height },
            { x: 0, y: 0 },
            { x: width, y: 0 },
          ];
        }
        const sheet = newPdf.addPage([newWidth, newHeight]);
        for (let j = 0; j < perSheet && i + j < totalPages; j++) {
          const srcPage = srcPdf.getPage(i + j);
          const embedded = await newPdf.embedPage(srcPage);
          sheet.drawPage(embedded, {
            x: positions[j].x,
            y: positions[j].y,
            width: width,
            height: height,
          });
        }
      }
    }
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nUp === 1 ? `scaled.pdf` : `${nUp}-up.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
    setShowUploader(true);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">PDF Page Scaling & Layout</h1>
      {showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}
      {isLoading && (
        <div className="mt-8">
          <LoadingSpinner message="Loading PDF..." />
        </div>
      )}
      {file && !isLoading && (
        <>
          <div className="flex flex-wrap gap-4 mt-6 justify-center">
            <label className="flex items-center gap-2">
              <span className="font-medium">Scale:</span>
              <input
                type="number"
                min={10}
                max={400}
                value={scalePercent}
                onChange={e => setScalePercent(Math.max(10, Math.min(400, Number(e.target.value))))}
                className="w-20 px-2 py-1 rounded border border-gray-300 dark:bg-gray-800 dark:text-gray-100"
              />
              <span>%</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="font-medium">Pages per sheet:</span>
              <select
                value={nUp}
                onChange={e => setNUp(Number(e.target.value))}
                className="px-2 py-1 rounded border border-gray-300 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value={1}>1 (Normal)</option>
                <option value={2}>2-up</option>
                <option value={4}>4-up</option>
              </select>
            </label>
          </div>
          <ThumbnailsGrid
            thumbnails={thumbnails}
          />
          <Button
            onClick={handleDownload}
            variant="success"
            size="lg"
            className="mt-8"
            disabled={isWorking}
          >
            {isWorking ? (nUp === 1 ? 'Scaling...' : 'Creating Layout...') : (nUp === 1 ? 'Download Scaled PDF' : `Download ${nUp}-up PDF`)}
          </Button>
        </>
      )}
    </div>
  );
}

export default PageScaling;
