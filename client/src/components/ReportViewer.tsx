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

import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { ValuationReport } from "@/lib/types";

export default function ReportViewer() {
  const { id } = useParams();
  const [report, setReport] = useState<ValuationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/valuation/${id}/report`);
        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('Error fetching report:', error);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchReport();
    }
  }, [id]);

  const handleDownloadPDF = () => {
    // Implement PDF download
    console.log("Downloading PDF...");
  };

  if (loading) {
    return <div>Loading report...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!report) {
    return <div>No report data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Valuation Report</h2>
        <Button onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Tracks</div>
          <div className="text-2xl font-bold">{report.summary.totalTracks}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">Current Annual Revenue</div>
          <div className="text-2xl font-bold">
            ${report.summary.currentRevenue.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Streams</div>
          <div className="text-2xl font-bold">
            {(report.summary.totalStreams / 1000000).toFixed(1)}M
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">Projected Value</div>
          <div className="text-2xl font-bold text-primary">
            ${report.summary.projectedValue.toLocaleString()}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Projections</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report.projections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

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