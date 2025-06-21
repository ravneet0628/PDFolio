import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToasts } from '../components/ToastManager';
import { analyzeFileUpload } from '../utils/fileProcessing';
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ThumbnailsGrid from "../components/ThumbnailsGrid";
import FileUploader from "../components/FileUploader";
import GlobalDropZone from '../components/GlobalDropZone';
import Button from "../components/Button";
import { getOutputFileName } from '../utils/outputFilename';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const positions = [
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Bottom Center", value: "bottom-center" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Top Center", value: "top-center" },
  { label: "Top Left", value: "top-left" },
];

const numberStyles = [
  { label: '1', value: 'plain' },
  { label: 'Page 1', value: 'page' },
  { label: 'Page no. 1', value: 'page-no' },
  { label: 'Page 1 of X', value: 'page-of-x' },
  { label: '1 / X', value: 'n-of-x' },
  { label: 'P. 1', value: 'p-dot' },
  { label: 'Pg 1', value: 'pg' },
  { label: 'Sheet 1', value: 'sheet' },
];

function PageNumbering() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const { addToast, ToastContainer } = useToasts();
  const [startNumber, setStartNumber] = useState(1);
  const [position, setPosition] = useState("bottom-right");
  const [fontSize, setFontSize] = useState(14);
  const [color, setColor] = useState("#222222");
  const [style, setStyle] = useState('plain');

  const handleFilesSelected = async (files) => {
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

  const handleDownloadNumberedPDF = async () => {
    if (!file) {
      alert("Please upload a PDF!");
      return;
    }
    setIsWorking(true);
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const colorRgb = hexToRgb(color);
    const total = pdfDoc.getPageCount();
    for (let i = 0; i < total; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const num = startNumber + i;
      let text = '';
      switch (style) {
        case 'plain': text = `${num}`; break;
        case 'page': text = `Page ${num}`; break;
        case 'page-no': text = `Page no. ${num}`; break;
        case 'page-of-x': text = `Page ${num} of ${total}`; break;
        case 'n-of-x': text = `${num} / ${total}`; break;
        case 'p-dot': text = `P. ${num}`; break;
        case 'pg': text = `Pg ${num}`; break;
        case 'sheet': text = `Sheet ${num}`; break;
        default: text = `${num}`;
      }
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);
      let x = 0, y = 0;
      switch (position) {
        case "bottom-right":
          x = width - textWidth - 24; y = 24;
          break;
        case "bottom-center":
          x = (width - textWidth) / 2; y = 24;
          break;
        case "bottom-left":
          x = 24; y = 24;
          break;
        case "top-right":
          x = width - textWidth - 24; y = height - textHeight - 24;
          break;
        case "top-center":
          x = (width - textWidth) / 2; y = height - textHeight - 24;
          break;
        case "top-left":
          x = 24; y = height - textHeight - 24;
          break;
        default:
          x = width - textWidth - 24; y = 24;
      }
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(colorRgb.r / 255, colorRgb.g / 255, colorRgb.b / 255),
        opacity: 1,
      });
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getOutputFileName(file?.name, 'numbered');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
    setShowUploader(true);
  };

  function hexToRgb(hex) {
    const match = hex.replace('#', '').match(/.{1,2}/g);
    if (!match) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(match[0], 16),
      g: parseInt(match[1], 16),
      b: parseInt(match[2], 16),
    };
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Add Page Numbers</h1>
      
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
      {isLoading && !thumbnails.length && (
        <div className="mt-8">
          <LoadingSpinner message="Loading PDF pages..." />
        </div>
      )}
      {file && !isLoading && (
        <>
          <div className="w-full max-w-2xl mx-auto bg-gray-200/50 dark:bg-gray-800 rounded-lg p-4 mb-6 mt-4">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <label className="flex flex-col items-center texy=gray-800 dark:text-gray-200">
                Start Number
                <input
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={e => setStartNumber(Number(e.target.value))}
                  className="w-20 text-center rounded inset-shadow-sm bg-gray-300/50 dark:bg-gray-900 texy=gray-800 dark:text-gray-200 text-sm py-1 mt-1"
                />
              </label>
              <label className="flex flex-col items-center texy=gray-800 dark:text-gray-200">
                Font Size
                <input
                  type="number"
                  min={8}
                  max={48}
                  value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-20 text-center rounded inset-shadow-sm bg-gray-300/50 dark:bg-gray-900 texy=gray-800 dark:text-gray-200 text-sm py-1 mt-1"
                />
              </label>
              <label className="flex flex-col items-center texy=gray-800 dark:text-gray-200">
                Color
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-8 h-8 p-0 border-1 border-gray-600 rounded"
                  style={{ minWidth: '2rem', minHeight: '2rem' }}
                />
              </label>
              <label className="flex flex-col items-center texy=gray-800 dark:text-gray-200">
                Position
                <select
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="w-full text-center rounded inset-shadow-sm bg-gray-300/50 dark:bg-gray-900 texy=gray-800 dark:text-gray-200 text-sm py-1 mt-1"
                >
                  {positions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col items-center texy=gray-800 dark:text-gray-200">
                Style
                <select
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="w-24 text-center rounded inset-shadow-sm bg-gray-300/50 dark:bg-gray-900 texy=gray-800 dark:text-gray-200 text-sm py-1 mt-1"
                >
                  {numberStyles.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <ThumbnailsGrid
            thumbnails={thumbnails}
            selectedPages={[]}
            allowSelection={false}
          />
          <Button
            onClick={handleDownloadNumberedPDF}
            className="mt-8"
            variant="primary"
            size="lg"
            disabled={isWorking}
          >
            {isWorking ? 'Adding Numbers...' : 'Download Numbered PDF'}
          </Button>
        </>
      )}
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default PageNumbering;
