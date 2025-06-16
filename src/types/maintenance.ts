export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  specialties: string[];
  rating: number;
  isApproved: boolean;
}

export interface PurchaseOrderAssignment {
  id?: string;
  email?: string;
  phone?: string;
  role: 'assignee' | 'approver' | 'observer';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  maintenanceId: string;
  vendorId: string;
  estimateId?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  requestedBy: string;
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  completedDate?: string;
  cancelledDate?: string;
  notes?: string;
  attachments?: string[];
  assignments?: PurchaseOrderAssignment[];
  paymentTerms?: string;
  paymentStatus?: 'pending' | 'partial' | 'paid';
  invoiceNumber?: string;
  warrantyInformation?: string;
}

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface POApproval {
  id: string;
  poId: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp: string;
}

export interface RequestForQuote {
  id: string;
  taskId: string;
  status: 'draft' | 'sent' | 'responded' | 'expired' | 'cancelled';
  title: string;
  description: string;
  scope: string;
  requiredCompletionDate?: string;
  vendorIds: string[];
  submissionIds?: Record<string, string>;
  sentDate?: string;
  dueDate: string;
  attachments?: string[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  estimates?: VendorEstimate[];
}

export interface VendorEstimate {
  id: string;
  rfqId: string;
  vendorId: string;
  submissionId: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  totalAmount: number;
  estimatedDuration: number;
  availabilityDate: string;
  expiryDate: string;
  lineItems: EstimateLineItem[];
  terms?: string;
  notes?: string;
  attachments?: string[];
  submittedAt: string;
}

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface ServiceLineItem {
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
}

export interface ContractorQuote {
  contractorId: string;
  startDate: string;
  endDate: string;
  lineItems: ServiceLineItem[];
  totalCost: number;
  notes: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  type: 'corrective' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  workflowStatus: 'new' | 'pending_estimate' | 'estimates_received' | 'estimate_accepted' | 'po_issued' | 'in_progress' | 'completed';
  startDate: string;
  estimatedDuration: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  facilityId: string;
  buildingId?: string;
  roomId?: string;
  location: string;
  attachments: File[];
  assignmentType?: 'internal' | 'contractor';
  assignedTo?: string;
  endDate?: string;
  completedAt?: string;
  cancelledAt?: string;
  notes?: string;
  contractorQuote?: ContractorQuote;
  requestForQuotes?: RequestForQuote[];
  selectedEstimate?: VendorEstimate;
  purchaseOrders?: PurchaseOrder[];
  // Form submission fields
  systemType?: string;
  issueType?: string;
  impact?: 'low' | 'medium' | 'high';
  severity?: 'low' | 'medium' | 'high';
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'file' | 'row';
  required: boolean;
  options?: string[];
  placeholder?: string;
  fields?: FormField[];
}

export interface FormConfig {
  fields: FormField[];
  submitButtonText: string;
  successMessage: string;
  allowAttachments: boolean;
  showRequestInfoButton?: boolean;
  requestInfoButtonText?: string;
}