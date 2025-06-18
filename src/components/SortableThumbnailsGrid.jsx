import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ThumbnailsGrid from './ThumbnailsGrid';

function SortableThumbItem({ id, thumb, pageNum, filename, onDelete, renderFooter }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.22, 1, 0.36, 1)', // smooth, springy
    zIndex: isDragging ? 10 : 0,
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.4)' : undefined,
    scale: isDragging ? 1.05 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 1 : 0.98,
    willChange: 'transform', // performance hint
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`relative border-4 rounded-lg shadow-lg overflow-hidden cursor-pointer transition bg-gray-200/50 dark:bg-gray-800 
        border-transparent hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-lg dark:hover:shadow-gray-700`}>
      <div className="w-32 h-32 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg mx-auto">
        <img src={thumb} alt={filename || `Page ${pageNum}`}
          className="max-w-full max-h-full transition-transform duration-300" />
        {onDelete && (
          <button onClick={() => onDelete(id)} className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow">✕</button>
        )}
      </div>
      {filename && <div className="text-xs text-gray-900 dark:text-gray-200 break-all text-center mt-2">{filename}</div>}
      {pageNum && !filename && <div className="text-xs text-gray-900 dark:text-gray-200 text-center mt-2">Page {pageNum}</div>}
      {renderFooter && renderFooter(pageNum)}
    </div>
  );
}

export default function SortableThumbnailsGrid({
  items,
  onOrderChange,
  onDelete,
  renderFooter,
  getThumb = (item) => item.thumbnail || item.src,
  getId = (item) => item.id,
  getPageNum = (item) => item.pageNum,
  getFilename = (item) => item.name,
  gridClass = '',
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const ids = items.map(getId);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      onOrderChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6 px-4 pb-4 mt-4 bg-gray-200/50 dark:bg-gray-800 backdrop-blur-sm rounded-lg max-h-96 overflow-auto transition-colors ${gridClass}`}>
          {items.map((item, idx) => (
            <SortableThumbItem
              key={getId(item)}
              id={getId(item)}
              thumb={getThumb(item)}
              pageNum={getPageNum(item)}
              filename={getFilename(item)}
              onDelete={onDelete}
              renderFooter={renderFooter}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
