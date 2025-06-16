import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET /api/plans - Get all plans
export async function GET() {
  try {
    const supabase = createClient(cookies());

    const { data: plans, error } = await supabase
      .from('plans')
      .select(`
        *,
        folder:plan_folders(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/plans - Create a new plan
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const number = formData.get('number') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const folderId = formData.get('folderId') as string;
    const file = formData.get('file') as File;

    if (!title || !number || !category || !file) {
      return NextResponse.json(
        { error: 'Title, number, category, and file are required' },
        { status: 400 }
      );
    }

    // Check if the storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      return NextResponse.json(
        { error: 'Failed to check storage buckets', details: bucketsError.message },
        { status: 500 }
      );
    }

    const plansBucket = buckets?.find(b => b.name === 'plans');
    if (!plansBucket) {
      console.error('Plans bucket not found');
      return NextResponse.json(
        { error: 'Storage not properly configured' },
        { status: 500 }
      );
    }

    // Upload the file
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${timestamp}-${sanitizedFileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('plans')
      .upload(uniqueFilename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl: pdfUrl } } = supabase
      .storage
      .from('plans')
      .getPublicUrl(uniqueFilename);

    // Create the plan record
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert([
        {
          title,
          number,
          description,
          category,
          folder_id: folderId || null,
          pdf_url: pdfUrl,
        },
      ])
      .select()
      .single();

    if (planError) {
      // If plan creation fails, try to clean up the uploaded file
      await supabase.storage.from('plans').remove([uniqueFilename]);
      throw planError;
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/plans/:id - Update a plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const json = await request.json();
    const { id } = params;

    const { title, number, description, category, folderId } = json;

    if (!title || !number || !category) {
      return NextResponse.json(
        { error: 'Title, number, and category are required' },
        { status: 400 }
      );
    }

    const { data: plan, error } = await supabase
      .from('plans')
      .update({
        title,
        number,
        description,
        category,
        folder_id: folderId || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/:id - Delete a plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { id } = params;

    // First, get the plan to get its file URL
    const { data: plan, error: fetchError } = await supabase
      .from('plans')
      .select('pdf_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete the file from storage
    if (plan?.pdf_url) {
      const filename = plan.pdf_url.split('/').pop();
      if (filename) {
        const { error: storageError } = await supabase
          .storage
          .from('plans')
          .remove([filename]);

        if (storageError) throw storageError;
      }
    }

    // Delete the plan record
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan', details: error.message },
      { status: 500 }
    );
  }
} 