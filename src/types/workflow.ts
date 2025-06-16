import type { FormConfig } from '@/types/maintenance';

export interface StageSettings {
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