import { useState } from "react";
import FileUploader from "../components/FileUploader";
import { PDFDocument } from "pdf-lib";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableImage({ file, index, id, onDelete, isOver, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: dragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: dragging ? 10 : 0,
    boxShadow: dragging ? '0 10px 20px rgba(0,0,0,0.4)' : undefined,
    scale: dragging ? 1.05 : 1,
    cursor: dragging ? 'grabbing' : 'grab',
    opacity: dragging ? 1 : 0.95,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative border-2 border-gray-700 rounded p-2 bg-gray-800 flex flex-col items-center"
    >
      <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
        Page {index + 1}
      </div>
      <img src={URL.createObjectURL(file)} alt={`Image ${index + 1}`} className="w-full max-h-40 object-contain" />
      <button
        onClick={() => onDelete(id)}
        className="absolute top-1 right-1 bg-red-700 hover:bg-red-600 text-white px-2 py-1 text-xs rounded"
      >
        ✕
      </button>
    </div>
  );
}

function JpgToPdf() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // for file/image loading
  const [isWorking, setIsWorking] = useState(false); // for PDF generation
  const [showUploader, setShowUploader] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleFilesSelected = (newFiles) => {
    setIsLoading(true);
    const updatedFiles = [...files, ...Array.from(newFiles)];
    const uniqueFiles = Array.from(new Set(updatedFiles.map(f => f.name)))
      .map(name => updatedFiles.find(f => f.name === name));
    setFiles(uniqueFiles);
    setIsLoading(false);
    setShowUploader(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = files.findIndex((file) => file.name === active.id);
      const newIndex = files.findIndex((file) => file.name === over.id);
      setFiles((files) => arrayMove(files, oldIndex, newIndex));
    }
  };

  const deleteFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.name !== id));
  };

  const generatePdf = async () => {
    if (files.length === 0) return;
    setIsWorking(true);
    const pdfDoc = await PDFDocument.create();
    for (const file of files) {
      const imageBytes = await file.arrayBuffer();
      const ext = file.type.includes("png") ? "png" : "jpg";
      const image = ext === "png" ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
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
    <div className="flex flex-col items-center p-6 min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">JPG to PDF</h1>
      {showUploader && (
        <FileUploader onFilesSelected={handleFilesSelected} multiple accept="image/*" />
      )}

      {isLoading && (
        <div className="w-full max-w-md mt-6 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded overflow-hidden">
            <div className="h-4 bg-cyan-600 dark:bg-cyan-400 animate-pulse w-full"></div>
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-1">Loading images...</p>
        </div>
      )}

      {isWorking && (
        <div className="w-full max-w-md mt-6 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded overflow-hidden">
            <div className="h-4 bg-green-600 dark:bg-green-400 animate-pulse w-full"></div>
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-1">Generating PDF...</p>
        </div>
      )}

      {files.length > 0 && !isLoading && !isWorking && (
        <>
          <div className="w-full bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-6 py-6 mt-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={files.map((f) => f.name)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <SortableImage
                      key={file.name}
                      id={file.name}
                      file={file}
                      index={index}
                      onDelete={deleteFile}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <button
            onClick={generatePdf}
            disabled={isWorking}
            className="mt-6 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
          >
            {isWorking ? "Generating PDF..." : "Download PDF"}
          </button>
        </>
      )}
    </div>
  );
}

export default JpgToPdf;
