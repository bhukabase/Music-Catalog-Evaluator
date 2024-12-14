import express from 'express';
import multer from 'multer';
import { db } from '../../db';
import { processingStatus, processedFiles } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { processFiles } from '../services/processFiles';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the uploads directory in project root
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    // Create unique filename while preserving extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/csv',
      'application/pdf',
      'image/png',
      'image/jpeg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
}).array('files');

router.post('/', async (req, res) => {
  console.log('Upload request received');
  
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: err.message });
      }

      console.log('Files received:', req.files);

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        console.error('No files in request');
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Create batch ID for tracking
      const batchId = uuidv4();

      // Create processing status record
      await db.insert(processingStatus).values({
        batchId,
        status: 'idle',
        totalFiles: files.length,
        filesProcessed: 0
      });

      // Create processed files records
      await Promise.all(files.map(file => 
        db.insert(processedFiles).values({
          batchId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          processingResult: {}
        })
      ));

      // Return batch ID for tracking
      res.json({ 
        message: 'Files uploaded successfully',
        batchId,
        filesCount: files.length
      });

      // Trigger processing pipeline
      processFiles(batchId, files).catch(error => {
        console.error('Processing pipeline failed:', error);
      });
    });
  } catch (error) {
    console.error('Server error during upload:', error);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

export default router; 