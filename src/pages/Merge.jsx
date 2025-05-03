import { useState } from 'react';
import FileUploader from '../components/FileUploader';
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
      className="flex flex-col items-center bg-gray-700 rounded-md p-2 cursor-grab"
    >
      <img src={thumbnail} alt={file.name} className="w-28 h-auto rounded-md mb-2" />
      <span className="text-xs text-gray-200 break-all text-center">{file.name}</span>
    </div>
  );
}

function Merge() {
  const [files, setFiles] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleFilesSelected = async (uploadedFiles) => {
    const filesWithThumbnails = await Promise.all(
      uploadedFiles.map(async (file, index) => ({
        id: `${index}-${file.name}`,
        file,
        name: file.name,
        thumbnail: await renderThumbnail(file),
      }))
    );
    setFiles(filesWithThumbnails);
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
    const fileList = files.map((f) => f.file);
    const mergedBlob = await mergePDFs(fileList);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(mergedBlob);
    link.download = 'merged.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Merge PDFs</h1>

      <FileUploader onFilesSelected={handleFilesSelected} />

      {files.length > 0 && (
        <>
          <p className="mt-6 text-gray-300">Drag PDFs to reorder:</p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={files.map(f => f.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-4 overflow-auto p-4 mt-4 px-8 py-8 mt-6 bg-gray-800/80 backdrop-blur-sm rounded-lg">
                {files.map((file) => (
                  <SortableItem
                    key={file.id}
                    id={file.id}
                    file={file.file}
                    thumbnail={file.thumbnail}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={handleMerge}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Merge PDFs
          </button>
        </>
      )}
    </div>
  );
}

export default Merge;
