export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  buildingId: string;
}

export const ROOM_FUNCTIONS = {
  Classroom: 'Classroom',
  Office: 'Office',
  Laboratory: 'Laboratory',
  Conference: 'Conference',
  Storage: 'Storage',
  Utility: 'Utility',
  Other: 'Other',
} as const;

export const SYSTEM_TYPES = {
  HVAC: 'HVAC',
  Electrical: 'Electrical',
  Plumbing: 'Plumbing',
  FireSafety: 'FireSafety',
  Security: 'Security',
  IT: 'IT',
  Other: 'Other',
} as const;

export const SYSTEM_CONDITIONS = {
  Excellent: 'Excellent',
  Good: 'Good',
  Fair: 'Fair',
  Poor: 'Poor',
  Critical: 'Critical',
} as const;

export type RoomFunction = typeof ROOM_FUNCTIONS[keyof typeof ROOM_FUNCTIONS];
export type SystemType = typeof SYSTEM_TYPES[keyof typeof SYSTEM_TYPES];
export type SystemCondition = typeof SYSTEM_CONDITIONS[keyof typeof SYSTEM_CONDITIONS];

export interface RoomData {
  number: string;
  function: RoomFunction;
  squareFootage: number;
  floorNumber: number;
  capacity: number;
}

export interface SystemData {
  type: SystemType;
  condition: SystemCondition;
  installationDate: string;
  lastMaintenanceDate: string;
}

export interface RenovationData {
  scope_of_work: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  contractor: string;
}

export interface FileData {
  files: File[];
} 