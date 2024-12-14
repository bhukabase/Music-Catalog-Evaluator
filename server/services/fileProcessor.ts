import { createWorker } from 'tesseract.js';
import { db } from '../../db';
import { processingStatus } from '../../db/schema';
import path from 'path';
import fs from 'fs/promises';
import type { ProcessingStatus } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

/**
 * Generates a unique batch ID
 */
function generateBatchId(): string {
  return uuidv4();
}

/**
 * Processes uploaded files through OCR and data extraction
 * @param {Express.Multer.File[]} files - Array of uploaded files
 * @returns {Promise<string>} Batch ID for tracking processing status
 */
export async function processFiles(files: Express.Multer.File[]): Promise<string> {
  const batchId = generateBatchId();
  
  // Initialize processing status
  await db.insert(processingStatus).values({
    batchId,
    status: 'processing',
    progress: 0,
    filesProcessed: 0,
    totalFiles: files.length,
  });

  // Process files asynchronously
  processFileBatch(files, batchId).catch(error => {
    console.error('File processing error:', error);
    updateProcessingStatus(batchId, 'error', error.message);
  });

  return batchId;
}

/**
 * Processes a batch of files sequentially
 * @param {Express.Multer.File[]} files - Array of files to process
 * @param {string} batchId - Unique identifier for the processing batch
 */
async function processFileBatch(files: Express.Multer.File[], batchId: string) {
  const worker = await createWorker('eng');
  let filesProcessed = 0;

  try {
    for (const file of files) {
      await processFile(file, worker);
      filesProcessed++;
      
      // Update progress
      const progress = Math.round((filesProcessed / files.length) * 100);
      await updateProcessingStatus(batchId, 'processing', undefined, progress, filesProcessed);
    }

    await updateProcessingStatus(batchId, 'complete');
  } finally {
    await worker.terminate();
    // Cleanup temporary files
    await Promise.all(files.map(file => 
      fs.unlink(file.path).catch(console.error)
    ));
  }
}

/**
 * Processes a single file through OCR and data extraction
 * @param {Express.Multer.File} file - File to process
 * @param {Tesseract.Worker} worker - OCR worker instance
 * @returns {Promise<void>}
 */
async function processFile(file: Express.Multer.File, worker: Tesseract.Worker): Promise<void> {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext === '.csv') {
    await processCSV(file);
  } else if (['.pdf', '.png', '.jpg', '.jpeg'].includes(ext)) {
    await processImage(file, worker);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Processes CSV files for data extraction
 * @param {Express.Multer.File} file - CSV file to process
 */
async function processCSV(file: Express.Multer.File): Promise<void> {
  const content = await fs.readFile(file.path, 'utf-8');
  // TODO: Implement CSV parsing and data extraction
  console.log('Processing CSV:', file.originalname);
}

/**
 * Processes image files through OCR
 * @param {Express.Multer.File} file - Image file to process
 * @param {Tesseract.Worker} worker - OCR worker instance
 */
async function processImage(file: Express.Multer.File, worker: Tesseract.Worker): Promise<void> {
  const { data: { text } } = await worker.recognize(file.path);
  // TODO: Process extracted text and store results
  console.log('Extracted text from:', file.originalname);
}

/**
 * Updates the processing status in the database
 */
async function updateProcessingStatus(
  batchId: string,
  status: ProcessingStatus['status'],
  error?: string,
  progress?: number,
  filesProcessed?: number
) {
  await db
    .update(processingStatus)
    .set({
      status,
      error,
      progress,
      filesProcessed,
      updatedAt: new Date(),
    })
    .where(eq(processingStatus.batchId, batchId));
}
