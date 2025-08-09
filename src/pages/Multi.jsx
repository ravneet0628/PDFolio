import { useEffect, useMemo, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument, degrees } from 'pdf-lib';
import FileUploader from '../components/FileUploader';
import SortableThumbnailsGrid from '../components/SortableThumbnailsGrid';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import GlobalDropZone from '../components/GlobalDropZone';
import { useToasts } from '../components/ToastManager';
import { analyzeFileUpload } from '../utils/fileProcessing';
import { getOutputFileName } from '../utils/outputFilename';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export default function Multi() {
  const { addToast, ToastContainer } = useToasts();
  const [originalPdfBytes, setOriginalPdfBytes] = useState(null); // ArrayBuffer
  const [fileName, setFileName] = useState('document.pdf');
  const [pages, setPages] = useState([]); // { id, index, thumbnail, rotation, pageNum }
  const [selected, setSelected] = useState([]); // ids
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [history, setHistory] = useState([]);
  const [redo, setRedo] = useState([]);

  const pushHistory = (nextPages) => {
    setHistory((h) => {
      const copy = [...h, pages];
      return copy.length > 20 ? copy.slice(copy.length - 20) : copy;
    });
    setRedo([]);
    setPages(nextPages);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, h.length - 1));
    setRedo((r) => [...r, pages]);
    setPages(prev);
    setSelected([]);
  };

  const redoAction = () => {
    if (redo.length === 0) return;
    const next = redo[redo.length - 1];
    setRedo((r) => r.slice(0, r.length - 1));
    setHistory((h) => [...h, pages]);
    setPages(next);
    setSelected([]);
  };

  const handleFilesSelected = async (files) => {
    const analysis = analyzeFileUpload(files, 'application/pdf', [], { singleFileMode: true });
    analysis.info.forEach((m) => addToast(m, 'success', 3000));
    analysis.warnings.forEach((m) => addToast(m, 'warning', 4000));
    analysis.errors.forEach((m) => addToast(m, 'error', 5000));
    if (analysis.validFiles.length === 0) return;
    const pdfFile = analysis.validFiles[0];
    setFileName(pdfFile.name || 'document.pdf');
    await loadPdf(pdfFile);
  };

  const loadPdf = async (file) => {
    try {
      setIsLoading(true);
      setPages([]);
      setSelected([]);
      setHistory([]);
      setRedo([]);
      const bytes = await file.arrayBuffer();
      // Clone the ArrayBuffer to prevent detachment issues
      const clonedBytes = bytes.slice();
      setOriginalPdfBytes(clonedBytes);
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const list = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Get the existing rotation from the PDF page
        const existingRotation = page.rotate || 0;
        // Normalize base render to 0 so CSS rotation controls the visual orientation
        const viewport = page.getViewport({ scale: 0.2, rotation: 0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        list.push({ id: `p-${i}`, index: i - 1, pageNum: i, rotation: existingRotation, thumbnail: canvas.toDataURL() });
      }
      setPages(list);
      setShowUploader(false);
    } catch (e) {
      console.error(e);
      addToast('Failed to load PDF', 'error', 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const onOrderChange = (newItems) => {
    // Ensure indices remain the original source indices; only pageNum/order changes
    const next = newItems.map((it, idx) => ({ ...it, pageNum: idx + 1 }));
    pushHistory(next);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelected(pages.map((p) => p.id));
  const deselectAll = () => setSelected([]);
  const selectOdd = () => setSelected(pages.filter((_, i) => (i + 1) % 2 === 1).map((p) => p.id));
  const selectEven = () => setSelected(pages.filter((_, i) => (i + 1) % 2 === 0).map((p) => p.id));

  const applyRotation = (dir) => {
    if (selected.length === 0) return;
    const next = pages.map((p) =>
      selected.includes(p.id)
        ? { ...p, rotation: ((p.rotation || 0) + (dir === 'cw' ? 90 : 270)) % 360 }
        : p
    );
    pushHistory(next);
  };

  const deleteSelected = () => {
    if (selected.length === 0) return;
    const next = pages.filter((p) => !selected.includes(p.id)).map((p, idx) => ({ ...p, pageNum: idx + 1 }));
    pushHistory(next);
    setSelected([]);
  };

  const exportEdited = async () => {
    if (!originalPdfBytes || pages.length === 0) return;
    setIsWorking(true);
    try {
      const src = await PDFDocument.load(originalPdfBytes);
      const out = await PDFDocument.create();
      for (const p of pages) {
        const [copied] = await out.copyPages(src, [p.index]);
        // Always set rotation to ensure it overrides any existing rotation
        copied.setRotation(degrees(p.rotation || 0));
        out.addPage(copied);
      }
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = getOutputFileName(fileName, 'edited');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast('Edited PDF downloaded', 'success', 3000);
    } catch (e) {
      console.error(e);
      addToast('Failed to export edited PDF', 'error', 4000);
    } finally {
      setIsWorking(false);
    }
  };

  const extractSelected = async () => {
    if (!originalPdfBytes || selected.length === 0) return;
    setIsWorking(true);
    try {
      const ids = new Set(selected);
      const chosen = pages.filter((p) => ids.has(p.id));
      const src = await PDFDocument.load(originalPdfBytes);
      const out = await PDFDocument.create();
      for (const p of chosen) {
        const [copied] = await out.copyPages(src, [p.index]);
        // Always set rotation to ensure it overrides any existing rotation
        copied.setRotation(degrees(p.rotation || 0));
        out.addPage(copied);
      }
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = getOutputFileName(fileName, 'extracted');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast('Extracted PDF downloaded', 'success', 3000);
    } catch (e) {
      console.error(e);
      addToast('Failed to extract pages', 'error', 4000);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <GlobalDropZone onFilesDropped={handleFilesSelected} accept="application/pdf" enabled={!isLoading && !isWorking} />
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Multi Tool</h1>

      {showUploader && !isLoading && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}

      {isLoading && (
        <div className="mt-8">
          <LoadingSpinner message="Loading PDF pages..." />
        </div>
      )}

      {!showUploader && !isLoading && pages.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            <Button onClick={selectAll} variant="info" size="sm">Select All</Button>
            <Button onClick={deselectAll} variant="danger" size="sm">Deselect All</Button>
            <Button onClick={selectOdd} variant="neutral" size="sm">Select Odd</Button>
            <Button onClick={selectEven} variant="neutral" size="sm">Select Even</Button>
            <Button onClick={() => applyRotation('ccw')} variant="primary" size="sm">↺ Rotate Left</Button>
            <Button onClick={() => applyRotation('cw')} variant="primary" size="sm">↻ Rotate Right</Button>
            <Button onClick={deleteSelected} variant="danger" size="sm" disabled={selected.length === 0}>Delete</Button>
            <Button onClick={undo} variant="neutral" size="sm" disabled={history.length === 0}>Undo</Button>
            <Button onClick={redoAction} variant="neutral" size="sm" disabled={redo.length === 0}>Redo</Button>
          </div>

          {/* Grid */}
          <div className="w-full max-w-4xl">
            <SortableThumbnailsGrid
              items={pages}
              onOrderChange={onOrderChange}
              getThumb={(it) => it.thumbnail}
              getId={(it) => it.id}
              getPageNum={(it) => it.pageNum}
              getRotation={(it) => it.rotation}
              selectedIds={selected}
              onItemClick={(id) => toggleSelect(id)}
            />
          </div>

          {/* Export */}
          <div className="flex flex-col items-center gap-3 mt-6">
            <div className="flex gap-3">
              <Button onClick={extractSelected} variant="warning" size="lg" disabled={selected.length === 0 || isWorking}>
                {isWorking ? 'Working…' : 'Extract Selected'}
              </Button>
              <Button onClick={exportEdited} variant="success" size="lg" disabled={isWorking}>
                {isWorking ? 'Creating PDF...' : 'Export Edited PDF'}
              </Button>
            </div>
          </div>
        </>
      )}

      <ToastContainer />
    </div>
  );
}


