import { NextResponse } from 'next/server';
import { getTask, updateTask } from '@/lib/db/tasks';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const task = await getTask(params.taskId);
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const updates = await request.json();
    console.log('Updating task:', { taskId: params.taskId, updates });
    
    const updatedTask = await updateTask(params.taskId, updates);
    console.log('Task updated successfully:', updatedTask);

    return NextResponse.json({ 
      success: true, 
      task: updatedTask 
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}