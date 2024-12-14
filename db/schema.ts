/**
 * Database Schema Definitions
 * Defines table structures and relationships for the application
 * @module db/schema
 */

import { 
  integer, 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  json, 
  varchar 
} from 'drizzle-orm/pg-core';
import { z } from 'zod';
import type { ProcessingStatus } from '@/lib/types';

/**
 * Validation schema for valuation configuration
 */
export const valuationConfigSchema = z.object({
  spotifyRate: z.number()
    .min(0, "Rate must be positive")
    .max(1, "Rate cannot exceed 1")
    .multipleOf(0.001, "Use up to 3 decimal places"),
  
  appleMusicRate: z.number()
    .min(0, "Rate must be positive")
    .max(1, "Rate cannot exceed 1")
    .multipleOf(0.001, "Use up to 3 decimal places"),
  
  yearOneDecay: z.number()
    .int("Must be a whole number")
    .min(0, "Decay rate must be positive")
    .max(100, "Decay rate cannot exceed 100%"),
  
  yearTwoDecay: z.number()
    .int("Must be a whole number")
    .min(0, "Decay rate must be positive")
    .max(100, "Decay rate cannot exceed 100%"),
  
  yearThreeDecay: z.number()
    .int("Must be a whole number")
    .min(0, "Decay rate must be positive")
    .max(100, "Decay rate cannot exceed 100%"),
});

/**
 * Processing Status Table
 * Tracks file processing status and progress
 */
export const processingStatus = pgTable('processing_status', {
  id: serial('id').primaryKey(),
  batchId: varchar('batch_id', { length: 50 }).notNull().unique(),
  status: text('status', { enum: ['idle', 'processing', 'complete', 'error'] })
    .notNull()
    .default('idle'),
  progress: integer('progress').default(0),
  error: text('error'),
  filesProcessed: integer('files_processed').default(0),
  totalFiles: integer('total_files').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Valuations Table
 * Stores valuation configurations and results
 */
export const valuations = pgTable('valuations', {
  id: serial('id').primaryKey(),
  config: json('config').$type<z.infer<typeof valuationConfigSchema>>().notNull(),
  summary: json('summary').$type<{
    totalTracks: number;
    currentAnnualRevenue: number;
    totalStreams: number;
    projectedValue: number;
  }>().notNull(),
  projections: json('projections').$type<Array<{
    year: number;
    revenue: number;
  }>>().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Processed Files Table
 * Tracks individual file processing results
 */
export const processedFiles = pgTable('processed_files', {
  id: serial('id').primaryKey(),
  batchId: varchar('batch_id', { length: 50 })
    .notNull()
    .references(() => processingStatus.batchId),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  processingResult: json('processing_result').$type<{
    streams?: number;
    revenue?: number;
    platform?: string;
    period?: string;
    error?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Type Exports
 */
export type ProcessingStatusRow = typeof processingStatus.$inferSelect;
export type ValuationRow = typeof valuations.$inferSelect;
export type ProcessedFileRow = typeof processedFiles.$inferSelect;
