// Script to list tables from Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get the Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

console.log('Connecting to Supabase...');
console.log(`URL: ${supabaseUrl}`);

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to list all tables using Supabase's RPC
async function listTables() {
  try {
    // Query to list all tables from the public schema
    const { data, error } = await supabase
      .rpc('get_tables')
      .select('*');

    if (error) {
      throw error;
    }

    if (data) {
      console.log('Tables in database:');
      console.table(data);
    } else {
      console.log('No tables found or RPC function not available');
      
      // Alternative approach: query system tables directly
      console.log('Trying alternative approach...');
      const { data: tables, error: tablesError } = await supabase
        .from('_tables')
        .select('*');
      
      if (tablesError) {
        console.error('Error with alternative approach:', tablesError);
        return;
      }
      
      if (tables) {
        console.log('Tables found with alternative approach:');
        console.table(tables);
      } else {
        console.log('No tables found with alternative approach');
      }
    }
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

// Alternative function to list tables using PostgreSQL information_schema
async function listTablesFromSchema() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Error querying information_schema:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Tables in public schema:');
      data.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    } else {
      console.log('No tables found in public schema or cannot access information_schema');
    }
  } catch (error) {
    console.error('Error listing tables from schema:', error);
  }
}

// Try both methods
async function run() {
  console.log('Attempting to list database tables...');
  
  // First try using RPC
  await listTables();
  
  // Then try using information_schema
  await listTablesFromSchema();
  
  // Fallback to direct method - list some known tables from schema.sql
  console.log('\nAttempting to query known tables directly:');
  const knownTables = [
    'facilities',
    'buildings',
    'rooms',
    'contractors',
    'tasks',
    'request_for_quotes',
    'vendor_estimates',
    'estimate_line_items',
    'workflow_settings',
    'form_tokens'
  ];
  
  for (const table of knownTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`- ${table}: Error accessing table - ${error.message}`);
      } else {
        console.log(`- ${table}: ${count} rows`);
      }
    } catch (e) {
      console.log(`- ${table}: Error - ${e.message}`);
    }
  }
}

run().catch(error => {
  console.error('Unhandled error:', error);
}); 