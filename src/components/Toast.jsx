import { useState, useEffect } from 'react';

function Toast({ message, type = 'info', duration = 3000, onClose, style = {} }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose && onClose(), 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`
        max-w-sm p-4 rounded-lg shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getTypeStyles()}
      `}
      style={style}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <span className="mr-2 text-lg">{getIcon()}</span>
          <p className="text-sm font-medium text-left">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose && onClose(), 300);
          }}
          className="ml-3 text-white hover:text-gray-200 transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default Toast; 