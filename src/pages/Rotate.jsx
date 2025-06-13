import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import LoadingSpinner from "../components/LoadingSpinner";
import { PDFDocument, degrees } from "pdf-lib";

import FileUploader from "../components/FileUploader";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function Rotate() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [pageRotations, setPageRotations] = useState({}); // only user-applied rotations
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [isWorking, setIsWorking] = useState(false); // Add loading state

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      const pdfFile = files[0];
      setFile(pdfFile);
      setSelectedPages([]);
      setPageRotations({});
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

  const applyRotation = (direction) => {
    if (selectedPages.length === 0) {
      alert("Please select pages first.");
      return;
    }

    setPageRotations((prev) => {
      const updated = { ...prev };
      selectedPages.forEach((pageNum) => {
        const current = updated[pageNum] || 0;
        updated[pageNum] =
          direction === "clockwise"
            ? (current + 90) % 360
            : (current + 270) % 360;
      });
      return updated;
    });
  };

  const handleDownloadRotatedPDF = async () => {
    if (!file) return;

    setIsWorking(true);

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);
      const pageNum = i + 1;
      if (pageRotations[pageNum]) {
        const existingRotation = page.getRotation().angle;
        const totalRotation = (existingRotation + pageRotations[pageNum]) % 360;
        page.setRotation(degrees(totalRotation));
      }
    }

    const rotatedPdfBytes = await pdfDoc.save();
    const blob = new Blob([rotatedPdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rotated.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false)
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Rotate PDFs</h1>

      <FileUploader onFilesSelected={handleFilesSelected} />
      
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
            <button
              onClick={() => applyRotation("counterclockwise")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              ↺ Rotate Left
            </button>
            <button
              onClick={() => applyRotation("clockwise")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              ↻ Rotate Right
            </button>

          </div>

          {/* Thumbnails */}
          <div className="w-auto h-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6 px-4 pb-4 mt-4 bg-gray-800/80 backdrop-blur-sm rounded-lg max-h-96 overflow-auto">
              {thumbnails.map((thumb, idx) => {
                const pageNum = idx + 1;
                const rotation = pageRotations[pageNum] || 0;

                return (
                  <div
                    key={idx}
                    onClick={() => togglePageSelection(pageNum)}
                    className={`border-4 rounded-lg overflow-hidden cursor-pointer transition
                    ${selectedPages.includes(pageNum)
                      ? "border-blue-400"
                      : "border-transparent hover:border-blue-200"}`}
                  >
                    <div className="relative w-full">
                      <img
                        src={thumb}
                        alt={`Page ${pageNum}`}
                        className="w-28 transition-transform duration-300"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                        }}
                      />
                    </div>
                    <p className="text-center text-gray-300 mt-2">Page {pageNum}</p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Download Button */}
          <button
            onClick={handleDownloadRotatedPDF}
            className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            {isWorking ? 'Creating Rotated Pdf' : 'Download Rotated PDF'}
          </button>
        </>
      )}
    </div>
  );
}

export default Rotate;
