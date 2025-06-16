export interface Plan {
  id: string;
  number: string;
  title: string;
  description?: string;
  category: string;
  pdfUrl: string;
  pdf_url?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  folderId?: string;
  folder_id?: string;
  version?: string;
  tasks?: number;
  currentVersion?: string;
  tags?: string[];
  date?: string;
  created_at?: string;
  lastModified?: string;
  updated_at?: string;
  dsaNumber?: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
  folders?: Folder[];
  plans: Plan[];
  isExpanded?: boolean;
} 