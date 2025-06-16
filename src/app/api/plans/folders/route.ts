import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET /api/plans/folders - Get all folders
export async function GET() {
  try {
    const supabase = createClient(cookies());

    const { data: folders, error } = await supabase
      .from('plan_folders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/plans/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const json = await request.json();

    const { name, description, category } = json;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const { data: folder, error } = await supabase
      .from('plan_folders')
      .insert([
        {
          name,
          description,
          category,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(folder);
  } catch (error: any) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/plans/folders/:id - Update a folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const json = await request.json();
    const { id } = params;

    const { name, description } = json;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { data: folder, error } = await supabase
      .from('plan_folders')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(folder);
  } catch (error: any) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/folders/:id - Delete a folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { id } = params;

    const { error } = await supabase
      .from('plan_folders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder', details: error.message },
      { status: 500 }
    );
  }
} 