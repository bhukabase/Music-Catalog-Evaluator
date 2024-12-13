import { ValuationConfig } from '@/lib/types';
import { db } from '@db/index';
import { valuations, processingStatus } from '@db/schema';
import { eq } from 'drizzle-orm';

interface StreamData {
  platform: string;
  streams: number;
  revenue: number;
  date: string;
}

interface ProjectionYear {
  year: number;
  revenue: number;
  decayRate: number;
}

export async function calculateValuation(config: ValuationConfig) {
  try {
    const streamData = await getStreamData();
    if (!Array.isArray(streamData) || streamData.length === 0) {
      throw new Error('No valid streaming data found. Please ensure files are processed correctly.');
    }
    
    const projections = calculateProjections(streamData, config);
    const summary = generateSummary(streamData, projections);
  
    // Store valuation results
    const valuation = await db.insert(valuations).values({
      config: config,
      summary: summary,
      projections: projections,
      createdAt: new Date()
    }).returning();

    return {
      id: valuation[0].id,
      config,
      summary,
      projections,
      createdAt: valuation[0].createdAt
    };
  } catch (error) {
    console.error('Valuation calculation error:', error);
    throw new Error(`Failed to calculate valuation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getStreamData(): Promise<StreamData[]> {
  try {
    // Get the latest completed processing batch
    const latestBatch = await db.query.processingStatus.findFirst({
      where: eq(processingStatus.status, 'complete'),
      orderBy: (processingStatus, { desc }) => [desc(processingStatus.completedAt)]
    });

    if (!latestBatch || !latestBatch.results) {
      throw new Error('No processed data available');
    }

    // Return results directly if it's already an object, or parse if it's a string
    return typeof latestBatch.results === 'string' 
      ? JSON.parse(latestBatch.results)
      : latestBatch.results as StreamData[];
  } catch (error) {
    console.error('Error getting stream data:', error);
    throw new Error(`Failed to get stream data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function calculateProjections(
  data: StreamData[], 
  config: ValuationConfig
): ProjectionYear[] {
  const baseRevenue = calculateBaseRevenue(data);
  const projections: ProjectionYear[] = [];
  let currentRevenue = baseRevenue;

  // Calculate 7-year projections
  for (let year = 0; year < 7; year++) {
    const decayRate = getDecayRate(year, config);
    currentRevenue *= (1 - decayRate / 100);

    projections.push({
      year: new Date().getFullYear() + year,
      revenue: Math.round(currentRevenue),
      decayRate
    });
  }

  return projections;
}

function calculateBaseRevenue(data: StreamData[]): number {
  // Group by platform and sum revenue
  const platformRevenue = data.reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + item.revenue;
    return acc;
  }, {} as Record<string, number>);

  // Return total annual revenue
  return Object.values(platformRevenue).reduce((a, b) => a + b, 0);
}

function getDecayRate(year: number, config: ValuationConfig): number {
  if (year < 2) {
    return config.yearOneDecay;
  } else if (year < 4) {
    return config.yearTwoDecay;
  } else {
    return config.yearThreeDecay;
  }
}

function generateSummary(data: StreamData[], projections: ProjectionYear[]) {
  const totalStreams = data.reduce((sum, item) => sum + item.streams, 0);
  const currentRevenue = projections[0].revenue;
  
  // Calculate projected value using NPV of future cash flows
  const discountRate = 0.1; // 10% discount rate
  const projectedValue = projections.reduce((sum, year, index) => {
    return sum + (year.revenue / Math.pow(1 + discountRate, index + 1));
  }, 0);

  return {
    totalTracks: new Set(data.map(item => item.date)).size, // Unique tracks
    currentRevenue,
    totalStreams,
    projectedValue: Math.round(projectedValue),
    platformBreakdown: calculatePlatformBreakdown(data)
  };
}

function calculatePlatformBreakdown(data: StreamData[]) {
  return data.reduce((acc, item) => {
    if (!acc[item.platform]) {
      acc[item.platform] = {
        streams: 0,
        revenue: 0
      };
    }
    acc[item.platform].streams += item.streams;
    acc[item.platform].revenue += item.revenue;
    return acc;
  }, {} as Record<string, { streams: number; revenue: number }>);
}
