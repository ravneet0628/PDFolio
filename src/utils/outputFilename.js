// Utility to generate output file names for PDF transformations
export function getOutputFileName(originalName, transformation, part = null, ext = 'pdf') {
  if (!originalName) return `output_${transformation}.${ext}`;
  // Remove extension if present
  const base = originalName.replace(/\.[^/.]+$/, "");
  if (part !== null) {
    return `${base}_${transformation}_part${part}.${ext}`;
  }
  return `${base}_${transformation}.${ext}`;
}
