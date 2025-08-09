import React from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ThumbnailsGrid from './ThumbnailsGrid';

function SortableThumbItem({ id, thumb, pageNum, filename, onDelete, renderFooter, rotation = 0, selected = false, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.22, 1, 0.36, 1)',
    zIndex: isDragging ? 10 : 0,
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.4)' : undefined,
    scale: isDragging ? 1.05 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.9 : 1,
    willChange: 'transform',
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={onClick}
      className={`relative border-4 rounded-lg shadow-lg overflow-hidden transition bg-gray-200/50 dark:bg-gray-800 
        ${selected ? 'border-cyan-700 dark:border-cyan-400 shadow-cyan-200 dark:shadow-cyan-800' : 'border-transparent hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-lg dark:hover:shadow-gray-700'}
        touch-none select-none ${isDragging ? 'border-blue-400 dark:border-blue-500' : ''}`}>
      <div className="w-32 h-32 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg mx-auto relative">
        <img src={thumb} alt={filename || `Page ${pageNum}`}
          className="max-w-full max-h-full transition-transform duration-300"
          style={{ transform: `rotate(${rotation || 0}deg)` }} />
        
        {/* Drag handle indicator */}
        <div className="absolute top-1 left-1 opacity-30 hover:opacity-60 transition-opacity">
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
          </svg>
        </div>
        
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }} 
            className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-red-700 transition-colors z-10"
          >
            ✕
          </button>
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
  getRotation = (item) => item.rotation || 0,
  selectedIds = [],
  onItemClick,
  gridClass = '',
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay before drag starts on touch
        tolerance: 8, // 8px tolerance for touch movement
      },
    })
  );
  const ids = items.map(getId);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      onOrderChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6 px-4 pb-4 mt-4 bg-gray-200/50 dark:bg-gray-800 backdrop-blur-sm rounded-lg max-h-96 overflow-auto transition-colors overscroll-contain ${gridClass}`}>
          {items.map((item, idx) => (
            <SortableThumbItem
              key={getId(item)}
              id={getId(item)}
              thumb={getThumb(item)}
              pageNum={getPageNum(item)}
              filename={getFilename(item)}
              onDelete={onDelete}
              renderFooter={renderFooter}
              rotation={getRotation(item)}
              selected={selectedIds.includes(getId(item))}
              onClick={onItemClick ? (e) => { e.stopPropagation(); onItemClick(getId(item), item); } : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
