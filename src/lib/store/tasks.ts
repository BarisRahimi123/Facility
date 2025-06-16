import type { MaintenanceTask } from '@/types/maintenance';

// In-memory storage for tasks (in a real app, this would be a database)
export const tasks: MaintenanceTask[] = [
  {
    id: 'ye8dx0w1z',
    title: 'Clogged Drain',
    description: 'Main kitchen drain is clogged and needs immediate attention. Water is backing up in the sink.',
    type: 'corrective',
    priority: 'high',
    status: 'new',
    workflowStatus: 'new',
    startDate: new Date().toISOString(),
    estimatedDuration: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System',
    updatedBy: 'System',
    facilityId: 'facility-1',
    location: 'Main Kitchen',
    attachments: [],
    systemType: 'Plumbing',
    issueType: 'Drainage',
    impact: 'high',
    severity: 'high',
    assignmentType: 'contractor',
    assignedTo: 'plansrow'
  }
]; 