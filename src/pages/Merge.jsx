import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import { mergePDFs } from '../utils/mergePDF';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

function SortableItem({ id, file, thumbnail }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 rounded-md p-2 cursor-grab"
    >
      <img src={thumbnail} alt={file.name} className="w-28 rounded-md mb-2" />
      <span className="text-xs text-gray-700 dark:text-gray-200 break-all text-center">{file.name}</span>
    </div>
  );
}

function Merge() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleFilesSelected = async (uploadedFiles) => {
    setIsLoading(true);
    const filesWithThumbnails = await Promise.all(
      uploadedFiles.map(async (file, index) => ({
        id: `${index}-${file.name}`,
        file,
        name: file.name,
        thumbnail: await renderThumbnail(file),
      }))
    );
    setFiles(filesWithThumbnails);
    setIsLoading(false);
    setShowUploader(false);
  };

  const renderThumbnail = async (file) => {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsWorking(true);
    const fileList = files.map((f) => f.file);
    const mergedBlob = await mergePDFs(fileList);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(mergedBlob);
    link.download = 'merged.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsWorking(false);
    setShowUploader(true);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Merge PDFs</h1>
      {!isLoading && showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} />
      )}
      {isLoading && files.length === 0 && (
        <div className="mt-8">
          <LoadingSpinner message="Processing PDF files..." />
        </div>
      )}
      {files.length > 0 && (
        <>
          <p className="mt-6 text-gray-700 dark:text-gray-300">Drag PDFs to reorder:</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={files.map(f => f.id)} strategy={horizontalListSortingStrategy}>
              <div className="w-auto h-auto px-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6 px-4 pb-4 mt-4 bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg max-h-96 overflow-auto">
                  {files.map((file) => (
                    <SortableItem
                      key={file.id}
                      id={file.id}
                      file={file.file}
                      thumbnail={file.thumbnail}
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
          <button
            onClick={handleMerge}
            disabled={isLoading}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            {isWorking ? 'Merging...' : 'Merge PDFs'}
          </button>
        </>
      )}
    </div>
  );
}

export default Merge;
