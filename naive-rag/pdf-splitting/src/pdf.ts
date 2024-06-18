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
