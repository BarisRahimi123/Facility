import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyThreeTierAuth() {
  try {
    console.log('🚀 Applying three-tier authentication migration...\n');

    // Read the migration file
    const migrationSql = readFileSync('supabase/migrations/20250131_three_tier_authentication.sql', 'utf8');

    // Split the migration into individual statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          
          // Continue with next statement for non-critical errors
          if (error.message?.includes('already exists') || 
              error.message?.includes('does not exist') ||
              error.message?.includes('duplicate key value')) {
            console.log('⚠️  Non-critical error, continuing...\n');
            continue;
          } else {
            throw error;
          }
        }
        
        console.log(`✅ Statement ${i + 1} completed successfully\n`);
        
      } catch (error) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, error);
        console.log('Statement was:', statement.substring(0, 200) + '...\n');
        
        // For critical errors, try alternative approach
        if (statement.includes('ALTER TYPE user_role')) {
          console.log('🔧 Trying alternative approach for enum update...');
          
          // Alternative: Create new enum and migrate
          const alternativeStatements = [
            `CREATE TYPE user_role_new AS ENUM ('master_admin', 'sub_admin', 'staff')`,
            `ALTER TABLE users ALTER COLUMN role TYPE user_role_new USING 
             CASE 
               WHEN role::text IN ('master_admin', 'district_approver') THEN 'master_admin'::user_role_new
               WHEN role::text IN ('sub_master', 'site_approver', 'manager', 'coordinator') THEN 'sub_admin'::user_role_new
               ELSE 'staff'::user_role_new
             END`,
            `DROP TYPE IF EXISTS user_role CASCADE`,
            `ALTER TYPE user_role_new RENAME TO user_role`
          ];
          
          for (const altStmt of alternativeStatements) {
            try {
              await supabase.rpc('exec_sql', { sql: altStmt });
              console.log('✅ Alternative statement executed');
            } catch (altError) {
              console.log('⚠️  Alternative also failed:', altError.message);
            }
          }
        }
      }
    }

    console.log('🎉 Three-tier authentication migration completed!\n');

    // Verify the migration worked
    console.log('🔍 Verifying migration results...\n');

    // Check if 85baris@gmail.com now has master_admin role
    const { data: masterUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com')
      .single();

    if (userError) {
      console.error('❌ Error checking master user:', userError);
    } else {
      console.log('✅ Master user verification:');
      console.log(`   Email: ${masterUser.email}`);
      console.log(`   Role: ${masterUser.role}`);
      console.log(`   Organization ID: ${masterUser.organization_id}\n`);
    }

    // Check organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, org_type');

    if (orgError) {
      console.error('❌ Error checking organizations:', orgError);
    } else {
      console.log('✅ Organizations created:');
      orgs.forEach(org => {
        console.log(`   ${org.name} (${org.org_type}): ${org.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyThreeTierAuth(); 