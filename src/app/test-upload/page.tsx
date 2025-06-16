'use client';

import { useState } from 'react';
import { uploadDocument } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';

export default function TestUploadPage() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testUpload = async () => {
    try {
      setStatus('Starting test...');
      setError('');

      // Create a test file
      const testContent = 'This is a test file for debugging uploads.';
      const testFile = new File([testContent], 'test-document.txt', { type: 'text/plain' });

      // Create form data
      const formData = new FormData();
      formData.append('facilityId', 'e886edaf-0e7b-40b4-9a79-074ab496013a'); // Kabul facility
      formData.append('name', 'Test Document');
      formData.append('description', 'Test upload from debug page');
      formData.append('category', 'General');
      formData.append('tags', 'test, debug');
      formData.append('file', testFile);

      setStatus('Uploading file...');

      const result = await uploadDocument(formData);

      if (result.error) {
        setError(`Upload failed: ${result.error}`);
        setStatus('Failed');
      } else {
        setStatus('Upload successful! Document ID: ' + result.data?.id);
      }
    } catch (err) {
      setError(`Exception: ${err}`);
      setStatus('Failed with exception');
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Document Upload Test</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg space-y-4">
          <div>
            <p className="text-sm text-gray-400">This page tests document upload functionality for facilities.</p>
            <p className="text-sm text-gray-400">It will upload a test file to the Kabul facility.</p>
          </div>

          <Button 
            onClick={testUpload}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Test Upload
          </Button>

          {status && (
            <div className="mt-4">
              <p className="text-sm font-medium text-white">Status:</p>
              <p className="text-sm text-gray-300">{status}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 rounded">
              <p className="text-sm font-medium text-red-300">Error:</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Check the browser console and server logs for detailed debugging information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 