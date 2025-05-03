import { PDFDocument } from 'pdf-lib';

export async function splitPDF(file, selectedPages) {
  const arrayBuffer = await file.arrayBuffer();
  const originalPdf = await PDFDocument.load(arrayBuffer);

  const newPdf = await PDFDocument.create();

  for (const pageNum of selectedPages) {
    const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);
    newPdf.addPage(copiedPage);
  }

  const newPdfBytes = await newPdf.save();
  return new Blob([newPdfBytes], { type: 'application/pdf' });
}
