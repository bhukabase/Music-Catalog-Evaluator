export interface ValuationConfig {
  spotifyRate: number;
  appleMusicRate: number;
  yearOneDecay: number;
  yearTwoDecay: number;
  yearThreeDecay: number;
}

export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export interface ValuationReport {
  summary: {
    totalTracks: number;
    currentRevenue: number;
    totalStreams: number;
    projectedValue: number;
  };
  projections: Array<{
    year: number;
    revenue: number;
  }>;
  topTracks: Array<{
    title: string;
    streams: number;
    revenue: number;
  }>;
}
