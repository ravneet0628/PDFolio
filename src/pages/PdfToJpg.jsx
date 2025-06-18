import { useState } from "react";
import FileUploader from "../components/FileUploader";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import JSZip from "jszip";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function PdfToJpg() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // replaces isRendering for consistency
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setShowUploader(false);
      await generateImages(files[0]);
    }
  };

  const generateImages = async (file) => {
    setIsLoading(true);
    setImages([]);
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const renderedImages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg");
      renderedImages.push(dataUrl);
    }
    setImages(renderedImages);
    setSelectedPages(renderedImages.map((_, index) => index + 1));
    setIsLoading(false);
  };

  const downloadImage = (dataUrl, index) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `page-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSelectedAsJpgs = () => {
    selectedPages.forEach((pageNum) => {
      const img = images[pageNum - 1];
      const link = document.createElement("a");
      link.href = img;
      link.download = `page-${pageNum}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const downloadZip = async () => {
    setIsWorking(true);
    const zip = new JSZip();
    selectedPages.forEach((pageNum) => {
      const img = images[pageNum - 1];
      zip.file(`page-${pageNum}.jpg`, img.split(",")[1], { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
  };

  const togglePageSelection = (page) => {
    if (selectedPages.includes(page)) {
      setSelectedPages(selectedPages.filter((p) => p !== page));
    } else {
      setSelectedPages([...selectedPages, page]);
    }
  };

  const selectAllPages = () => {
    setSelectedPages(images.map((_, i) => i + 1));
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  return (
    <div className="flex flex-col items-center p-6 min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">PDF to JPG</h1>
      {showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}

      {isLoading && (
        <div className="w-full max-w-md mt-6">
          <LoadingSpinner message="Rendering pages..." />
        </div>
      )}
      {isWorking && (
        <div className="w-full max-w-md mt-6">
          <LoadingSpinner message="Preparing ZIP..." />
        </div>
      )}

      {images.length > 0 && !isLoading && !isWorking && (
        <div className="mt-4 flex flex-wrap gap-4">
          <Button onClick={selectAllPages} variant="info" size="md">
            Select All
          </Button>
          <Button onClick={deselectAllPages} variant="danger" size="md">
            Deselect All
          </Button>
          <Button onClick={downloadSelectedAsJpgs} variant="warning" size="md">
            Download Selected as JPGs
          </Button>
          <Button onClick={downloadZip} variant="primary" size="md">
            Download ZIP
          </Button>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-8 w-full bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-6 py-8">
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mx-auto transition-opacity ${isLoading || isWorking ? 'blur-sm opacity-50' : ''}`}> 
            {images.map((img, index) => (
              <div
                key={index}
                className={`relative flex flex-col items-center border-4 rounded-lg overflow-hidden cursor-pointer transition 
                  ${selectedPages.includes(index + 1) ? 'border-cyan-700 dark:border-cyan-400' : 'border-transparent hover:border-cyan-600 dark:hover:border-cyan-400'}`}
                onClick={() => togglePageSelection(index + 1)}
              >
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Page {index + 1}
                </div>
                <img src={img} alt={`Page ${index + 1}`} className="w-full rounded shadow bg-white dark:bg-gray-900" />
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    downloadImage(img, index);
                  }}
                  variant="primary"
                  size="sm"
                  className="mt-2"
                >
                  Download JPG
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PdfToJpg;
