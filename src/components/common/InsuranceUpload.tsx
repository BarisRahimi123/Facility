'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, Calendar, DollarSign, AlertTriangle, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { uploadInsuranceDocument, getInsuranceDocuments, deleteInsuranceDocument, InsuranceDocument } from '@/app/actions/insurance';
import { toast } from 'sonner';

interface InsuranceUploadProps {
  entityType: 'organization' | 'user';
  entityId: string;
  onDocumentsChange?: (documents: InsuranceDocument[]) => void;
  className?: string;
}

export default function InsuranceUpload({ 
  entityType, 
  entityId, 
  onDocumentsChange,
  className = '' 
}: InsuranceUploadProps) {
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state for new document
  const [formData, setFormData] = useState({
    document_type: 'liability' as 'liability' | 'property' | 'workers_comp' | 'certificate' | 'other',
    document_name: '',
    coverage_amount: '',
    expiry_date: '',
    notes: '',
    file: null as File | null
  });

  // Load existing documents
  useEffect(() => {
    if (entityId) {
      loadDocuments();
    }
  }, [entityId, entityType]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const result = await getInsuranceDocuments(entityType, entityId);
      
      if (result.error) {
        console.error('Error loading documents:', result.error);
        return;
      }

      const docs = result.data as InsuranceDocument[] || [];
      setDocuments(docs);
      onDocumentsChange?.(docs);
    } catch (error) {
      console.error('Error loading insurance documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, JPEG, or PNG files only.');
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }

      setFormData(prev => ({ ...prev, file }));
      
      // Auto-fill document name from filename if empty
      if (!formData.document_name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, document_name: nameWithoutExt }));
      }
    }
  };

  const handleUpload = async () => {
    if (!formData.file || !formData.document_name) {
      toast.error('Please select a file and enter a document name');
      return;
    }

    setIsUploading(true);

    try {
      const uploadData = {
        entity_type: entityType,
        entity_id: entityId,
        document_type: formData.document_type,
        document_name: formData.document_name,
        file: formData.file,
        coverage_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : undefined,
        expiry_date: formData.expiry_date || undefined,
        notes: formData.notes || undefined
      };

      const result = await uploadInsuranceDocument(uploadData);

      if (result.error) {
        toast.error(`Upload failed: ${result.error}`);
        return;
      }

      toast.success('Insurance document uploaded successfully!');
      
      // Reset form
      setFormData({
        document_type: 'liability',
        document_name: '',
        coverage_amount: '',
        expiry_date: '',
        notes: '',
        file: null
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload documents
      await loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteInsuranceDocument(docId);
    
    if (result.error) {
      toast.error(`Failed to delete document: ${result.error}`);
      return;
    }

    toast.success('Document deleted successfully');
    await loadDocuments();
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'liability': return 'General Liability';
      case 'property': return 'Property Insurance';
      case 'workers_comp': return 'Workers Compensation';
      case 'certificate': return 'Certificate of Insurance';
      case 'other': return 'Other Insurance';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      case 'expired': return <Calendar className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const isDocumentExpiring = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return expiry > now && expiry <= nextMonth;
  };

  const isDocumentExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) <= new Date();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Insurance Documents</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Upload insurance certificates and related documents. Accepted formats: PDF, JPEG, PNG (max 10MB)
        </p>
      </div>

      {/* Upload Form */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload New Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="document_type" className="text-gray-700 dark:text-gray-300">Document Type *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, document_type: value }))}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="liability" className="dark:text-white">General Liability</SelectItem>
                  <SelectItem value="property" className="dark:text-white">Property Insurance</SelectItem>
                  <SelectItem value="workers_comp" className="dark:text-white">Workers Compensation</SelectItem>
                  <SelectItem value="certificate" className="dark:text-white">Certificate of Insurance</SelectItem>
                  <SelectItem value="other" className="dark:text-white">Other Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <Label htmlFor="document_name" className="text-gray-700 dark:text-gray-300">Document Name *</Label>
              <Input
                id="document_name"
                type="text"
                value={formData.document_name}
                onChange={(e) => setFormData(prev => ({ ...prev, document_name: e.target.value }))}
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                placeholder="e.g., General Liability Certificate 2024"
              />
            </div>

            {/* Coverage Amount */}
            <div className="space-y-2">
              <Label htmlFor="coverage_amount" className="text-gray-700 dark:text-gray-300">Coverage Amount ($)</Label>
              <Input
                id="coverage_amount"
                type="number"
                value={formData.coverage_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, coverage_amount: e.target.value }))}
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                placeholder="e.g., 1000000"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiry_date" className="text-gray-700 dark:text-gray-300">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              placeholder="Additional notes about this insurance document..."
              rows={2}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file" className="text-gray-700 dark:text-gray-300">File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
              {formData.file && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {formData.file.name}
                </Badge>
              )}
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !formData.file || !formData.document_name}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Documents */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading documents...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Uploaded Documents</h4>
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <FileText className="w-8 h-8 text-blue-500 dark:text-blue-400 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 dark:text-white truncate">
                          {doc.document_name}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getDocumentTypeLabel(doc.document_type)}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          {/* Status */}
                          <Badge className={getStatusColor(doc.status)}>
                            {getStatusIcon(doc.status)}
                            <span className="ml-1 capitalize">{doc.status}</span>
                          </Badge>

                          {/* Coverage Amount */}
                          {doc.coverage_amount && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <DollarSign className="w-4 h-4" />
                              ${doc.coverage_amount.toLocaleString()}
                            </div>
                          )}

                          {/* Expiry Date */}
                          {doc.expiry_date && (
                            <div className={`flex items-center gap-1 text-sm ${
                              isDocumentExpired(doc.expiry_date) 
                                ? 'text-red-600 dark:text-red-400' 
                                : isDocumentExpiring(doc.expiry_date)
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              <Calendar className="w-4 h-4" />
                              {new Date(doc.expiry_date).toLocaleDateString()}
                              {isDocumentExpired(doc.expiry_date) && (
                                <Badge variant="destructive" className="ml-1 text-xs">Expired</Badge>
                              )}
                              {isDocumentExpiring(doc.expiry_date) && !isDocumentExpired(doc.expiry_date) && (
                                <Badge variant="outline" className="ml-1 text-xs text-yellow-600 border-yellow-600">Expiring Soon</Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {doc.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {doc.notes}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id, doc.document_name)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No documents uploaded</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload your first insurance document to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 