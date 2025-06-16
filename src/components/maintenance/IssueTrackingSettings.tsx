'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Link, Eye, Plus } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  showRequestInfoButton?: boolean;
  requestInfoButtonText?: string;
}

interface StageSettings {
  assignmentType: 'internal' | 'contractor';
  notifyByEmail: boolean;
  notifyBySMS: boolean;
  additionalActions: string;
  autoTransition: boolean;
  requiredFields: string[];
  internalForm?: FormConfig;
  contractorForm?: FormConfig;
  estimateSettings?: {
    autoApprovalThreshold?: number;
    requireMultipleEstimates: boolean;
    minimumEstimates: number;
    maxBudget?: number;
    reviewCriteria: {
      price: boolean;
      vendorRating: boolean;
      availability: boolean;
      completionTime: boolean;
    };
    notifications: {
      notifyOnSubmission: boolean;
      notifyApprovers: boolean;
      escalateAfterHours: number;
    };
    poGeneration: {
      autoGenerate: boolean;
      requireApproval: boolean;
      approvalWorkflow: 'single' | 'multi-level';
      approvers: string[];
    };
  };
  poSettings?: {
    approvalWorkflow: {
      enabled: boolean;
      requiredApprovals: number;
      escalateAfterHours: number;
      approvers: string[];
    };
    notifications: {
      notifyVendor: boolean;
      notifyApprovers: boolean;
      notifyOnApproval: boolean;
      escalateAfterHours: number;
    };
    documentSettings: {
      requireAttachments: boolean;
      allowedFileTypes: string[];
      maxFileSize: number;
    };
    termsAndConditions: {
      required: boolean;
      defaultTerms: string;
      allowCustomTerms: boolean;
    };
  };
}

interface IssueFormData {
  issueType: string | null;
  location: string | null;
  systemType: string | null;
  description: string | null;
  impact: string | null;
  severity: string | null;
}

