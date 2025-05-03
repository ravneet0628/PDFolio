import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.js',
  import.meta.url
).toString();
