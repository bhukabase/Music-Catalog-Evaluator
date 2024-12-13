import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProcessingStatusProps {
  files: File[];
  status: 'idle' | 'processing' | 'complete';
  onComplete: () => void;
}

export default function ProcessingStatus({
  files,
  status,
  onComplete
}: ProcessingStatusProps) {
  const steps = [
    { id: 'validation', label: 'File Validation', progress: 0 },
    { id: 'ocr', label: 'OCR Processing', progress: 0 },
    { id: 'extraction', label: 'Data Extraction', progress: 0 },
    { id: 'analysis', label: 'Analysis', progress: 0 }
  ];

  useEffect(() => {
    if (status === 'processing') {
      // Simulate processing steps
      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep >= steps.length) {
          clearInterval(interval);
          onComplete();
          return;
        }

        steps[currentStep].progress = 100;
        currentStep++;
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Processing Status</h2>

        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.id}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{step.label}</span>
                <span className="text-sm text-gray-500">{step.progress}%</span>
              </div>
              <Progress value={step.progress} />
            </div>
          ))}
        </div>

        {status === 'processing' && (
          <p className="mt-6 text-sm text-gray-600">
            Processing {files.length} file(s)...
          </p>
        )}
      </Card>
    </div>
  );
}
