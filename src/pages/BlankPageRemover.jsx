import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import LoadingSpinner from "../components/LoadingSpinner";
import { PDFDocument } from "pdf-lib";
import ThumbnailsGrid from "../components/ThumbnailsGrid";
import FileUploader from "../components/FileUploader";
import { deletePagesFromPDF } from "../utils/deletePages";
import Button from "../components/Button";
import { getOutputFileName } from '../utils/outputFilename';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function BlankPageRemover() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [blankPages, setBlankPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [blankThreshold, setBlankThreshold] = useState(0.5);
  const [pageContentPercentages, setPageContentPercentages] = useState([]);

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      const pdfFile = files[0];
      setFile(pdfFile);
      setSelectedPages([]);
      setBlankPages([]);
      setAnalysisComplete(false);
      setPageContentPercentages([]);
      await renderThumbnailsAndAnalyze(pdfFile);
    }
  };

  const analyzePageContent = async (page, threshold = 5) => {
    try {
      // First check for substantial text content
      const textContent = await page.getTextContent();
      let textLength = 0;
      let meaningfulTextItems = 0;
      
      if (textContent.items) {
        textContent.items.forEach(item => {
          if (item.str && item.str.trim().length > 0) {
            textLength += item.str.trim().length;
            meaningfulTextItems++;
          }
        });
      }
      
      // Continue to visual analysis even if substantial text is found
      // We still want to calculate the actual visual content percentage

      // Render the page to analyze visual content coverage
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Analyze pixel data to calculate content coverage
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let totalPixels = canvas.width * canvas.height;
      let nonWhitePixels = 0;
      
      // Count non-white pixels (considering slight variations in white)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Consider a pixel as "content" if it's not close to white
        // Allow for slight variations in white (PDF background might not be pure white)
        if (r < 250 || g < 250 || b < 250) {
          nonWhitePixels++;
        }
      }
      
      // Calculate percentage of page covered with content
      const contentPercentage = Math.round((nonWhitePixels / totalPixels) * 100 * 100) / 100; // Round to 2 decimal places
      
      // For substantial text content, ensure we don't consider it blank even if visual content is low
      const hasSubstantialText = textLength > 20 && meaningfulTextItems > 3;
      const isBlank = hasSubstantialText ? false : contentPercentage < threshold;
      
      return { 
        isBlank: isBlank, 
        contentPercentage: contentPercentage 
      };
      
    } catch (error) {
      console.warn('Error analyzing page for blank detection:', error);
      return { isBlank: false, contentPercentage: 0 }; // On error, assume not blank to be safe
    }
  };

  const renderThumbnailsAndAnalyze = async (pdfFile) => {
    setIsLoading(true);
    setIsAnalyzing(true);
    setThumbnails([]);
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);
      
      const thumbs = [];
      const detectedBlankPages = [];
      const contentPercentages = [];
      
      // Render thumbnails and analyze pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        
        // Check if page is blank and get content percentage
        const analysisResult = await analyzePageContent(page, blankThreshold);
        if (analysisResult.isBlank) {
          detectedBlankPages.push(i);
        }
        contentPercentages.push(analysisResult.contentPercentage);
        
        // Render thumbnail
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        thumbs.push(canvas.toDataURL());
      }
      
      setThumbnails(thumbs);
      setBlankPages(detectedBlankPages);
      setSelectedPages(detectedBlankPages); // Auto-select detected blank pages
      setPageContentPercentages(contentPercentages);
      setAnalysisComplete(true);
      setShowUploader(false);
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      alert('Error analyzing PDF. Please try another file.');
    }
    
    setIsLoading(false);
    setIsAnalyzing(false);
  };

  const togglePageSelection = (pageNum) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum]
    );
  };

  const selectAllBlankPages = () => {
    setSelectedPages([...blankPages]);
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  const selectAllPages = () => {
    setSelectedPages(Array.from({ length: pageCount }, (_, idx) => idx + 1));
  };

  const updateBlankPagesBasedOnThreshold = (newThreshold) => {
    if (pageContentPercentages.length === 0) return;
    
    const newBlankPages = [];
    pageContentPercentages.forEach((contentPercentage, idx) => {
      const pageNum = idx + 1;
      if (contentPercentage < newThreshold) {
        newBlankPages.push(pageNum);
      }
    });
    
    setBlankPages(newBlankPages);
    setSelectedPages(newBlankPages); // Auto-select new blank pages
  };

  const handleThresholdChange = (newThreshold) => {
    setBlankThreshold(newThreshold);
    if (analysisComplete) {
      updateBlankPagesBasedOnThreshold(newThreshold);
    }
  };

  const handleRemovePages = async () => {
    if (!file || selectedPages.length === 0) {
      alert("Please select pages to remove!");
      return;
    }

    if (selectedPages.length === pageCount) {
      alert("Cannot remove all pages from the PDF!");
      return;
    }
    
    setIsWorking(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const newPdfBytes = await deletePagesFromPDF(arrayBuffer, selectedPages);
      const blob = new Blob([newPdfBytes], { type: "application/pdf" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = getOutputFileName(file?.name, 'blank-pages-removed');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Scroll to top
      window.scrollTo(0, 0);
      
      // Reset for next file
      setShowUploader(true);
      setFile(null);
      setThumbnails([]);
      setBlankPages([]);
      setSelectedPages([]);
      setAnalysisComplete(false);
      setPageContentPercentages([]);
    } catch (error) {
      console.error('Error removing pages:', error);
      alert('Error processing PDF. Please try again.');
    }
    setIsWorking(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Remove Blank Pages</h1>
      
      <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-2xl">
        Automatically detect and remove blank pages from your PDF. Adjust the sensitivity slider to control detection precision.
      </p>

      {/* Threshold Selector - Only show when no results yet */}
      {!analysisComplete && (
        <div className="mb-8 flex flex-col items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Detection Sensitivity
          </label>
          <div className="w-full max-w-md flex items-center gap-4">
            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[50px] hidden sm:inline">Strict</span>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={blankThreshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full h-3 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[50px] text-right hidden sm:inline">Relaxed</span>
          </div>
          <div className="flex justify-between w-full max-w-md text-xs text-gray-400 dark:text-gray-500 sm:hidden">
            <span>Strict</span>
            <span>Relaxed</span>
          </div>
        </div>
      )}

      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}

      {/* Show loading/analyzing spinner */}
      {(isLoading || isAnalyzing) && (
        <div className="mt-8">
          <LoadingSpinner 
            message={isAnalyzing ? "Analyzing pages for blank content..." : "Loading PDF pages..."} 
          />
        </div>
      )}

      {file && analysisComplete && !isLoading && (
        <>
          {/* Analysis Results */}
          <div className="w-full max-w-4xl mt-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analysis Results</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{pageCount}</span> total
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-red-600 dark:text-red-400">{blankPages.length}</span> blank
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-green-600 dark:text-green-400">{pageCount - blankPages.length}</span> content
                  </span>
                </div>
              </div>

              {/* Threshold Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:min-w-[80px]">
                    Sensitivity:
                  </label>
                  <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Strict</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={blankThreshold}
                      onChange={(e) => handleThresholdChange(Number(e.target.value))}
                      className="flex-1 h-3 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Relaxed</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUploader(true);
                    setFile(null);
                    setThumbnails([]);
                    setAnalysisComplete(false);
                    setPageContentPercentages([]);
                    setBlankPages([]);
                    setSelectedPages([]);
                    window.scrollTo(0, 0);
                  }}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition w-full sm:w-auto"
                >
                  Reset
                </button>
              </div>

              {blankPages.length === 0 ? (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-center">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    🎉 No blank pages detected in your PDF
                  </p>
                </div>
              ) : (
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-center">
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
                    {blankPages.length > 5 ? `📄 Blank page numbers: ${blankPages.slice(0, 5).join(', ')} and more...` 
                    : `📄 Blank page numbers: ${blankPages.join(', ')}`} | Review and remove below
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            <Button
              onClick={selectAllBlankPages}
              variant="info"
              size="md"
              disabled={blankPages.length === 0}
            >
              Select All Blank ({blankPages.length})
            </Button>
            <Button
              onClick={selectAllPages}
              variant="neutral"
              size="md"
            >
              Select All Pages
            </Button>
            <Button
              onClick={deselectAllPages}
              variant="danger"
              size="md"
            >
              Deselect All
            </Button>
          </div>

          <ThumbnailsGrid
            thumbnails={thumbnails}
            selectedPages={selectedPages}
            onPageClick={togglePageSelection}
            allowSelection={true}
            blankPages={blankPages} // Pass blank pages for special styling
            pageContentPercentages={pageContentPercentages} // Pass content percentages
          />

          {/* Remove Button */}
          {blankPages.length > 0 && (
            <Button
              onClick={handleRemovePages}
              variant="danger"
              size="lg"
              className="mt-8"
              disabled={selectedPages.length === 0 || isWorking}
            >
              {isWorking ? 'Removing Pages...' : `Remove ${selectedPages.length} Selected Page${selectedPages.length !== 1 ? 's' : ''}`}
            </Button>
          )}

          {blankPages.length === 0 && (
            <Button
              onClick={() => {
                setShowUploader(true);
                setFile(null);
                setThumbnails([]);
                setAnalysisComplete(false);
                setPageContentPercentages([]);
              }}
              variant="neutral"
              size="lg"
              className="mt-8"
            >
              Analyze Another PDF
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default BlankPageRemover; 