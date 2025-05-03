import { PDFDocument } from 'pdf-lib';

export async function mergePDFs(files) {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    // Check if file is actually a Blob/File
    if (!(file instanceof Blob)) {
      throw new Error('Invalid file input');
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadedPdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
}
