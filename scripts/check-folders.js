import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFolders() {
  try {
    // Check if the table exists
    const { data: tables, error: tableError } = await supabase
      .from('document_folders')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Error checking document_folders table:', tableError);
      return;
    }

    // Get all folders
    const { data: folders, error: foldersError } = await supabase
      .from('document_folders')
      .select('*')
      .order('created_at', { ascending: true });

    if (foldersError) {
      console.error('Error fetching folders:', foldersError);
      return;
    }

    console.log(`Found ${folders.length} folders in the database:`);
    
    // Group by facility
    const foldersByFacility = {};
    folders.forEach(folder => {
      const facilityId = folder.facility_id || 'Unknown';
      if (!foldersByFacility[facilityId]) {
        foldersByFacility[facilityId] = [];
      }
      foldersByFacility[facilityId].push(folder);
    });

    Object.entries(foldersByFacility).forEach(([facilityId, facilityFolders]) => {
      console.log(`\nFacility ${facilityId}:`);
      facilityFolders.forEach(folder => {
        console.log(`  - ${folder.name} (${folder.color}) - ${folder.description || 'No description'}`);
      });
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkFolders();