const defaultSettings: Record<string, StageSettings> = {
  'new': {
    assignmentType: 'internal',
    notifyByEmail: true,
    notifyBySMS: false,
    additionalActions: '',
    autoTransition: false,
    requiredFields: ['title', 'description', 'priority', 'location', 'system'],
    internalForm: {
      fields: [
        {
          id: 'issueInfo',
          label: 'Issue Information',
          type: 'textarea',
          required: false,
          placeholder: 'Issue details will be displayed here (auto-populated)',
        },
        {
          id: 'impact',
          label: 'Impact',
          type: 'select',
          required: true,
          options: ['Low', 'Medium', 'High'],
          placeholder: 'Select the impact level'
        },
        {
          id: 'severity',
          label: 'Severity',
          type: 'select',
          required: true,
          options: ['Low', 'Medium', 'High'],
          placeholder: 'Select the severity level'
        },
        {
          id: 'startTime',
          label: 'Start Time',
          type: 'date',
          required: true,
          placeholder: 'When can you start working on this?'
        },
        {
          id: 'endTime',
          label: 'Expected Completion Time',
          type: 'date',
          required: true,
          placeholder: 'When do you expect to complete this?'
        },
        {
          id: 'totalHours',
          label: 'Estimated Hours',
          type: 'number',
          required: true,
          placeholder: 'How many hours will this take?'
        },
        {
          id: 'requiresPurchase',
          label: 'Requires Purchase',
          type: 'select',
          required: true,
          options: ['Yes', 'No'],
          placeholder: 'Will this require purchasing materials or equipment?'
        },
        {
          id: 'purchaseDetails',
          label: 'Purchase Details',
          type: 'textarea',
          required: false,
          placeholder: 'If purchase is required, please provide details of what needs to be purchased'
        }
      ],
      submitButtonText: 'Submit Internal Assessment',
      successMessage: 'Internal assessment submitted successfully',
      allowAttachments: true
    },
    contractorForm: {
      fields: [
        {
          id: 'issueInfo',
          label: 'Issue Information',
          type: 'textarea',
          required: false,
          placeholder: 'Issue details will be displayed here (auto-populated)',
        },
        {
          id: 'companyInfo',
          label: 'Company Information',
          type: 'row',
          required: true,
          fields: [
            {
              id: 'companyName',
              label: 'Company Name',
              type: 'text',
              required: true,
              placeholder: 'Your company name'
            },
            {
              id: 'contactInfo',
              label: 'Contact Information',
              type: 'text',
              required: true,
              placeholder: 'Phone and email'
            },
            {
              id: 'pointOfContact',
              label: 'Point of Contact',
              type: 'text',
              required: true,
              placeholder: 'Name of contact person'
            }
          ]
        },
        {
          id: 'lineItemsHeader',
          label: 'Line Items',
          type: 'row',
          required: true,
          fields: [
            {
              id: 'description',
              label: 'Description',
              type: 'text',
              required: true,
              placeholder: 'Item description'
            },
            {
              id: 'unit',
              label: 'Unit',
              type: 'text',
              required: true,
              placeholder: 'e.g., hours, pieces'
            },
            {
              id: 'unitCost',
              label: 'Unit Cost',
              type: 'number',
              required: true,
              placeholder: '0.00'
            }
          ]
        },
        {
          id: 'additionalQuestions',
          label: 'Additional Questions',
          type: 'textarea',
          required: false,
          placeholder: 'If you need any clarification or have questions, please list them here'
        },
        {
          id: 'digitalSignature',
          label: 'Digital Signature',
          type: 'text',
          required: true,
          placeholder: 'Type your full name as signature'
        }
      ],
      submitButtonText: 'Submit Estimate',
      successMessage: 'Estimate submitted successfully',
      allowAttachments: true,
      showRequestInfoButton: true,
      requestInfoButtonText: 'Have a Question?'
    }
  },
  'pending_estimate': {
    assignmentType: 'contractor',
    notifyByEmail: true,
    notifyBySMS: true,
    additionalActions: '',
    autoTransition: true,
    requiredFields: ['estimateForm', 'deadline']
  },
  'estimates_received': {
    assignmentType: 'internal',
    notifyByEmail: true,
    notifyBySMS: false,
    additionalActions: '',
    autoTransition: false,
    requiredFields: ['estimateReview', 'approvalStatus'],
    estimateSettings: {
      autoApprovalThreshold: 5000,
      requireMultipleEstimates: true,
      minimumEstimates: 2,
      maxBudget: 50000,
      reviewCriteria: {
        price: true,
        vendorRating: true,
        availability: true,
        completionTime: true
      },
      notifications: {
        notifyOnSubmission: true,
        notifyApprovers: true,
        escalateAfterHours: 48
      },
      poGeneration: {
        autoGenerate: false,
        requireApproval: true,
        approvalWorkflow: 'single',
        approvers: []
      }
    }
  },
  'po_issued': {
    assignmentType: 'internal',
    notifyByEmail: true,
    notifyBySMS: true,
    additionalActions: 'notifyVendor',
    autoTransition: false,
    requiredFields: ['poNumber', 'approvers'],
    poSettings: {
      approvalWorkflow: {
        enabled: true,
        requiredApprovals: 1,
        escalateAfterHours: 48,
        approvers: []
      },
      notifications: {
        notifyVendor: true,
        notifyApprovers: true,
        notifyOnApproval: true,
        escalateAfterHours: 24
      },
      documentSettings: {
        requireAttachments: true,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
        maxFileSize: 10 // in MB
      },
      termsAndConditions: {
        required: true,
        defaultTerms: '',
        allowCustomTerms: true
      }
    }
  }
};

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Select' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File Upload' }
];

const notificationLabels = {
  notifyVendor: 'Notify Vendor on PO Creation',
  notifyApprovers: 'Notify Approvers',
  notifyOnApproval: 'Notify on Final Approval'
} as const;

type BooleanNotificationKey = keyof typeof notificationLabels;

