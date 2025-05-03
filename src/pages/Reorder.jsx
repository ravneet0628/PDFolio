import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { PDFDocument } from "pdf-lib";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import FileUploader from "../components/FileUploader";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// Sortable thumbnail component
function SortableThumbnail({ id, thumb, pageNum }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="flex flex-col items-center bg-gray-700 rounded-md p-2 cursor-grab"
    >
      <img src={thumb} alt={`Page ${pageNum}`} className="w-28 h-auto rounded-md mb-2" />
      <span className="text-xs text-gray-200">Page {pageNum}</span>
    </div>
  );
}

function Reorder() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleFilesSelected = async (files) => {
    if (files.length > 0) {
      const pdfFile = files[0];
      setFile(pdfFile);
      await renderThumbnails(pdfFile);
    }
  };

  const renderThumbnails = async (pdfFile) => {
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
      thumbs.push({ id: `page-${i}`, src: canvas.toDataURL(), pageNum: i });
    }

    setThumbnails(thumbs);
    setOrder(thumbs.map((thumb) => thumb.id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);

    const newOrder = [...order];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id);

    setOrder(newOrder);
  };

  const handleDownloadReorderedPDF = async () => {
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    for (const pageId of order) {
      const pageNum = parseInt(pageId.split("-")[1], 10);
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);
      newPdf.addPage(copiedPage);
    }

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reordered.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Reorder PDF Pages</h1>

      <FileUploader onFilesSelected={handleFilesSelected} />

      {file && (
        <>
          <p className="mt-6 text-gray-300">Drag and drop to reorder pages:</p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-4 overflow-auto p-4 mt-4 px-8 py-8 mt-6 bg-gray-800/80 backdrop-blur-sm rounded-lg">
                {order.map((id) => {
                  const thumb = thumbnails.find((thumb) => thumb.id === id);
                  return (
                    <SortableThumbnail
                      key={thumb.id}
                      id={thumb.id}
                      thumb={thumb.src}
                      pageNum={thumb.pageNum}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={handleDownloadReorderedPDF}
            className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Download Reordered PDF
          </button>
        </>
      )}
    </div>
  );
}

export default Reorder;
