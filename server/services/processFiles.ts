import { parse } from 'csv-parse';
import fs from 'fs/promises';
import { db } from '../../db';
import { processingStatus, processedFiles } from '../../db/schema';
import { eq } from 'drizzle-orm';

interface StreamData {
  song: string;
  listeners: number;
  streams: number;
  saves: number;
  release_date: string;
}

export async function processFiles(batchId: string, files: Express.Multer.File[]) {
  try {
    // Update status to processing
    await db.update(processingStatus)
      .set({ status: 'processing' })
      .where(eq(processingStatus.batchId, batchId));

    for (const file of files) {
      try {
        const fileContent = await fs.readFile(file.path, 'utf-8');
        
        // Parse CSV
        const records: StreamData[] = await new Promise((resolve, reject) => {
          parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            cast: true,
          }, (err, records) => {
            if (err) reject(err);
            else resolve(records);
          });
        });

        // Calculate totals
        const totalStreams = records.reduce((sum, record) => sum + record.streams, 0);
        
        // Update processed file record
        await db.update(processedFiles)
          .set({
            processingResult: {
              streams: totalStreams,
              platform: 'spotify', // Assuming Spotify based on columns
              period: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
            }
          })
          .where(eq(processedFiles.filename, file.filename));

        // Update processing status
        await db.transaction(async (tx) => {
          const status = await tx.query.processingStatus.findFirst({
            where: eq(processingStatus.batchId, batchId)
          });

          if (status) {
            await tx.update(processingStatus)
              .set({ 
                filesProcessed: (status.filesProcessed ?? 0) + 1,
                progress: Math.round((((status.filesProcessed ?? 0) + 1) / status.totalFiles) * 100)
              })
              .where(eq(processingStatus.batchId, batchId));
          }
        });

      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        await db.update(processedFiles)
          .set({
            processingResult: { 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          .where(eq(processedFiles.filename, file.filename));
      }
    }

    // Update final status
    await db.update(processingStatus)
      .set({ status: 'complete' })
      .where(eq(processingStatus.batchId, batchId));

  } catch (error) {
    console.error('Processing pipeline error:', error);
    await db.update(processingStatus)
      .set({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      .where(eq(processingStatus.batchId, batchId));
  }
} 