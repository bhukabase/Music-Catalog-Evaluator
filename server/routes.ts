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
  app.post('/api/upload', upload.array('files'), async (req: Request & { files: Express.Multer.File[] }, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      // Validate file types
      const validTypes = ['text/csv', 'application/pdf', 'image/png', 'image/jpeg'];
      const invalidFiles = req.files.filter(file => !validTypes.includes(file.mimetype));
      
      if (invalidFiles.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid file types detected',
          invalidFiles: invalidFiles.map(f => f.originalname)
        });
      }

      // Initialize processing status in database
      const batchId = await processFiles(req.files);
      
      // Return batch ID for status tracking
      res.json({ 
        batchId,
        message: 'Files uploaded successfully and processing started'
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
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
