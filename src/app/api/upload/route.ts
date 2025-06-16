import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${timestamp}-${sanitizedFileName}`;
    
    // Ensure the uploads directory exists
    const publicDir = join(process.cwd(), 'public');
    const uploadsDir = join(publicDir, 'uploads');
    
    try {
      // First ensure public directory exists
      if (!existsSync(publicDir)) {
        mkdirSync(publicDir, { recursive: true });
        console.log('Created public directory:', publicDir);
      }
      
      // Then ensure uploads directory exists
      if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory:', uploadsDir);
      }
    } catch (dirError: any) {
      console.error('Failed to create directories:', dirError);
      return NextResponse.json(
        { error: 'Server configuration error', details: dirError.message },
        { status: 500 }
      );
    }

    // Write the file
    const filePath = join(uploadsDir, uniqueFilename);
    console.log('Writing file to:', filePath);

    try {
      await writeFile(filePath, buffer);
      console.log('File written successfully');

      // Return the URL for the uploaded file
      const fileUrl = `/uploads/${uniqueFilename}`;
      console.log('Generated file URL:', fileUrl);
      
      return NextResponse.json({
        fileUrl,
        message: 'File uploaded successfully'
      });
    } catch (writeError: any) {
      console.error('Failed to write file:', writeError);
      return NextResponse.json(
        { error: 'Failed to save file', details: writeError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', details: error.message },
      { status: 500 }
    );
  }
} 