function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-cyan-500"></div>
      <p className="mt-4 text-gray-400 text-center">{message}</p>
    </div>
  );
}

export default LoadingSpinner;