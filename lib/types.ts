/**
 * Global Type Definitions
 * Central type definitions used throughout the application
 * @module lib/types
 */

/**
 * Processing status enumeration
 * Represents possible states of file processing
 */
export type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'error';

/**
 * Valuation configuration interface
 * Defines parameters for catalog valuation calculations
 */
export interface ValuationConfig {
  /** Spotify per-stream payout rate (0-1) */
  spotifyRate: number;
  /** Apple Music per-stream payout rate (0-1) */
  appleMusicRate: number;
  /** First year decay percentage (0-100) */
  yearOneDecay: number;
  /** Second year decay percentage (0-100) */
  yearTwoDecay: number;
  /** Third year decay percentage (0-100) */
  yearThreeDecay: number;
}

/**
 * Valuation report interface
 * Complete valuation results including projections
 */
export interface ValuationReport {
  /** Unique identifier for the valuation */
  id: number;
  /** Configuration used for calculations */
  config: ValuationConfig;
  /** Summary metrics */
  summary: {
    /** Total number of tracks in catalog */
    totalTracks: number;
    /** Current annual revenue */
    currentAnnualRevenue: number;
    /** Total streams across platforms */
    totalStreams: number;
    /** Total projected catalog value */
    projectedValue: number;
  };
  /** Year-by-year revenue projections */
  projections: Array<{
    /** Projection year */
    year: number;
    /** Projected revenue for the year */
    revenue: number;
  }>;
}

/**
 * Processing result interface
 * Results from file processing and data extraction
 */
export interface ProcessingResult {
  /** Number of streams extracted */
  streams?: number;
  /** Revenue amount extracted */
  revenue?: number;
  /** Streaming platform identifier */
  platform?: string;
  /** Time period for the data */
  period?: string;
  /** Error message if processing failed */
  error?: string;
}

/**
 * File processing status interface
 * Current state of file processing batch
 */
export interface ProcessingStatusInfo {
  /** Unique batch identifier */
  batchId: string;
  /** Current processing status */
  status: ProcessingStatus;
  /** Processing progress (0-100) */
  progress: number;
  /** Error message if applicable */
  error?: string;
  /** Number of files processed */
  filesProcessed: number;
  /** Total number of files in batch */
  totalFiles: number;
  /** Processing start timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * API response interfaces
 */

/** Upload response */
export interface UploadResponse {
  /** Processing batch identifier */
  batchId: string;
  /** Status message */
  message: string;
}

/** Error response */
export interface ErrorResponse {
  /** Error message */
  message: string;
  /** Additional error details */
  errors?: string[];
}

/** Valuation response */
export interface ValuationResponse {
  /** Valuation identifier */
  id: number;
  /** Status message */
  message: string;
  /** Valuation report data */
  report: ValuationReport;
}

/**
 * Component prop types
 */

/** File upload props */
export interface FileUploadProps {
  /** Callback when files are uploaded */
  onFilesUploaded: (files: File[]) => void;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed file types */
  acceptedTypes?: string[];
}

/** Processing status props */
export interface ProcessingStatusProps {
  /** Processing batch identifier */
  batchId: string;
  /** Callback when processing completes */
  onComplete: () => void;
}

/** Report viewer props */
export interface ReportViewerProps {
  /** Valuation identifier */
  valuationId: number;
  /** Callback when report is loaded */
  onLoad?: (report: ValuationReport) => void;
} 