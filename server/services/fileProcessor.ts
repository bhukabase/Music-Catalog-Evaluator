import { PDFDocument } from 'pdf-lib';
import { createWorker } from 'tesseract.js';
import Papa from 'papaparse';
import fs from 'fs/promises';
import { db } from '@db/index';
import { processingStatus } from '@db/schema';
import { analyzeDocument } from './claude';
import { eq } from 'drizzle-orm';
import { Buffer } from 'buffer';
import { ProcessingStatus } from '@/lib/types';

export interface ProcessedData {
  streams: number;
  revenue: number;
  platform: string;
  date: string;
}

interface ClaudeResponse {
  streams?: number;
  revenue?: number;
  platform?: string;
  date?: string;
}

export async function processFiles(files: Express.Multer.File[]): Promise<string> {
  // Generate batch ID
  const batchId = Date.now().toString();

  // Initialize processing status
  await db.insert(processingStatus).values({
    batchId,
    status: 'processing',
    progress: 0,
    createdAt: new Date()
  });

  try {
    const results: ProcessedData[] = [];
    let progress = 0;
    const increment = 100 / files.length;

    for (const file of files) {
      try {
        const result = await processFile(file);
        results.push(...result);
        
        progress += increment;
        await updateProgress(batchId, Math.min(progress, 99));
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        // Continue processing other files
      }
    }

    if (results.length === 0) {
      throw new Error('No files were successfully processed');
    }

    // Store results in database
    await storeResults(batchId, results);
    await updateProgress(batchId, 100);

    return batchId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await db.update(processingStatus)
      .set({ 
        status: 'error', 
        error: errorMessage,
        updatedAt: new Date()
      })
      .where(eq(processingStatus.batchId, batchId));
    throw error;
  }
}

async function processFile(file: { originalname: string; path: string }): Promise<ProcessedData[]> {
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  const content = await fs.readFile(file.path);

  try {
    switch (ext) {
      case 'csv':
        return await processCsv(content);
      case 'pdf':
        return await processPdf(content);
      case 'png':
      case 'jpg':
      case 'jpeg':
        return await processImage(content.toString('base64'));
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } finally {
    // Cleanup temporary file
    await fs.unlink(file.path).catch(console.error);
  }
}

async function processCsv(content: Buffer): Promise<ProcessedData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(content.toString(), {
      header: true,
      complete: (results) => {
        const data = results.data.map((row: Record<string, string>) => ({
          streams: parseInt(row.streams || row.Streams || '0', 10),
          revenue: parseFloat(row.revenue || row.Revenue || '0'),
          platform: row.platform || row.Platform || 'Unknown',
          date: row.date || row.Date || new Date().toISOString()
        }));
        resolve(data.filter(item => !isNaN(item.streams) && !isNaN(item.revenue)));
      },
      error: reject
    });
  });
}

async function processPdf(content: Buffer): Promise<ProcessedData[]> {
  // Load PDF document
  const pdfDoc = await PDFDocument.load(content);
  const numPages = pdfDoc.getPageCount();
  const textContent: string[] = [];

  // Initialize Tesseract worker
  const worker = await createWorker();

  try {
    for (let i = 0; i < numPages; i++) {
      const page = pdfDoc.getPages()[i];
      
      // Extract text content from PDF using OCR
      // Note: Since pdf-lib doesn't support direct rendering to image,
      // we'll use OCR on the raw PDF content for now
      const text = await worker.recognize(content);
      if (text.data.text) {
        textContent.push(text.data.text);
      }
    }

    // Analyze extracted text with Claude
    const analysis = await analyzeDocument(textContent.join('\n'));
    return parseClaudeResponse(analysis);
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF document');
  } finally {
    await worker.terminate();
  }
}

async function processImage(base64Image: string): Promise<ProcessedData[]> {
  try {
    // Convert base64 to buffer if needed
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Initialize Tesseract worker
    const worker = await createWorker();
    
    try {
      // Perform OCR on the image
      const result = await worker.recognize(imageBuffer);
      const extractedText = result.data.text;
      
      // Use Claude to analyze the extracted text
      const analysis = await analyzeDocument(extractedText);
      return parseClaudeResponse(analysis);
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

function parseClaudeResponse(response: unknown): ProcessedData[] {
  const data: ProcessedData[] = [];
  
  if (typeof response === 'string') {
    try {
      const parsedResponse = JSON.parse(response) as ClaudeResponse[];
      if (Array.isArray(parsedResponse)) {
        parsedResponse.forEach(item => {
          if (item.streams && item.revenue && item.platform) {
            data.push({
              streams: parseInt(String(item.streams), 10),
              revenue: parseFloat(String(item.revenue)),
              platform: String(item.platform),
              date: item.date || new Date().toISOString()
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing Claude response:', error);
    }
  }

  return data;
}

async function updateProgress(batchId: string, progress: number): Promise<void> {
  try {
    await db.update(processingStatus)
      .set({ 
        progress, 
        updatedAt: new Date(),
        error: null // Clear any previous errors
      })
      .where(eq(processingStatus.batchId, batchId));
  } catch (error) {
    console.error('Error updating progress:', error);
    throw new Error('Failed to update processing status');
  }
}

async function storeResults(batchId: string, results: ProcessedData[]): Promise<void> {
  try {
    await db.update(processingStatus)
      .set({ 
        status: 'complete',
        results: JSON.stringify(results),
        completedAt: new Date(),
        error: null
      })
      .where(eq(processingStatus.batchId, batchId));
  } catch (error) {
    console.error('Error storing results:', error);
    throw new Error('Failed to store processing results');
  }
}
