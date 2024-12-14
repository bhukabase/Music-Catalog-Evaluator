/**
 * Valuation Engine Service
 * Calculates music catalog valuations based on streaming data and decay rates
 * @module services/valuationEngine
 */

import { db } from '../../db';
import { valuations } from '../../db/schema';
import type { ValuationConfig } from '@/lib/types';

/**
 * Default projection parameters
 */
const PROJECTION_DEFAULTS = {
  YEARS: 10,
  INITIAL_STREAMS: 1000000, // Example initial streams
  GROWTH_RATE: 0.05, // 5% annual growth for new releases
};

/**
 * Interface for valuation calculation results
 */
interface ValuationResult {
  id: number;
  config: ValuationConfig;
  summary: {
    totalTracks: number;
    currentAnnualRevenue: number;
    totalStreams: number;
    projectedValue: number;
  };
  projections: Array<{
    year: number;
    revenue: number;
  }>;
}

/**
 * Calculates catalog valuation based on provided configuration
 * @param {ValuationConfig} config - Valuation parameters
 * @returns {Promise<ValuationResult>} Calculated valuation results
 */
export async function calculateValuation(config: ValuationConfig): Promise<ValuationResult> {
  try {
    // Calculate base metrics
    const baseMetrics = await calculateBaseMetrics();
    
    // Generate year-by-year projections
    const projections = generateProjections(config, baseMetrics);
    
    // Calculate total valuation
    const projectedValue = calculateTotalValue(projections);

    // Create result object
    const result: ValuationResult = {
      id: Date.now(), // Temporary ID, will be replaced by DB
      config,
      summary: {
        ...baseMetrics,
        projectedValue,
      },
      projections,
    };

    // Store results in database
    const [stored] = await db.insert(valuations).values(result).returning();
    result.id = stored.id;

    return result;
  } catch (error) {
    console.error('Valuation calculation error:', error);
    throw new Error('Failed to calculate valuation');
  }
}

/**
 * Calculates base metrics from processed streaming data
 * @returns {Promise<BaseMetrics>} Initial streaming metrics
 */
async function calculateBaseMetrics() {
  // TODO: Implement actual data aggregation from processed files
  return {
    totalTracks: 100, // Example value
    currentAnnualRevenue: 50000, // Example value
    totalStreams: PROJECTION_DEFAULTS.INITIAL_STREAMS,
  };
}

/**
 * Generates year-by-year revenue projections
 * @param {ValuationConfig} config - Valuation configuration
 * @param {BaseMetrics} baseMetrics - Initial metrics
 * @returns {Array<Projection>} Year-by-year projections
 */
function generateProjections(
  config: ValuationConfig,
  baseMetrics: { totalStreams: number; currentAnnualRevenue: number }
) {
  const projections = [];
  let currentRevenue = baseMetrics.currentAnnualRevenue;

  for (let year = 1; year <= PROJECTION_DEFAULTS.YEARS; year++) {
    // Apply appropriate decay rate based on year
    const decayRate = getDecayRate(year, config);
    
    // Calculate revenue after decay
    currentRevenue *= (1 - decayRate / 100);
    
    // Add growth from new releases
    currentRevenue *= (1 + PROJECTION_DEFAULTS.GROWTH_RATE);

    projections.push({
      year,
      revenue: Math.round(currentRevenue),
    });
  }

  return projections;
}

/**
 * Determines decay rate for a specific year
 * @param {number} year - Projection year
 * @param {ValuationConfig} config - Valuation configuration
 * @returns {number} Applicable decay rate
 */
function getDecayRate(year: number, config: ValuationConfig): number {
  if (year <= 2) return config.yearOneDecay;
  if (year <= 4) return config.yearTwoDecay;
  return config.yearThreeDecay;
}

/**
 * Calculates total catalog value from projections
 * @param {Array<Projection>} projections - Year-by-year projections
 * @returns {number} Total calculated value
 */
function calculateTotalValue(
  projections: Array<{ revenue: number }>
): number {
  // Simple sum of projected revenues
  // TODO: Implement more sophisticated NPV calculation
  return Math.round(
    projections.reduce((sum, year) => sum + year.revenue, 0)
  );
}
