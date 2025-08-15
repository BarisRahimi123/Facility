'use server';

import { revalidatePath } from 'next/cache';
import { getServiceRoleClient } from '@/lib/supabase/server';

export interface DocumentFolder {
  id: string;
  facility_id?: string;
  building_id?: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parent_folder_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateFolderData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_folder_id?: string;
  sort_order?: number;
}



export async function getFolders(entityId: string, entityType: 'building' | 'facility' = 'facility') {
  const serviceRoleClient = getServiceRoleClient();

  const columnName = entityType === 'facility' ? 'facility_id' : 'building_id';
  
  const { data, error } = await serviceRoleClient
    .from('document_folders')
    .select('*')
    .eq(columnName, entityId)
    .is('parent_folder_id', null) // Only get top-level folders
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching folders:', error);
    return [];
  }

  return data || [];
}

export async function getSubfolders(parentFolderId: string) {
  const serviceRoleClient = getServiceRoleClient();
  
  const { data, error } = await serviceRoleClient
    .from('document_folders')
    .select('*')
    .eq('parent_folder_id', parentFolderId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching subfolders:', error);
    return [];
  }

  return data || [];
}

export async function getFolderDocuments(folderId: string) {
  const serviceRoleClient = getServiceRoleClient();
  
  const { data, error } = await serviceRoleClient
    .from('documents')
    .select('*')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching folder documents:', error);
    return [];
  }

  return data || [];
}

export async function createFolder(entityId: string, entityType: 'building' | 'facility', folderData: CreateFolderData) {
  const serviceRoleClient = getServiceRoleClient();

  if (!entityId || !folderData.name) {
    return { error: 'Missing required fields' };
  }

  const columnName = entityType === 'facility' ? 'facility_id' : 'building_id';
  
  // Get the next sort order
  const { data: existingFolders } = await serviceRoleClient
    .from('document_folders')
    .select('sort_order')
    .eq(columnName, entityId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = existingFolders && existingFolders.length > 0 
    ? existingFolders[0].sort_order + 1 
    : 1;

  const folderCreateData = {
    [columnName]: entityId,
    name: folderData.name,
    description: folderData.description || null,
    color: folderData.color || '#007aff',
    icon: folderData.icon || 'folder',
    parent_folder_id: folderData.parent_folder_id || null,
    sort_order: folderData.sort_order || nextSortOrder,
  };

  const { data, error } = await serviceRoleClient
    .from('document_folders')
    .insert(folderCreateData)
    .select()
    .single();

  if (error) {
    console.error('Error creating folder:', error);
    return { error: `Failed to create folder: ${error.message}` };
  }

  revalidatePath('/');
  return { data };
}

export async function updateFolder(folderId: string, folderData: Partial<CreateFolderData>) {
  const serviceRoleClient = getServiceRoleClient();

  if (!folderId) {
    return { error: 'Folder ID is required' };
  }

  const { data, error } = await serviceRoleClient
    .from('document_folders')
    .update(folderData)
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating folder:', error);
    return { error: `Failed to update folder: ${error.message}` };
  }

  revalidatePath('/');
  return { data };
}

export async function deleteFolder(folderId: string) {
  const serviceRoleClient = getServiceRoleClient();

  if (!folderId) {
    return { error: 'Folder ID is required' };
  }

  // Check if folder has documents or subfolders
  const { data: documents } = await serviceRoleClient
    .from('documents')
    .select('id')
    .eq('folder_id', folderId)
    .limit(1);

  const { data: subfolders } = await serviceRoleClient
    .from('document_folders')
    .select('id')
    .eq('parent_folder_id', folderId)
    .limit(1);

  if (documents && documents.length > 0) {
    return { error: 'Cannot delete folder that contains documents. Please move or delete documents first.' };
  }

  if (subfolders && subfolders.length > 0) {
    return { error: 'Cannot delete folder that contains subfolders. Please move or delete subfolders first.' };
  }

  const { error } = await serviceRoleClient
    .from('document_folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    console.error('Error deleting folder:', error);
    return { error: `Failed to delete folder: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

export async function moveDocumentToFolder(documentId: string, folderId: string | null) {
  const serviceRoleClient = getServiceRoleClient();

  if (!documentId) {
    return { error: 'Document ID is required' };
  }

  const { data, error } = await serviceRoleClient
    .from('documents')
    .update({ folder_id: folderId })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('Error moving document:', error);
    return { error: `Failed to move document: ${error.message}` };
  }

  revalidatePath('/');
  return { data };
}

export async function updateFolderOrder(folderId: string, newSortOrder: number) {
  const serviceRoleClient = getServiceRoleClient();

  if (!folderId) {
    return { error: 'Folder ID is required' };
  }

  const { data, error } = await serviceRoleClient
    .from('document_folders')
    .update({ sort_order: newSortOrder })
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating folder order:', error);
    return { error: `Failed to update folder order: ${error.message}` };
  }

  revalidatePath('/');
  return { data };
}

export async function getAvailableFolders(entityId: string, entityType: 'building' | 'facility' = 'facility') {
  const serviceRoleClient = getServiceRoleClient();

  const columnName = entityType === 'facility' ? 'facility_id' : 'building_id';
  
  const { data, error } = await serviceRoleClient
    .from('document_folders')
    .select('id, name, parent_folder_id')
    .eq(columnName, entityId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching available folders:', error);
    return [];
  }

  return data || [];
}
