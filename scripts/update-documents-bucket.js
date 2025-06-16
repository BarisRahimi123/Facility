const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateDocumentsBucket() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Updating documents bucket configuration...\n');

  try {
    // Define all allowed MIME types
    const allowedMimeTypes = [
      // PDFs
      'application/pdf',
      // Word documents
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // PowerPoint
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text files
      'text/plain',
      'text/rtf',
      'application/rtf',
      // Images
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/svg+xml',
      'image/webp',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-rar'
    ];

    // Update bucket configuration
    const { data, error } = await supabase.storage.updateBucket('documents', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: allowedMimeTypes
    });

    if (error) {
      console.error('❌ Error updating bucket:', error);
    } else {
      console.log('✅ Documents bucket updated successfully!');
      console.log('\nUpdated configuration:');
      console.log('- Public access: true');
      console.log('- File size limit: 50MB');
      console.log('- Total MIME types allowed:', allowedMimeTypes.length);
      console.log('\nAllowed file types:');
      console.log('- PDFs');
      console.log('- Word documents (.doc, .docx)');
      console.log('- Excel files (.xls, .xlsx)');
      console.log('- PowerPoint files (.ppt, .pptx)');
      console.log('- Text files (.txt, .rtf)');
      console.log('- Images (.png, .jpg, .jpeg, .gif, .svg)');
      console.log('- Archives (.zip, .rar)');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateDocumentsBucket(); 