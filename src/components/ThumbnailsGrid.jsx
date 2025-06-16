import { useState } from 'react';

function ThumbnailsGrid({ thumbnails, selectedPages = [], onPageClick = () => {}, allowSelection = false, renderPageFooter }) {
    return (
      <div className="w-auto h-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6 px-4 pb-4 mt-4 bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-lg max-h-96 overflow-auto transition-colors">
          {thumbnails.map((thumb, idx) => {
            const pageNum = idx + 1;
            const isSelected = selectedPages.includes(pageNum);
    
            return (
              <div
                key={idx}
                onClick={allowSelection ? () => onPageClick(pageNum) : undefined}
                className={`border-4 rounded-lg overflow-hidden cursor-pointer transition 
                  ${allowSelection
                    ? isSelected
                      ? "border-cyan-700 dark:border-cyan-400"
                      : "border-transparent hover:border-cyan-600 dark:hover:border-cyan-400"
                    : "border-transparent"}`}
              >
                <img
                  src={thumb.src ? thumb.src : thumb}
                  alt={`Page ${pageNum}`}
                  className="w-28 h-auto rounded-md transition-transform duration-300 bg-white dark:bg-gray-800"
                  style={{
                    transform: `rotate(${thumb.rotation || 0}deg)`,
                  }}
                />
                <p className="text-center text-gray-900 dark:text-gray-200 mt-2">Page {pageNum}</p>
                {renderPageFooter && (
                  <div className="flex justify-center mt-2">
                    {renderPageFooter(pageNum)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  export default ThumbnailsGrid;
