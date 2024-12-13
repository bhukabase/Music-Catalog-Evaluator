import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Music Catalog Valuation Tool
          </h1>
          <p className="text-xl text-gray-600">
            Calculate the value of your music catalog using AI-powered analysis
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Valuation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Upload your royalty statements and get an instant valuation
              </p>
              <Button 
                onClick={() => setLocation('/valuation/new')}
                className="w-full"
              >
                Start New Valuation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• AI-powered document analysis</li>
                <li>• Multiple file format support</li>
                <li>• Detailed revenue projections</li>
                <li>• Professional PDF reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
