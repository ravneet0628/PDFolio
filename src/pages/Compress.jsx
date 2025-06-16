import { useState } from "react";
import FileUploader from "../components/FileUploader";
import { PDFDocument } from "pdf-lib";
import LoadingSpinner from "../components/LoadingSpinner";

function Compress() {
  const [file, setFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setShowUploader(false);
    }
  };

  const compressPDF = async () => {
    if (!file) return;
    setIsCompressing(true);
    setProgress(0);

    const originalBytes = await file.arrayBuffer();
    const originalPdfDoc = await PDFDocument.load(originalBytes);
    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(originalPdfDoc, originalPdfDoc.getPageIndices());

    copiedPages.forEach((page) => newPdfDoc.addPage(page));
    setProgress(100);

    const compressedPdfBytes = await newPdfDoc.save();
    const blob = new Blob([compressedPdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "compressed.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsCompressing(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Compress PDF</h1>
      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}
      {isLoading && (
        <div className="mt-8">
          <LoadingSpinner message="Loading..." />
        </div>
      )}

      {isCompressing && (
        <div className="w-full max-w-md mt-6">
          <div className="h-4 bg-gray-700 rounded overflow-hidden">
            <div className="h-4 bg-cyan-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-center text-gray-400 text-sm mt-1">{progress}%</p>
        </div>
      )}

      <button
        onClick={compressPDF}
        disabled={isCompressing || !file}
        className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
      >
        {isCompressing ? "Compressing..." : "Download Compressed PDF"}
      </button>
    </div>
  );
}

export default Compress;
