'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { Database } from '@/lib/database.types';
import { 
  uploadPlanFile, 
  uploadThumbnail, 
  getPlanFileUrl, 
  getThumbnailUrl,
  generateFilePath,
  deletePlanFile,
  deleteThumbnail
} from '@/lib/storage';

export type Folder = Database['public']['Tables']['plans_folders']['Row'];
export type Plan = {
  id: string;
  name: string;
  title?: string;
  description?: string;
  folder_id: string;
  sheet_number: string;
  revision: string;
  scale: string;
  type: string;
  size?: number;
  url?: string;
  uploaded_at: string;
  uploaded_by: string;
  version: string;
  status: string;
  thumbnail_url?: string;
  building_refs?: Array<{
    buildingId: string;
    roomIds?: string[];
  }>;
};

async function getServerSideSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          const cookie = cookieStore.get(name);
          return cookie?.value ?? '';
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        }
      }
    }
  );
}

async function getServiceRoleSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          const cookie = cookieStore.get(name);
          return cookie?.value ?? '';
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        }
      }
    }
  );
}

export async function getFolders(): Promise<Folder[]> {
  try {
    // Use service role client to bypass RLS
    const serviceSupabase = await getServiceRoleSupabase();
    const { data, error } = await serviceSupabase
      .from('plans_folders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFolders:', error);
    throw error;
  }
}

export async function getPlans(folderId?: string): Promise<Plan[]> {
  try {
    // Use service role client to bypass RLS
    const serviceSupabase = await getServiceRoleSupabase();
    let query = serviceSupabase.from('plans').select('*');
    
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPlans:', error);
    throw error;
  }
}

