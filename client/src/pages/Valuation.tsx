import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import ValuationConfig from "@/components/ValuationConfig";
import ReportViewer from "@/components/ReportViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Valuation() {
  const [activeTab, setActiveTab] = useState("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete'>('idle');

  const handleFilesUploaded = (newFiles: File[]) => {
    setFiles(newFiles);
    setActiveTab("processing");
    setProcessingStatus('processing');
  };

  const handleProcessingComplete = () => {
    setProcessingStatus('complete');
    setActiveTab("config");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Catalog Valuation
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="upload">File Upload</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <FileUpload onFilesUploaded={handleFilesUploaded} />
          </TabsContent>

          <TabsContent value="processing">
            <ProcessingStatus 
              files={files}
              status={processingStatus}
              onComplete={handleProcessingComplete}
            />
          </TabsContent>

          <TabsContent value="config">
            <ValuationConfig />
          </TabsContent>

          <TabsContent value="report">
            <ReportViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
