import { PDFDocument } from 'pdf-lib';

/**
 * Delete selected pages from a PDF.
 * @param {Uint8Array|ArrayBuffer} pdfBytes - The original PDF file as bytes.
 * @param {number[]} pagesToDelete - 1-based page numbers to delete.
 * @returns {Promise<Uint8Array>} - The new PDF as bytes.
 */
export async function deletePagesFromPDF(pdfBytes, pagesToDelete) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  // Convert to 0-based and sort descending to avoid index shift
  const pages = pagesToDelete.map(p => p - 1).sort((a, b) => b - a);
  for (const pageIdx of pages) {
    if (pageIdx >= 0 && pageIdx < totalPages) {
      pdfDoc.removePage(pageIdx);
    }
  }
  return await pdfDoc.save();
}
