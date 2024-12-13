import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from 'zod';

// Processing status table
export const processingStatus = pgTable("processing_status", {
  id: serial("id").primaryKey(),
  batchId: text("batch_id").unique().notNull(),
  status: text("status", { enum: ['pending', 'processing', 'complete', 'error'] }).notNull(),
  progress: integer("progress").notNull().default(0),
  error: text("error"),
  results: jsonb("results"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  completedAt: timestamp("completed_at")
});

// Valuations table
export const valuations = pgTable("valuations", {
  id: serial("id").primaryKey(),
  config: jsonb("config").notNull(),
  summary: jsonb("summary").notNull(),
  projections: jsonb("projections").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  isArchived: boolean("is_archived").notNull().default(false)
});

// Create Zod schemas for type safety
export const insertProcessingStatusSchema = createInsertSchema(processingStatus);
export const selectProcessingStatusSchema = createSelectSchema(processingStatus);

export const insertValuationSchema = createInsertSchema(valuations);
export const selectValuationSchema = createSelectSchema(valuations);

// Extend schemas with custom validation
export const valuationConfigSchema = z.object({
  spotifyRate: z.number().min(0).max(1),
  appleMusicRate: z.number().min(0).max(1),
  yearOneDecay: z.number().min(0).max(100),
  yearTwoDecay: z.number().min(0).max(100),
  yearThreeDecay: z.number().min(0).max(100)
});

export type ValuationConfig = z.infer<typeof valuationConfigSchema>;
