import { useState } from "react";
import FileUploader from "../components/FileUploader";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import ThumbnailsGrid from "../components/ThumbnailsGrid";
import { PDFDocument, rgb } from "pdf-lib";
import { getOutputFileName } from '../utils/outputFilename';

function PageScaling() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [scalePercent, setScalePercent] = useState('100');
  const [layout, setLayout] = useState('1x1'); // Default to 1x1 layout

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
    const { cols, rows } = layout;
    if (cols === 1 && rows === 1) {
      // Simple scaling
      newPdf = await PDFDocument.create();
      for (let i = 0; i < srcPdf.getPageCount(); i++) {
        const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
        const page = copiedPage;
        const scale = (parseInt(scalePercent, 10) || 100) / 100;
        const { width, height } = page.getSize();
        page.setSize(width * scale, height * scale);
        newPdf.addPage(page);
      }
    } else {
      // n-up layout
      newPdf = await PDFDocument.create();
      const totalPages = srcPdf.getPageCount();
      const perSheet = cols * rows;
      for (let i = 0; i < totalPages; i += perSheet) {
        // Use size of first page as base
        const srcPage = srcPdf.getPage(i);
        const { width, height } = srcPage.getSize();
        const newWidth = width * cols;
        const newHeight = height * rows;
        const sheet = newPdf.addPage([newWidth, newHeight]);
        for (let j = 0; j < perSheet && i + j < totalPages; j++) {
          const srcPage = srcPdf.getPage(i + j);
          const embedded = await newPdf.embedPage(srcPage);
          const col = j % cols;
          const row = Math.floor(j / cols);
          sheet.drawPage(embedded, {
            x: col * width,
            y: newHeight - (row + 1) * height,
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
    link.download = getOutputFileName(file?.name, layout.value);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
    setShowUploader(true);
  };

  // Visualization icons and layout options
  const layoutOptions = [
    {
      value: '1x1',
      label: '1x1 (Single)',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="20" rx="3" fill="#a3e635" stroke="#65a30d" strokeWidth="2"/></svg>
      ),
      cols: 1, rows: 1
    },
    {
      value: '2x1',
      label: '2x1 (Horizontal)',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32"><rect x="6" y="6" width="10" height="20" rx="2" fill="#a5b4fc" stroke="#6366f1" strokeWidth="2"/><rect x="16" y="6" width="10" height="20" rx="2" fill="#a5b4fc" stroke="#6366f1" strokeWidth="2"/></svg>
      ),
      cols: 2, rows: 1
    },
    {
      value: '1x2',
      label: '1x2 (Vertical)',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="10" rx="2" fill="#fca5a5" stroke="#dc2626" strokeWidth="2"/><rect x="6" y="16" width="20" height="10" rx="2" fill="#fca5a5" stroke="#dc2626" strokeWidth="2"/></svg>
      ),
      cols: 1, rows: 2
    },
    {
      value: '2x2',
      label: '2x2 (Grid)',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32"><rect x="6" y="6" width="10" height="10" rx="2" fill="#fcd34d" stroke="#ca8a04" strokeWidth="2"/><rect x="16" y="6" width="10" height="10" rx="2" fill="#fcd34d" stroke="#ca8a04" strokeWidth="2"/><rect x="6" y="16" width="10" height="10" rx="2" fill="#fcd34d" stroke="#ca8a04" strokeWidth="2"/><rect x="16" y="16" width="10" height="10" rx="2" fill="#fcd34d" stroke="#ca8a04" strokeWidth="2"/></svg>
      ),
      cols: 2, rows: 2
    },
  ];

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
                onChange={e => setScalePercent(e.target.value)}
                onBlur={e => {
                  let val = parseInt(e.target.value, 10);
                  if (isNaN(val)) val = 100;
                  val = Math.max(10, Math.min(400, val));
                  setScalePercent(String(val));
                }}
                className="w-20 px-2 py-1 rounded border border-gray-300 
                text-gray-900 disabled:text-gray-500 dark:text-gray-100 dark:disabled:text-gray-400
                dark:bg-gray-800 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                disabled={!(layout.cols === 1 && layout.rows === 1)}
              />
              <span>%</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="font-medium">Layout:</span>
              {layoutOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLayout(opt)}
                  className={`flex flex-col items-center px-2 py-1 rounded border-2 transition focus:outline-none ${layout.value === opt.value ? 'border-blue-600 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
                  aria-label={opt.label}
                >
                  {opt.icon}
                  <span className="text-xs mt-1 text-gray-700 dark:text-gray-200">{opt.label}</span>
                </button>
              ))}
            </div>
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
            {isWorking ? (layout.cols === 1 && layout.rows === 1 ? 'Scaling...' : 'Creating Layout...') : (layout.cols === 1 && layout.rows === 1 ? 'Download Scaled PDF' : `Download ${layout.value} PDF`)}
          </Button>
        </>
      )}
    </div>
  );
}

export default PageScaling;
