import { NextResponse } from 'next/server';
import { createRFQ, submitEstimate, getTask } from '@/lib/db/tasks';
import type { EstimateLineItem, VendorEstimate, MaintenanceTask } from '@/types/maintenance';

// In-memory storage for estimates (in a real app, this would be a database)
const estimates: VendorEstimate[] = [];

// Add a mockup quote for Plansrow
const mockupQuote: VendorEstimate = {
  id: 'mock-quote-1',
  rfqId: 'rfq-ye8dx0w1z',
  vendorId: 'plansrow',
  status: 'submitted',
  totalAmount: 5000,
  estimatedDuration: 5,
  availabilityDate: new Date().toISOString(),
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  lineItems: [
    {
      id: 'item-1',
      description: 'Fix clogged drain',
      quantity: 1,
      unit: 'job',
      unitPrice: 5000,
      totalPrice: 5000,
    },
  ],
  terms: 'Net 30',
  notes: 'Urgent repair needed',
  submittedAt: new Date().toISOString(),
};

// Add the mockup quote to the estimates array
estimates.push(mockupQuote);

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const estimateData = await request.json();
    console.log('Received estimate submission:', estimateData);

    // Validate submission ID
    if (!estimateData.submissionId) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Get task and validate submission ID
    const task = await getTask(params.taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Find the RFQ with matching submission ID
    const matchingRFQ = task.requestForQuotes?.find(rfq => 
      rfq.vendorIds.some(vid => rfq.submissionIds?.[vid] === estimateData.submissionId)
    );

    if (!matchingRFQ) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission ID for this task' },
        { status: 400 }
      );
    }

    // Check if estimate already submitted
    if (matchingRFQ.estimates?.some(e => e.submissionId === estimateData.submissionId)) {
      return NextResponse.json(
        { success: false, error: 'Estimate already submitted for this submission ID' },
        { status: 400 }
      );
    }

    // Submit the estimate
    const estimate = await submitEstimate(matchingRFQ.id, {
      submissionId: estimateData.submissionId,
      vendorId: estimateData.vendorId,
      status: 'submitted',
      totalAmount: estimateData.totalAmount,
      estimatedDuration: estimateData.estimatedDuration,
      availabilityDate: estimateData.availabilityDate,
      expiryDate: estimateData.expiryDate,
      terms: estimateData.terms,
      notes: estimateData.notes,
      lineItems: estimateData.lineItems?.map((item: EstimateLineItem) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    });

    return NextResponse.json({ 
      success: true, 
      estimate 
    });
  } catch (error) {
    console.error('Error submitting estimate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit estimate' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('sid');

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Get task and validate submission ID
    const task = await getTask(params.taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Find the RFQ with matching submission ID
    const matchingRFQ = task.requestForQuotes?.find(rfq => 
      rfq.vendorIds.some(vid => rfq.submissionIds?.[vid] === submissionId)
    );

    if (!matchingRFQ) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission ID for this task' },
        { status: 400 }
      );
    }

    // Return task data with submission validation
    return NextResponse.json({
      success: true,
      task: {
        ...task,
        submissionId, // Add submission ID to response
        rfqId: matchingRFQ.id // Add RFQ ID to response
      }
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
} 