import { ValuationConfig } from './types';

const API_BASE = '/api';

export async function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

export async function getProcessingStatus(batchId: string) {
  const response = await fetch(`${API_BASE}/processing/${batchId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get processing status');
  }

  return response.json();
}

export async function submitValuationConfig(config: ValuationConfig) {
  const response = await fetch(`${API_BASE}/valuation/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    throw new Error('Failed to submit configuration');
  }

  return response.json();
}

export async function generateReport(valuationId: string) {
  const response = await fetch(`${API_BASE}/valuation/${valuationId}/report`);

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  return response.json();
}
