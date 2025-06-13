function ThumbnailsGrid({ thumbnails, selectedPages = [], onPageClick = () => {}, allowSelection = false }) {
    return (
      <div className="w-auto h-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6 px-4 pb-4 mt-4 bg-gray-800/80 backdrop-blur-sm rounded-lg max-h-96 overflow-auto">
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
                      ? "border-cyan-700"
                      : "border-transparent hover:border-cyan-600"
                    : "border-transparent"}`}
              >
                <img
                  src={thumb.src ? thumb.src : thumb} // supports {src} or plain base64
                  alt={`Page ${pageNum}`}
                  className="w-28 h-auto rounded-md transition-transform duration-300"
                  style={{
                    transform: `rotate(${thumb.rotation || 0}deg)`,
                  }}
                />
                <p className="text-center text-gray-300 mt-2">Page {pageNum}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  export default ThumbnailsGrid;
  