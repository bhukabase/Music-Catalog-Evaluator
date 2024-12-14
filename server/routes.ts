import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { processFiles } from "./services/fileProcessor";
import { calculateValuation } from "./services/valuationEngine";
import { db } from "../db/index";
import { valuations, processingStatus, valuationConfigSchema } from "../db/schema";
import { eq } from "drizzle-orm";
import type { ProcessingStatus } from "@/lib/types";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

export function registerRoutes(app: Express): Server {
  // File upload endpoint
  app.post('/api/upload', upload.array('files', 10), async (req: Request, res) => {
    try {
      console.log('Received upload request');
      
      const files = (req as any).files;
      if (!files || !Array.isArray(files) || files.length === 0) {
        console.error('No files received in request');
        return res.status(400).json({ message: 'No files uploaded' });
      }

      console.log('Files received:', files.map(f => ({
        name: f.originalname,
        size: f.size,
        type: f.mimetype
      })));

      // More lenient file type validation
      const validTypes = [
        'text/csv',
        'application/csv',
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        // Common variations
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      const invalidFiles = files.filter(file => !validTypes.some(type => 
        file.mimetype.toLowerCase().includes(type.toLowerCase().split('/')[1])
      ));
      
      if (invalidFiles.length > 0) {
        console.error('Invalid file types:', invalidFiles.map(f => f.mimetype));
        return res.status(400).json({ 
          message: 'Invalid file types detected. Please upload CSV, PDF, PNG, or JPEG files only.',
          invalidFiles: invalidFiles.map(f => f.originalname)
        });
      }

      // Initialize processing status in database
      console.log('Starting file processing');
      const batchId = await processFiles(files);
      console.log('Processing started with batch ID:', batchId);
      
      // Return batch ID for status tracking
      res.json({ 
        batchId,
        message: 'Files uploaded successfully and processing started',
        files: files.map(f => f.originalname)
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'File upload failed. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Processing status endpoint
  app.get('/api/processing/:batchId', async (req, res) => {
    try {
      const status = await db.query.processingStatus.findFirst({
        where: (fields) => eq(fields.batchId, req.params.batchId)
      });

      if (!status) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      res.json(status);
    } catch (error) {
      console.error('Processing status error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // Valuation config endpoint
  app.post('/api/valuation/config', async (req, res) => {
    try {
      console.log('Received config:', req.body);
      
      // Parse and validate the configuration
      const configResult = valuationConfigSchema.safeParse(req.body);
      
      if (!configResult.success) {
        console.error('Validation error:', configResult.error);
        return res.status(400).json({
          message: 'Invalid configuration',
          errors: configResult.error.errors
        });
      }

      const result = await calculateValuation(configResult.data);
      
      if (!result) {
        throw new Error('Failed to generate valuation');
      }
      
      res.json({
        id: result.id,
        config: result.config,
        summary: result.summary,
        projections: result.projections
      });
    } catch (error) {
      console.error('Valuation config error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to process valuation configuration'
      });
    }
  });

  // Report generation endpoint
  app.get('/api/valuation/:id/report', async (req, res) => {
    try {
      const valuation = await db.query.valuations.findFirst({
        where: (fields) => eq(fields.id, parseInt(req.params.id))
      });

      if (!valuation) {
        return res.status(404).json({ message: 'Valuation not found' });
      }

      res.json(valuation);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate report'
      });
    }
  });

  const server = createServer(app);
  return server;
}
