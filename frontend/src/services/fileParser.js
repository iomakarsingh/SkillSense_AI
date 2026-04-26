/**
 * fileParser.js
 * Browser-side file text extraction for .txt, .pdf, .docx
 * Returns plain text string from any supported file.
 */

const SUPPORTED_TYPES = {
  'text/plain':                                                   'txt',
  'application/pdf':                                             'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword':                                          'doc',
};

export const ACCEPT_STRING = '.txt,.pdf,.doc,.docx';

/**
 * Extract text from a File object.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt' || file.type === 'text/plain') {
    return readAsText(file);
  }

  if (ext === 'pdf' || file.type === 'application/pdf') {
    return extractFromPDF(file);
  }

  if (ext === 'docx' || file.type.includes('wordprocessingml')) {
    return extractFromDOCX(file);
  }

  if (ext === 'doc') {
    throw new Error('.doc (Word 97) is not supported. Please save as .docx or copy-paste the text.');
  }

  throw new Error(`Unsupported file type: .${ext}. Please use .txt, .pdf, or .docx`);
}

/** Read a text file */
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read text file.'));
    reader.readAsText(file);
  });
}

/** Extract text from PDF using pdf.js */
async function extractFromPDF(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');

  // Use the bundled worker
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const textParts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    textParts.push(pageText);
  }

  const text = textParts.join('\n\n').replace(/\s+/g, ' ').trim();
  if (!text) throw new Error('Could not extract text from PDF. Try a text-based PDF (not a scanned image).');
  return text;
}

/** Extract text from DOCX using mammoth */
async function extractFromDOCX(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value?.trim();
  if (!text) throw new Error('Could not extract text from DOCX file.');
  return text;
}

/** Human-readable file size */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
