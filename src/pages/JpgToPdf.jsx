import { useState } from "react";
import FileUploader from "../components/FileUploader";
import { PDFDocument } from "pdf-lib";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import SortableThumbnailsGrid from '../components/SortableThumbnailsGrid';

function JpgToPdf() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // for file/image loading
  const [isWorking, setIsWorking] = useState(false); // for PDF generation
  const [showUploader, setShowUploader] = useState(true);
  const [error, setError] = useState("");

  const handleFilesSelected = (newFiles) => {
    setIsLoading(true);
    setError("");
    // Only accept image files (jpg, jpeg, png)
    const validFiles = Array.from(newFiles).filter(f =>
      f.type.startsWith("image/") &&
      (f.type.endsWith("jpeg") || f.type.endsWith("jpg") || f.type.endsWith("png"))
    );
    if (validFiles.length !== newFiles.length) {
      setError("Some files were not valid images (JPG or PNG) and were ignored.");
    }
    const updatedFiles = [...files, ...validFiles];
    const uniqueFiles = Array.from(new Set(updatedFiles.map(f => f.name)))
      .map(name => updatedFiles.find(f => f.name === name));
    setFiles(uniqueFiles);
    setIsLoading(false);
    setShowUploader(false);
  };

  const handleOrderChange = (newOrder) => {
    setFiles(newOrder);
  };

  const deleteFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.name !== id));
  };

  const generatePdf = async () => {
    if (files.length === 0) return;
    setIsWorking(true);
    setError("");
    const pdfDoc = await PDFDocument.create();
    for (const file of files) {
      const imageBytes = await file.arrayBuffer();
      let image;
      if (file.type.includes("png")) {
        image = await pdfDoc.embedPng(imageBytes);
      } else if (file.type.includes("jpeg") || file.type.includes("jpg")) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else {
        setError(`File ${file.name} is not a supported image type.`);
        continue;
      }
      const dims = image.scale(1);
      const page = pdfDoc.addPage([dims.width, dims.height]);
      page.drawImage(image, { x: 0, y: 0, width: dims.width, height: dims.height });
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "converted.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">JPG to PDF</h1>
      {showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} multiple accept="image/jpeg,image/png" />
      )}
      {error && (
        <div className="w-full max-w-md mt-4 text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded p-3 text-center">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="w-full max-w-md mt-6">
          <LoadingSpinner message="Loading images..." />
        </div>
      )}
      {isWorking && (
        <div className="w-full max-w-md mt-6">
          <LoadingSpinner message="Generating PDF..." />
        </div>
      )}
      {files.length > 0 && !isLoading && !isWorking && (
        <>
          <SortableThumbnailsGrid
            items={files}
            onOrderChange={handleOrderChange}
            onDelete={deleteFile}
            getThumb={file => URL.createObjectURL(file)}
            getId={file => file.name}
            getFilename={file => file.name}
          />
          <Button
            onClick={generatePdf}
            disabled={isWorking}
            variant="primary"
            size="lg"
            className="mt-8 shadow"
          >
            {isWorking ? "Generating PDF..." : "Download PDF"}
          </Button>
        </>
      )}
    </div>
  );
}

export default JpgToPdf;
