import fs from "fs";
import pdf from "pdf-parse";

// Function to read a PDF and extract text
export async function extractTextFromPDF(filePath: string): Promise<string> {
  // Read the PDF file
  const pdfBuffer = fs.readFileSync(filePath);

  // Parse the PDF document
  const data = await pdf(pdfBuffer);

  return data.text;
}
// Function to extract text from a PDF buffer
export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  // Parse the PDF document
  const data = await pdf(buffer);

  return data.text;
}
