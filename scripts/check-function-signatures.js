import { getServiceRoleClient } from '../src/lib/supabase/server.js';

async function checkFunctionSignatures() {
  console.log('Checking send_user_invitation function signatures...\n');
  
  const supabase = getServiceRoleClient();
  
  try {
    // Query to find all functions with this name
    const { data, error } = await supabase.rpc('get_function_info', {}, {
      // This will fail, but we'll use a direct query instead
    }).then(() => null).catch(() => null);
    
    // Direct query to pg_proc
    const functionsQuery = `
      SELECT 
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments,
        pg_get_functiondef(p.oid) as full_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'send_user_invitation'
        AND n.nspname = 'public'
      ORDER BY p.oid;
    `;
    
    const { data: functions, error: funcError } = await supabase
      .rpc('query_direct', { query: functionsQuery })
      .then(res => res)
      .catch(() => ({ data: null, error: 'query_direct not available' }));
    
    if (funcError === 'query_direct not available') {
      // Alternative approach using direct SQL
      console.log('Trying alternative approach...\n');
      
      const { data: altData, error: altError } = await supabase.from('user_invitations')
        .select('*')
        .limit(0);
      
      if (altError) {
        console.log('Error accessing database:', altError.message);
      }
      
      // Let's try to get function info through information_schema
      const infoQuery = `
        SELECT 
          routine_name,
          routine_definition,
          data_type
        FROM information_schema.routines
        WHERE routine_name = 'send_user_invitation'
          AND routine_schema = 'public';
      `;
      
      console.log('Please run this query in Supabase SQL Editor to see existing functions:');
      console.log('```sql');
      console.log(functionsQuery);
      console.log('```\n');
      
      console.log('Also check dependencies with:');
      console.log('```sql');
      console.log(`-- Check what depends on the function
SELECT 
  d.classid::regclass AS dependency_type,
  d.objid::regprocedure AS dependent_function,
  p.proname AS function_name
FROM pg_depend d
JOIN pg_proc p ON d.refobjid = p.oid
WHERE p.proname = 'send_user_invitation';`);
      console.log('```\n');
    } else if (functions && functions.length > 0) {
      console.log(`Found ${functions.length} version(s) of send_user_invitation:\n`);
      
      functions.forEach((func, index) => {
        console.log(`Version ${index + 1}:`);
        console.log(`Arguments: ${func.arguments}`);
        console.log(`Full definition:`);
        console.log('```sql');
        console.log(func.full_definition);
        console.log('```\n');
      });
    } else {
      console.log('No send_user_invitation function found in the database.');
    }
    
    // Check if user_invitations table exists and its structure
    console.log('\nChecking user_invitations table structure...');
    
    const { data: columns, error: colError } = await supabase
      .from('user_invitations')
      .select('*')
      .limit(0);
    
    if (!colError) {
      console.log('✅ user_invitations table exists');
      
      // Try to get column info
      const colQuery = `
        SELECT 
          column_name, 
          data_type,
          column_default,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_invitations'
          AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      console.log('\nTo see table structure, run:');
      console.log('```sql');
      console.log(colQuery);
      console.log('```');
    } else {
      console.log('❌ Error accessing user_invitations table:', colError.message);
    }
    
  } catch (error) {
    console.error('Error checking functions:', error);
  }
}

checkFunctionSignatures(); 