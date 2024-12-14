import { PDFDocument } from 'pdf-lib';
import { createWorker } from 'tesseract.js';
import Papa from 'papaparse';
import fs from 'fs/promises';
import { db } from '@db/index';
import { processingStatus } from '@db/schema';
import { analyzeDocument, processImage } from './claude';
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
  const batchId = Date.now().toString();
  console.log(`Starting batch processing with ID: ${batchId}`);

  await db.insert(processingStatus).values({
    batchId,
    status: 'processing',
    progress: 0,
    createdAt: new Date(),
    results: null
  });

  try {
    // Process files in parallel with a limit of 3 concurrent operations
    const chunkSize = 3;
    const results: ProcessedData[] = [];
    
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (file) => {
          try {
            if (file.size > 50 * 1024 * 1024) {
              throw new Error(`File ${file.originalname} exceeds 50MB limit`);
            }
            return await processFile(file);
          } catch (error) {
            console.error(`Error processing ${file.originalname}:`, error);
            return [];
          }
        })
      );

      results.push(...chunkResults.flat());
      const progress = Math.min(((i + chunk.length) / files.length) * 100, 99);
      await updateProgress(batchId, progress);
    }

    if (results.length === 0) {
      throw new Error('No valid data could be extracted from the files');
    }

    await storeResults(batchId, results);
    await updateProgress(batchId, 100);

    return batchId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

async function processFile(file: Express.Multer.File): Promise<ProcessedData[]> {
  console.log(`Starting to process file: ${file.originalname}`);
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  const content = await fs.readFile(file.path);

  try {
    let result: ProcessedData[];
    switch (ext) {
      case 'csv':
        result = await processCsv(content);
        break;
      case 'pdf':
        result = await processPdf(content);
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
        result = await processImage(content.toString('base64'));
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
    console.log(`File processed successfully with ${result.length} records`);
    return result;
  } finally {
    // Cleanup temporary file
    await fs.unlink(file.path).catch(console.error);
  }
}

async function processCsv(content: Buffer): Promise<ProcessedData[]> {
  return new Promise((resolve, reject) => {
    console.log('Processing CSV file...');
    Papa.parse(content.toString(), {
      header: true,
      complete: (results) => {
        try {
          const data = results.data
            .filter((row: any) => row && typeof row === 'object')
            .map((row: any) => ({
              streams: parseInt(row.streams || row.Streams || '0', 10),
              revenue: parseFloat(row.revenue || row.Revenue || '0'),
              platform: row.platform || row.Platform || 'Unknown',
              date: row.date || row.Date || new Date().toISOString()
            }))
            .filter(item => !isNaN(item.streams) && !isNaN(item.revenue));
          
          console.log(`CSV processed: ${data.length} valid records found`);
          resolve(data);
        } catch (error) {
          console.error('Error processing CSV:', error);
          reject(error);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      }
    });
  });
}

async function processPdf(content: Buffer): Promise<ProcessedData[]> {
  console.log('Starting PDF processing...');
  let worker;
  try {
    const pdfDoc = await PDFDocument.load(content);
    const numPages = pdfDoc.getPageCount();
    const textContent: string[] = [];

    // Initialize Tesseract worker
    console.log('Initializing Tesseract worker...');
    worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    console.log(`Processing ${numPages} pages...`);
    for (let i = 0; i < numPages; i++) {
      try {
        console.log(`Processing page ${i + 1}/${numPages}`);
        const text = await worker.recognize(content);
        if (text.data.text) {
          textContent.push(text.data.text);
          console.log(`Extracted text from page ${i + 1}: ${text.data.text.substring(0, 100)}...`);
        }
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
        // Continue with other pages even if one fails
      }
    }

    if (textContent.length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    console.log('Sending extracted text to Claude for analysis...');
    const combinedText = textContent.join('\n');
    console.log('Text being sent to Claude:', combinedText.substring(0, 500) + '...');
    
    const analysis = await analyzeDocument(combinedText);
    console.log('Received Claude analysis:', JSON.stringify(analysis, null, 2));
    
    if (!Array.isArray(analysis) || analysis.length === 0) {
      throw new Error('Invalid analysis result from Claude');
    }

    return analysis;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error('Error terminating Tesseract worker:', terminateError);
      }
    }
  }
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
    console.log(`Storing ${results.length} results for batch ${batchId}`);
    await db.update(processingStatus)
      .set({ 
        status: 'complete',
        results: results,
        completedAt: new Date(),
        error: null
      })
      .where(eq(processingStatus.batchId, batchId));
    console.log('Results stored successfully');
  } catch (error) {
    console.error('Error storing results:', error);
    throw new Error('Failed to store processing results');
  }
}