export default function IssueTrackingSettings() {
  const [settings, setSettings] = useState<Record<string, StageSettings>>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/workflow');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      const data = await response.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (stage: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [key]: value
      }
    }));

    // Save settings to API
    fetch('/api/settings/workflow', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stage,
        key,
        value
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    })
    .catch(error => {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    });
  };

  const populateIssueInfo = (formData: IssueFormData) => {
    const issueInfo = `
Issue Type: ${formData.issueType || 'N/A'}
Location: ${formData.location || 'N/A'}
System: ${formData.systemType || 'N/A'}
Description: ${formData.description || 'N/A'}
Impact: ${formData.impact || 'N/A'}
Severity: ${formData.severity || 'N/A'}
    `.trim();

    return issueInfo;
  };

  const handlePreviewForm = (formType: 'internal' | 'contractor') => {
    // Get URL parameters from the issue form
    const urlParams = new URLSearchParams(window.location.search);
    const formData = {
      issueType: urlParams.get('issueType'),
      location: urlParams.get('location'),
      systemType: urlParams.get('system'),
      description: urlParams.get('description'),
      impact: urlParams.get('impact'),
      severity: urlParams.get('severity'),
    };

    // Populate the issue info field
    const issueInfo = populateIssueInfo(formData);

    const baseUrl = window.location.origin;
    const previewUrl = `${baseUrl}/form-preview?type=${formType}&settings=${encodeURIComponent(JSON.stringify(settings))}&issueInfo=${encodeURIComponent(issueInfo)}`;
    window.open(previewUrl, '_blank');
    
    toast({
      title: "Preview Opened",
      description: "Form preview opened in a new tab",
    });
  };

  const handleCopyLink = (formType: 'internal' | 'contractor') => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/issue-form?type=${formType}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Form link has been copied to clipboard",
    });
  };

  const handleAddFormField = (stage: string, formType: 'internalForm' | 'contractorForm') => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: ''
    };

    setSettings(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [formType]: {
          ...prev[stage][formType],
          fields: [...(prev[stage][formType]?.fields || []), newField]
        }
      }
    }));
  };

  const handleFormFieldChange = (
    stage: string,
    formType: 'internalForm' | 'contractorForm',
    fieldId: string,
    updates: Partial<FormField>
  ) => {
    setSettings(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [formType]: {
          ...prev[stage][formType],
          fields: prev[stage][formType]?.fields.map(field =>
            field.id === fieldId ? { ...field, ...updates } : field
          )
        }
      }
    }));
  };

  const renderFormEditor = (stage: string, formType: 'internalForm' | 'contractorForm', title: string) => {
    const form = settings[stage]?.[formType];
    if (!form) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreviewForm(formType === 'internalForm' ? 'internal' : 'contractor')}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyLink(formType === 'internalForm' ? 'internal' : 'contractor')}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Link className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddFormField(stage, formType)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {form.fields.map((field) => (
            <div key={field.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Field Label</label>
                  <Input
                    value={field.label}
                    onChange={(e) => handleFormFieldChange(stage, formType, field.id, { label: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Field Type</label>
                  <Select
                    value={field.type}
                    onValueChange={(value) => handleFormFieldChange(stage, formType, field.id, { type: value as FormField['type'] })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Select field type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-gray-300">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Placeholder</label>
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => handleFormFieldChange(stage, formType, field.id, { placeholder: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                />
              </div>

              <div className="mt-4 flex items-center">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => handleFormFieldChange(stage, formType, field.id, { required: e.target.checked })}
                    className="mr-2 rounded border-gray-700 bg-gray-900 text-purple-600"
                  />
                  Required Field
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEstimateSettings = (stage: string) => {
    const estimateSettings = settings[stage]?.estimateSettings;
    if (!estimateSettings) return null;

    return (
      <div className="mt-6 border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Estimate Review Settings</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Auto-Approval Threshold ($)</label>
              <Input
                type="number"
                value={estimateSettings.autoApprovalThreshold}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setSettings(prev => ({
                    ...prev,
                    [stage]: {
                      ...prev[stage],
                      estimateSettings: {
                        ...prev[stage].estimateSettings!,
                        autoApprovalThreshold: value
                      }
                    }
                  }));
                }}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Maximum Budget ($)</label>
              <Input
                type="number"
                value={estimateSettings.maxBudget}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setSettings(prev => ({
                    ...prev,
                    [stage]: {
                      ...prev[stage],
                      estimateSettings: {
                        ...prev[stage].estimateSettings!,
                        maxBudget: value
                      }
                    }
                  }));
                }}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Multiple Estimates Requirements</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={estimateSettings.requireMultipleEstimates}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        estimateSettings: {
                          ...prev[stage].estimateSettings!,
                          requireMultipleEstimates: e.target.checked
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Require Multiple Estimates</span>
              </div>
              {estimateSettings.requireMultipleEstimates && (
                <div>
                  <label className="text-sm mr-2">Minimum Required:</label>
                  <Input
                    type="number"
                    value={estimateSettings.minimumEstimates}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setSettings(prev => ({
                        ...prev,
                        [stage]: {
                          ...prev[stage],
                          estimateSettings: {
                            ...prev[stage].estimateSettings!,
                            minimumEstimates: value
                          }
                        }
                      }));
                    }}
                    className="w-20 inline-block"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Review Criteria</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(estimateSettings.reviewCriteria).map(([criterion, enabled]) => (
                <div key={criterion} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        [stage]: {
                          ...prev[stage],
                          estimateSettings: {
                            ...prev[stage].estimateSettings!,
                            reviewCriteria: {
                              ...prev[stage].estimateSettings!.reviewCriteria,
                              [criterion]: e.target.checked
                            }
                          }
                        }
                      }));
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{criterion.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notifications</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={estimateSettings.notifications.notifyOnSubmission}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        estimateSettings: {
                          ...prev[stage].estimateSettings!,
                          notifications: {
                            ...prev[stage].estimateSettings!.notifications,
                            notifyOnSubmission: e.target.checked
                          }
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Notify on Estimate Submission</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={estimateSettings.notifications.notifyApprovers}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        estimateSettings: {
                          ...prev[stage].estimateSettings!,
                          notifications: {
                            ...prev[stage].estimateSettings!.notifications,
                            notifyApprovers: e.target.checked
                          }
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Notify Approvers</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Escalate After (hours):</label>
                <Input
                  type="number"
                  value={estimateSettings.notifications.escalateAfterHours}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        estimateSettings: {
                          ...prev[stage].estimateSettings!,
                          notifications: {
                            ...prev[stage].estimateSettings!.notifications,
                            escalateAfterHours: value
                          }
                        }
                      }
                    }));
                  }}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Purchase Order Generation</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={estimateSettings.poGeneration.autoGenerate}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        estimateSettings: {
                          ...prev[stage].estimateSettings!,
                          poGeneration: {
                            ...prev[stage].estimateSettings!.poGeneration,
                            autoGenerate: e.target.checked
                          }
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Auto-generate PO on Approval</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={estimateSettings.poGeneration.requireApproval}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        estimateSettings: {
                          ...prev[stage].estimateSettings!,
                          poGeneration: {
                            ...prev[stage].estimateSettings!.poGeneration,
                            requireApproval: e.target.checked
                          }
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Require Approval for PO</span>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Approval Workflow</label>
                <Select
                  value={estimateSettings.poGeneration.approvalWorkflow}
                  onValueChange={(value: 'single' | 'multi-level') => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        estimateSettings: {
                          ...prev[stage].estimateSettings!,
                          poGeneration: {
                            ...prev[stage].estimateSettings!.poGeneration,
                            approvalWorkflow: value
                          }
                        }
                      }
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Approver</SelectItem>
                    <SelectItem value="multi-level">Multi-level Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePreviewPO = (stage: string) => {
    const poSettings = settings[stage]?.poSettings;
    if (!poSettings) return;
    
    const baseUrl = window.location.origin;
    const previewUrl = `${baseUrl}/po-form-preview?settings=${encodeURIComponent(JSON.stringify(poSettings))}`;
    window.open(previewUrl, '_blank');
    
    toast({
      title: "Preview Opened",
      description: "PO form preview opened in a new tab",
    });
  };

  const renderPOSettings = (stage: string) => {
    const poSettings = settings[stage]?.poSettings;
    if (!poSettings) return null;

    return (
      <div className="space-y-6 mt-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Purchase Order Settings</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreviewPO(stage)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View PO Form
            </Button>
          </div>
          
          {/* Approval Workflow */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium">Approval Workflow</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={poSettings.approvalWorkflow.enabled}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        poSettings: {
                          ...prev[stage].poSettings!,
                          approvalWorkflow: {
                            ...prev[stage].poSettings!.approvalWorkflow,
                            enabled: e.target.checked
                          }
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Enable Approval Workflow</span>
              </div>
              
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-4">
                  <label className="text-sm">Required Approvals:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={poSettings.approvalWorkflow.requiredApprovals}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        [stage]: {
                          ...prev[stage],
                          poSettings: {
                            ...prev[stage].poSettings!,
                            approvalWorkflow: {
                              ...prev[stage].poSettings!.approvalWorkflow,
                              requiredApprovals: parseInt(e.target.value)
                            }
                          }
                        }
                      }));
                    }}
                    className="w-20 rounded border-gray-300"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="text-sm">Escalate After (hours):</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={poSettings.approvalWorkflow.escalateAfterHours}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        [stage]: {
                          ...prev[stage],
                          poSettings: {
                            ...prev[stage].poSettings!,
                            approvalWorkflow: {
                              ...prev[stage].poSettings!.approvalWorkflow,
                              escalateAfterHours: parseInt(e.target.value)
                            }
                          }
                        }
                      }));
                    }}
                    className="w-20 rounded border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium">Notifications</h4>
            <div className="space-y-2">
              {Object.entries(notificationLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={poSettings.notifications[key as BooleanNotificationKey]}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        [stage]: {
                          ...prev[stage],
                          poSettings: {
                            ...prev[stage].poSettings!,
                            notifications: {
                              ...prev[stage].poSettings!.notifications,
                              [key]: e.target.checked
                            }
                          }
                        }
                      }));
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Document Settings */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium">Document Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={poSettings.documentSettings.requireAttachments}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        poSettings: {
                          ...prev[stage].poSettings!,
                          documentSettings: {
                            ...prev[stage].poSettings!.documentSettings,
                            requireAttachments: e.target.checked
                          }
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Require Attachments</span>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="text-sm">Max File Size (MB):</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={poSettings.documentSettings.maxFileSize}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        poSettings: {
                          ...prev[stage].poSettings!,
                          documentSettings: {
                            ...prev[stage].poSettings!.documentSettings,
                            maxFileSize: parseInt(e.target.value)
                          }
                        }
                      }
                    }));
                  }}
                  className="w-20 rounded border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <h4 className="font-medium">Terms and Conditions</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={poSettings.termsAndConditions.required}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        poSettings: {
                          ...prev[stage].poSettings!,
                          termsAndConditions: {
                            ...prev[stage].poSettings!.termsAndConditions,
                            required: e.target.checked
                          }
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Require Terms and Conditions</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={poSettings.termsAndConditions.allowCustomTerms}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      [stage]: {
                        ...prev[stage],
                        poSettings: {
                          ...prev[stage].poSettings!,
                          termsAndConditions: {
                            ...prev[stage].poSettings!.termsAndConditions,
                            allowCustomTerms: e.target.checked
                          }
                        }
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Allow Custom Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      <Accordion type="single" collapsible className="space-y-4">
        {Object.entries(settings).map(([stage, stageSettings]) => (
          <AccordionItem
            key={stage}
            value={stage}
            className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-800/50 text-white">
              {stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Stage
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 border-t border-gray-700">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Assignment Type</label>
                    <Select
                      value={stageSettings.assignmentType}
                      onValueChange={(value) => handleSettingChange(stage, 'assignmentType', value)}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Select assignment type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="internal" className="text-gray-300">Internal</SelectItem>
                        <SelectItem value="contractor" className="text-gray-300">Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Required Fields</label>
                    <Select
                      value={stageSettings.requiredFields[0] || ''}
                      onValueChange={(value) => handleSettingChange(stage, 'requiredFields', [value])}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Select required fields" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="title" className="text-gray-300">Title</SelectItem>
                        <SelectItem value="description" className="text-gray-300">Description</SelectItem>
                        <SelectItem value="priority" className="text-gray-300">Priority</SelectItem>
                        <SelectItem value="location" className="text-gray-300">Location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={stageSettings.notifyByEmail}
                        onChange={(e) => handleSettingChange(stage, 'notifyByEmail', e.target.checked)}
                        className="mr-2 rounded border-gray-700 bg-gray-900 text-purple-600"
                      />
                      <label className="text-sm font-medium text-gray-300">Email Notifications</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={stageSettings.notifyBySMS}
                        onChange={(e) => handleSettingChange(stage, 'notifyBySMS', e.target.checked)}
                        className="mr-2 rounded border-gray-700 bg-gray-900 text-purple-600"
                      />
                      <label className="text-sm font-medium text-gray-300">SMS Notifications</label>
                    </div>
                  </div>
                </div>

                {stageSettings.internalForm && (
                  <div className="mt-8">
                    {renderFormEditor(stage, 'internalForm', 'Internal Assessment Form')}
                  </div>
                )}

                {stageSettings.contractorForm && (
                  <div className="mt-8">
                    {renderFormEditor(stage, 'contractorForm', 'Contractor Assessment Form')}
                  </div>
                )}

                {stage === 'estimates_received' && renderEstimateSettings(stage)}
                {stage === 'po_issued' && renderPOSettings(stage)}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 