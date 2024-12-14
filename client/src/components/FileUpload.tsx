/**
 * File Upload Component
 * Handles file selection, validation, and upload processing
 * @module components/FileUpload
 */

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

/**
 * Props interface for FileUpload component
 * @interface FileUploadProps
 */
interface FileUploadProps {
  /** Callback function triggered when files are successfully uploaded */
  onFilesUploaded: (files: File[]) => void;
}

/**
 * FileUpload Component
 * Provides drag-and-drop and click-to-upload functionality with progress tracking
 * @param {FileUploadProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  /** State for tracking selected files */
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  /** State for tracking upload progress */
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Handles files dropped or selected
   * Validates file size and adds to upload queue
   * @param {File[]} acceptedFiles - Array of files selected by user
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    const validFiles = acceptedFiles.filter(file => {
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      if (!isValidSize) {
        console.warn(`File ${file.name} exceeds 50MB limit`);
      }
      return isValidSize;
    });
    setUploadedFiles((prev) => [...prev, ...validFiles]);
  }, []);

  /** Configure dropzone with file type restrictions and handlers */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'application/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  /**
   * Removes file from upload queue
   * @param {number} index - Index of file to remove
   */
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Initiates file upload process
   * Handles upload progress and error states
   */
  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    try {
      setUploadProgress(10);
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      console.log('Uploading files:', uploadedFiles.map(f => f.name));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      console.log('Upload successful:', data);
      localStorage.setItem('currentBatchId', data.batchId);
      setUploadProgress(100);
      onFilesUploaded(uploadedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(0);
      alert(error instanceof Error ? error.message : 'Failed to upload files. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center hover:border-primary cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M24 14v14m-7-7h14"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-gray-500">
            CSV, PDF, PNG, JPG up to 50MB
          </p>
        </div>
      </div>

      {/* File list and upload controls */}
      {uploadedFiles.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {uploadProgress > 0 && (
            <Progress value={uploadProgress} className="mt-4" />
          )}

          <Button
            onClick={handleUpload}
            className="mt-4 w-full"
            disabled={uploadProgress > 0}
          >
            {uploadProgress > 0 ? 'Uploading...' : 'Process Files'}
          </Button>
        </Card>
      )}
    </div>
  );
}
