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

const mockData = {
  summary: {
    totalTracks: 150,
    currentRevenue: 250000,
    totalStreams: 15000000,
    projectedValue: 2500000
  },
  projections: [
    { year: 2024, revenue: 250000 },
    { year: 2025, revenue: 175000 },
    { year: 2026, revenue: 140000 },
    { year: 2027, revenue: 112000 },
    { year: 2028, revenue: 100800 },
    { year: 2029, revenue: 90720 },
    { year: 2030, revenue: 81648 },
  ]
};

export default function ReportViewer() {
  const handleDownloadPDF = () => {
    // Implement PDF download
    console.log("Downloading PDF...");
  };

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
          <div className="text-2xl font-bold">{mockData.summary.totalTracks}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">Current Annual Revenue</div>
          <div className="text-2xl font-bold">
            ${mockData.summary.currentRevenue.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Streams</div>
          <div className="text-2xl font-bold">
            {(mockData.summary.totalStreams / 1000000).toFixed(1)}M
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">Projected Value</div>
          <div className="text-2xl font-bold text-primary">
            ${mockData.summary.projectedValue.toLocaleString()}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Projections</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData.projections}>
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
            {mockData.projections.map((year) => (
              <TableRow key={year.year}>
                <TableCell>{year.year}</TableCell>
                <TableCell className="text-right">
                  ${year.revenue.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {((1 - year.revenue / mockData.projections[0].revenue) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
