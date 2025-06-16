'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'file' | 'row';
  required: boolean;
  options?: string[];
  placeholder?: string;
  fields?: FormField[];
}

interface FormConfig {
  fields: FormField[];
  submitButtonText: string;
  successMessage: string;
  allowAttachments: boolean;
}

export default function FormPreviewPage() {
  const searchParams = useSearchParams();
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formType, setFormType] = useState<'internal' | 'contractor'>('internal');
  const [isLoading, setIsLoading] = useState(true);
  const [lineItemRows, setLineItemRows] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const type = searchParams.get('type') as 'internal' | 'contractor';
      const settings = JSON.parse(decodeURIComponent(searchParams.get('settings') || ''));
      
      setFormType(type);
      if (type === 'internal') {
        setFormConfig(settings.new.internalForm);
      } else {
        setFormConfig(settings.new.contractorForm);
      }

      // Initialize line item counts
      const initialLineItems: Record<string, number> = {};
      if (settings.new.contractorForm?.fields) {
        settings.new.contractorForm.fields.forEach((field: FormField) => {
          if (field.type === 'row' && field.label.toLowerCase().includes('line item')) {
            initialLineItems[field.id] = 1;
          }
        });
      }
      setLineItemRows(initialLineItems);
    } catch (error) {
      console.error('Error parsing form settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  const handleAddLineItem = (fieldId: string) => {
    setLineItemRows(prev => ({
      ...prev,
      [fieldId]: (prev[fieldId] || 1) + 1
    }));
  };

  const renderField = (field: FormField) => {
    if (field.type === 'row' && field.fields && field.fields.length > 0) {
      const numRows = lineItemRows[field.id] || 1;
      const rows = Array.from({ length: numRows }, (_, index) => index);

      return (
        <div key={field.id} className="space-y-4">
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="space-y-4">
            {rows.map((rowIndex) => (
              <div key={`${field.id}-row-${rowIndex}`} className="grid grid-cols-3 gap-4">
                {field.fields.map(subField => (
                  <div key={`${subField.id}-${rowIndex}`}>
                    {rowIndex === 0 && (
                      <label className="block text-sm font-medium mb-2">
                        {subField.label}
                        {subField.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    )}
                    <Input
                      type={subField.type === 'number' ? 'number' : 'text'}
                      placeholder={subField.placeholder}
                      required={subField.required}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            ))}
            {field.label.toLowerCase().includes('line item') && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleAddLineItem(field.id)}
              >
                + Add Line Item
              </Button>
            )}
          </div>
        </div>
      );
    }

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            required={field.required}
            className="w-full min-h-[100px]"
          />
        );
      
      case 'select':
        return (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'file':
        return (
          <Input
            type="file"
            required={field.required}
            className="w-full"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading form preview...</div>;
  }

  if (!formConfig) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>
          Failed to load form configuration. Please check the settings and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-blue-800 font-medium">Preview Mode</h2>
        <p className="text-blue-600 text-sm mt-1">
          This is a preview of the {formType === 'internal' ? 'internal team' : 'contractor'} form.
          Form submissions are disabled in preview mode.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-semibold mb-6">
          {formType === 'internal' ? 'Internal Issue Report' : 'Contractor Quote Form'}
        </h1>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {formConfig.fields.map((field) => (
            <div key={field.id}>
              {renderField(field)}
            </div>
          ))}

          <div className="pt-4">
            <Button type="submit" className="w-full">
              {formConfig.submitButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 