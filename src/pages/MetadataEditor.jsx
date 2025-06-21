import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import LoadingSpinner from "../components/LoadingSpinner";
import FileUploader from "../components/FileUploader";
import Button from "../components/Button";
import { getOutputFileName } from '../utils/outputFilename';

function MetadataEditor() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
    creationDate: '',
    modificationDate: ''
  });
  const [originalMetadata, setOriginalMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      const pdfFile = files[0];
      setFile(pdfFile);
      setHasChanges(false);
      await loadMetadata(pdfFile);
    }
  };

  const loadMetadata = async (pdfFile) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Extract metadata
      const title = pdfDoc.getTitle() || '';
      const author = pdfDoc.getAuthor() || '';
      const subject = pdfDoc.getSubject() || '';
      const keywordsArray = pdfDoc.getKeywords() || [];
      const keywords = Array.isArray(keywordsArray) ? keywordsArray.join(', ') : keywordsArray.toString();
      const creator = pdfDoc.getCreator() || '';
      const producer = pdfDoc.getProducer() || '';
      const creationDate = pdfDoc.getCreationDate()?.toISOString().split('T')[0] || '';
      const modificationDate = pdfDoc.getModificationDate()?.toISOString().split('T')[0] || '';

      const extractedMetadata = {
        title,
        author,
        subject,
        keywords,
        creator,
        producer,
        creationDate,
        modificationDate
      };

      setMetadata(extractedMetadata);
      setOriginalMetadata(extractedMetadata);
      setShowUploader(false);
    } catch (error) {
      console.error('Error loading metadata:', error);
      alert('Error loading PDF metadata. Please try another file.');
    }
    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const resetChanges = () => {
    setMetadata(originalMetadata);
    setHasChanges(false);
  };

  const saveMetadata = async () => {
    if (!file || !hasChanges) return;
    
    setIsWorking(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Set metadata
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
      if (metadata.keywords) {
        // Convert comma-separated string to array for PDF-lib
        const keywordsArray = metadata.keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);
        pdfDoc.setKeywords(keywordsArray);
      }
      if (metadata.creator) pdfDoc.setCreator(metadata.creator);
      if (metadata.producer) pdfDoc.setProducer(metadata.producer);
      
      // Set dates if provided
      if (metadata.creationDate) {
        pdfDoc.setCreationDate(new Date(metadata.creationDate));
      }
      if (metadata.modificationDate) {
        pdfDoc.setModificationDate(new Date(metadata.modificationDate));
      }

      // Always update modification date to current time
      pdfDoc.setModificationDate(new Date());

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = getOutputFileName(file?.name, 'metadata-updated');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Reset state for next file
      setHasChanges(false);
      setShowUploader(true);
      setFile(null);
      setMetadata({
        title: '',
        author: '',
        subject: '',
        keywords: '',
        creator: '',
        producer: '',
        creationDate: '',
        modificationDate: ''
      });
    } catch (error) {
      console.error('Error saving metadata:', error);
      alert('Error saving PDF metadata. Please try again.');
    }
    setIsWorking(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Edit PDF Metadata</h1>
      
      <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-2xl">
        Edit document properties like title, author, subject, and keywords. This information helps organize and identify your PDFs.
      </p>

      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}

      {isLoading && (
        <div className="mt-8">
          <LoadingSpinner message="Loading PDF metadata..." />
        </div>
      )}

      {file && !isLoading && !showUploader && (
        <div className="w-full max-w-2xl mt-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Document Metadata</h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Document title"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={metadata.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Document author"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={metadata.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Document subject"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  value={metadata.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Keywords separated by commas"
                />
              </div>

              {/* Creator */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Creator
                </label>
                <input
                  type="text"
                  value={metadata.creator}
                  onChange={(e) => handleInputChange('creator', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Creating application"
                />
              </div>

              {/* Creation Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Creation Date
                </label>
                <input
                  type="date"
                  value={metadata.creationDate}
                  onChange={(e) => handleInputChange('creationDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Read-only fields */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Read-only Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Producer
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {originalMetadata.producer || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Last Modified
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {originalMetadata.modificationDate || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-6 justify-center">
              <Button
                onClick={resetChanges}
                variant="neutral"
                size="md"
                disabled={!hasChanges || isWorking}
              >
                Reset Changes
              </Button>
              
              <Button
                onClick={saveMetadata}
                variant="success"
                size="lg"
                disabled={!hasChanges || isWorking}
              >
                {isWorking ? 'Saving...' : 'Save Metadata'}
              </Button>
            </div>

            {hasChanges && (
              <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-2">
                You have unsaved changes
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MetadataEditor; 