import { useState } from 'react';

function ThumbnailsGrid({ 
  thumbnails, 
  selectedPages = [], 
  splitPoints = [], 
  onPageClick = () => {}, 
  allowSelection = false, 
  allowSplitSelection=false,
  renderPageFooter }) {
    return (
      <div className="w-auto h-auto px-4">
        <div className="grid grid-cols-2 
        sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 
        gap-4 pt-6 px-4 pb-4 mt-4 
        bg-gray-200/50 dark:bg-gray-800 
        backdrop-blur-sm rounded-lg max-h-96 
        overflow-auto transition-colors">
          {thumbnails.map((thumb, idx) => {
            const pageNum = idx + 1;
            const isSelected = selectedPages.includes(pageNum);
            const showSplit = allowSplitSelection && 
            splitPoints.includes(pageNum) && 
            pageNum < thumbnails.length;
    
            return (
              <div
                key={idx}
                onClick={allowSelection || allowSplitSelection ? () => onPageClick(pageNum) : undefined}
                className={`relative border-4 rounded-lg shadow-lg overflow-hidden cursor-pointer transition 
                ${
                  allowSelection
                    ? isSelected
                      ? "border-cyan-700 dark:border-cyan-400 hover:shadow-lg shadow-cyan-200 dark:shadow-cyan-800"
                      : "border-transparent hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-lg dark:hover:shadow-gray-700"
                    : "border-transparent"
                }
                ${allowSplitSelection ? "group border-transparent hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-lg dark:hover:shadow-gray-700" : ""}
                `}                            
              >
                {/* Split bar on right */}
                {showSplit && (
                  <div className="pointer-events-none absolute top-0 right-0 h-full w-[4px] z-10 flex flex-col-2">
                    
                    <div className="flex-1 bg-red-500 dark:bg-red-600 rounded-b-sm" />
                  </div>
                )}
                <div className="w-32 h-32 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg mx-auto">
                  <img
                    src={thumb.src ? thumb.src : thumb}
                    alt={`Page ${pageNum}`}
                    className="max-w-full max-h-full transition-transform duration-300"
                    style={{
                      transform: `rotate(${thumb.rotation || 0}deg)`,
                    }}
                  />
                </div>
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