export async function createFolder(formData: FormData): Promise<Folder> {
  try {
    // Use service role client to bypass RLS
    const serviceSupabase = await getServiceRoleSupabase();
    
    // Still check for user authentication using regular client
    const supabase = await getServerSideSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Handle mock authentication for development
    const userId = user?.id || null;
    if (authError || !user) {
      console.log('No authenticated user, using null for created_by');
    }

    const name = formData.get('name') as string;
    const discipline = formData.get('discipline') as string;
    const phase = formData.get('phase') as string;

    if (!name || !discipline || !phase) {
      throw new Error('Missing required fields');
    }

    // Use service role client for the insert to bypass RLS
    const { data, error } = await serviceSupabase
      .from('plans_folders')
      .insert({
        name,
        discipline,
        phase,
        item_count: 0,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create folder: ' + error.message);
    }

    if (!data) {
      throw new Error('Failed to create folder: No data returned');
    }

    return data;
  } catch (error) {
    console.error('Error in createFolder:', error);
    throw error;
  }
}

export async function uploadPlan(file: File, formData: FormData): Promise<Plan> {
  try {
    // Use service role client to bypass RLS
    const serviceSupabase = await getServiceRoleSupabase();
    
    // Still check for user authentication using regular client
    const supabase = await getServerSideSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Handle mock authentication for development
    const userId = user?.id || null;
    if (authError || !user) {
      console.log('No authenticated user, using null for uploaded_by');
    }

    const folderId = formData.get('folderId') as string;
    if (!folderId) {
      throw new Error('Folder ID is required');
    }

    // Validate required fields
    const title = formData.get('title') as string;
    const sheetNumber = formData.get('sheetNumber') as string;
    const revision = formData.get('revision') as string;
    const scale = formData.get('scale') as string;

    if (!title || !sheetNumber || !revision || !scale) {
      throw new Error('Missing required fields: title, sheet number, revision, and scale are required');
    }
    
    // Generate unique file path
    const filePath = generateFilePath(file.name, folderId);
    
    // Upload file to storage
    try {
      await uploadPlanFile(file, filePath);
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      throw new Error('Failed to upload file');
    }
    
    // Create thumbnail if it's an image
    let thumbnailPath = undefined;
    if (file.type.startsWith('image/')) {
      try {
        thumbnailPath = `thumbnails/${filePath}`;
        await uploadThumbnail(file, thumbnailPath);
      } catch (thumbnailError) {
        console.error('Thumbnail creation error:', thumbnailError);
        // Continue without thumbnail if it fails
      }
    }

    // Parse building references
    let buildingRefs;
    const buildingId = formData.get('buildingId') as string;
    const roomIds = formData.getAll('roomIds') as string[];
    
    if (buildingId) {
      buildingRefs = [{
        buildingId,
        roomIds: roomIds.length > 0 ? roomIds : undefined
      }];
    }

    const { data, error } = await serviceSupabase
      .from('plans')
      .insert({
        folder_id: folderId,
        name: formData.get('name') as string || file.name,
        title,
        description: formData.get('description') as string,
        type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        size: file.size,
        url: getPlanFileUrl(filePath),
        thumbnail_url: thumbnailPath ? getThumbnailUrl(thumbnailPath) : undefined,
        sheet_number: sheetNumber,
        revision,
        scale,
        status: 'active',
        version: '1.0',
        building_refs: buildingRefs,
        uploaded_by: userId,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // If plan creation fails, try to clean up the uploaded files
      try {
        await deletePlanFile(filePath);
        if (thumbnailPath) {
          await deleteThumbnail(thumbnailPath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up files after failed plan creation:', cleanupError);
      }
      console.error('Database error:', error);
      throw new Error('Failed to create plan: ' + error.message);
    }

    if (!data) {
      throw new Error('Failed to create plan: No data returned');
    }

    // Update folder item count
    const { error: updateError } = await serviceSupabase
      .from('plans_folders')
      .update({ 
        item_count: serviceSupabase.from('plans')
          .select('id', { count: 'exact', head: true })
          .eq('folder_id', folderId)
      })
      .eq('id', folderId);

    if (updateError) {
      console.error('Error updating folder item count:', updateError);
      // Don't throw error here as the plan was created successfully
    }

    return data;
  } catch (error) {
    console.error('Error in uploadPlan:', error);
    throw error;
  }
}

export async function updatePlan(planId: string, formData: FormData): Promise<Plan> {
  try {
    const supabase = await getServerSideSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Handle mock authentication for development
    const userId = user?.id || null;
    if (authError || !user) {
      console.log('No authenticated user, using null for uploaded_by check');
    }

    // Parse building references
    let buildingRefs;
    const buildingRefsStr = formData.get('buildingRefs') as string;
    if (buildingRefsStr) {
      buildingRefs = JSON.parse(buildingRefsStr);
    }

    const { data, error } = await supabase
      .from('plans')
      .update({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        sheet_number: formData.get('sheetNumber') as string,
        revision: formData.get('revision') as string,
        scale: formData.get('scale') as string,
        building_refs: buildingRefs
      })
      .eq('id', planId)
      .eq('uploaded_by', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Failed to update plan');
    }

    return data;
  } catch (error) {
    console.error('Error in updatePlan:', error);
    throw error;
  }
}

export async function deletePlan(id: string): Promise<void> {
  try {
    const supabase = await getServerSideSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Handle mock authentication for development
    const userId = user?.id || null;
    if (authError || !user) {
      console.log('No authenticated user, using null for uploaded_by check');
    }

    // Get the plan to get its folder_id
    const { data: plan } = await supabase
      .from('plans')
      .select('folder_id')
      .eq('id', id)
      .single();

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Delete the plan
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id)
      .eq('uploaded_by', userId);

    if (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }

    // Update folder item count
    const { error: updateError } = await supabase
      .from('plans_folders')
      .update({ 
        item_count: supabase.from('plans')
          .select('id', { count: 'exact', head: true })
          .eq('folder_id', plan.folder_id)
      })
      .eq('id', plan.folder_id);

    if (updateError) {
      console.error('Error updating folder item count:', updateError);
    }
  } catch (error) {
    console.error('Error in deletePlan:', error);
    throw error;
  }
}

export async function deleteFolder(id: string): Promise<void> {
  try {
    const supabase = await getServerSideSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Handle mock authentication for development
    const userId = user?.id || null;
    if (authError || !user) {
      console.log('No authenticated user, using null for created_by check');
    }

    // Delete all plans in the folder first
    const { error: plansError } = await supabase
      .from('plans')
      .delete()
      .eq('folder_id', id);

    if (plansError) {
      console.error('Error deleting plans in folder:', plansError);
      throw plansError;
    }

    // Delete the folder
    const { error } = await supabase
      .from('plans_folders')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);

    if (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteFolder:', error);
    throw error;
  }
}                    