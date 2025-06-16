import { NextResponse } from 'next/server';
import { sendEmail, generateContractorFormEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const {
      to,
      taskId,
      contractorName,
      taskTitle,
      taskDescription,
      systemType,
      location,
      dueDate,
      replyTo,
    } = await request.json();

    // Validate required fields
    const requiredFields = {
      to: 'Email address',
      taskId: 'Task ID',
      contractorName: 'Contractor name',
      taskTitle: 'Task title',
      taskDescription: 'Task description',
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !eval(field))
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email address format' 
        },
        { status: 400 }
      );
    }

    // Generate form URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables');
    }

    const formUrl = `${baseUrl}/contractor-form/${taskId}`;

    // Generate email content
    const emailContent = generateContractorFormEmail({
      contractorName,
      taskTitle,
      taskDescription,
      formUrl,
      systemType,
      location,
      dueDate,
    });

    // Send email with optional reply-to
    const result = await sendEmail({
      to,
      ...emailContent,
      replyTo,
    });

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Email sent successfully',
      formUrl, // Return the form URL for reference
    });
  } catch (error) {
    console.error('Error in email API route:', error);

    // Parse error message if it's a stringified JSON
    let errorMessage = 'An unknown error occurred';
    let errorDetails = undefined;

    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.message;
        errorDetails = parsedError.details;
      } catch {
        errorMessage = error.message;
        errorDetails = error.stack;
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send email',
        message: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
} 