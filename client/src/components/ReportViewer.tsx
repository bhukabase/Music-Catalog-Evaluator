/**
 * Report Viewer Component
 * Displays valuation results with interactive charts and detailed breakdowns
 * @module components/ReportViewer
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2, Download, RefreshCw, ArrowLeft } from "lucide-react";

/**
 * Valuation report data structure
 */
interface ValuationReport {
  id: number;
  config: {
    spotifyRate: number;
    appleMusicRate: number;
    yearOneDecay: number;
    yearTwoDecay: number;
    yearThreeDecay: number;
  };
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
 * ReportViewer Component
 * Fetches and displays comprehensive valuation report with visualizations
 * @returns {JSX.Element} Rendered component
 */
export default function ReportViewer() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [report, setReport] = useState<ValuationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Fetches report data from the API
   */
  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/valuation/${id}/report`);
      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to fetch report');
      }
      const data = await response.json();
      setReport(data);
      setError(null);
    } catch (error) {
      console.error('Report fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load report');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  /**
   * Handles report refresh
   */
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchReport();
  };

  /**
   * Exports report data as CSV
   */
  const handleExport = () => {
    if (!report) return;

    const rows = [
      ['Year', 'Revenue', 'Decay Rate'],
      ...report.projections.map(year => [
        year.year,
        year.revenue,
        ((1 - year.revenue / report.projections[0].revenue) * 100).toFixed(1) + '%'
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(row => row.join(',')).join('\n');
    
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `valuation-report-${id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading report...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error: {error || 'Report not found'}</p>
          <Button onClick={() => setLocation('/valuation/config')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Configuration
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation and actions */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/valuation/config')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Configuration
        </Button>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary metrics card */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Valuation Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Tracks</h3>
            <p className="text-2xl font-semibold">{report.summary.totalTracks}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Current Annual Revenue</h3>
            <p className="text-2xl font-semibold">
              ${report.summary.currentAnnualRevenue.toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Streams</h3>
            <p className="text-2xl font-semibold">
              {report.summary.totalStreams.toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Projected Value</h3>
            <p className="text-2xl font-semibold text-primary">
              ${report.summary.projectedValue.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Revenue projection chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Projections</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={report.projections}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Year', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                label={{ 
                  value: 'Revenue ($)', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: 10
                }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Yearly breakdown table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Yearly Breakdown</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Projected Revenue</TableHead>
              <TableHead className="text-right">Decay Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.projections.map((year) => (
              <TableRow key={year.year}>
                <TableCell>{year.year}</TableCell>
                <TableCell className="text-right">
                  ${year.revenue.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {((1 - year.revenue / report.projections[0].revenue) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}