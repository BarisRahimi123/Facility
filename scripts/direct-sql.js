#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { readFileSync, readdirSync } = require('fs');
const { join, resolve } = require('path');
const dotenv = require('dotenv');
const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');

const execPromise = promisify(exec);

// Get the directory of the current module
const __dirname = path.resolve();
const rootDir = __dirname;

// Load environment variables
dotenv.config({ path: join(rootDir, '.env.local') });

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Create Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration(sqlContent) {
  try {
    // Split SQL content into individual statements
    const statements = sqlContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/--.*$/gm, '') // Remove single-line comments
      .split(';') // Split by semicolon
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0); // Remove empty statements
    
    // Execute each statement separately
    for (const statement of statements) {
      // Skip BEGIN and COMMIT statements as they're not needed
      if (statement.match(/^\s*(BEGIN|COMMIT)\s*$/i)) {
        continue;
      }
      
      // Execute the statement using direct query method
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // If the exec_sql function doesn't exist, we'll use a different approach
        if (error.message?.includes('function public.exec_sql') || 
            error.details?.includes('function public.exec_sql') ||
            error.code === 'PGRST202') {
          
          // Try a direct Supabase query instead
          const { error: queryError } = await supabase.from('_migration_temp_run').select('count(*)');
          
          if (queryError && queryError.code === '42P01') {
            // The table doesn't exist, which is expected
            // Let's try to create a temporary function and use it
            await createTemporaryHelper();
            return false;
          }
        }
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error applying migration:', error.message);
    return false;
  }
}

async function createTemporaryHelper() {
  // Try an alternative approach using psql directly
  console.log('Creating a temporary helper function for SQL execution...');
  
  try {
    // Use environment variables to connect to the database
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const matches = url.match(/https:\/\/([^.]+)/);
    const projectRef = matches ? matches[1] : null;
    
    if (!projectRef) {
      throw new Error('Could not extract project reference from Supabase URL');
    }
    
    console.log(`Attempting to connect to the database directly using project reference: ${projectRef}`);
    
    // Document different approaches that can be tried
    console.log(`
    Since we can't execute SQL directly through the REST API, here are alternative options:
    
    1. Use the Supabase CLI with proper credentials:
       npx supabase link --project-ref ${projectRef} --password '<db_password>'
       npx supabase db push
       
    2. Create an Edge Function that can execute SQL statements
    
    3. Use PostgreSQL client tools directly:
       PGPASSWORD='<db_password>' psql -h db.${projectRef}.supabase.co -U postgres -d postgres -f migration.sql
       
    4. Create a helper function in your Supabase project that can execute SQL
    
    Please choose one of these approaches and try again.
    `);
    
    return false;
    
  } catch (error) {
    console.error('Error creating helper function:', error.message);
    return false;
  }
}

async function runMigration() {
  try {
    console.log('Starting SQL direct migration...');
    
    const migrationsDir = join(rootDir, 'supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper migration order
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found in supabase/migrations');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration files to apply`);
    
    // Get migration file from command line argument
    const specificMigration = process.argv[2];
    let selectedFiles = [];
    
    if (specificMigration) {
      if (specificMigration === 'all') {
        selectedFiles = migrationFiles;
        console.log('Applying all migrations in sequence');
      } else {
        const matchingFile = migrationFiles.find(file => file.includes(specificMigration));
        if (matchingFile) {
          selectedFiles = [matchingFile];
          console.log(`Applying only migration: ${matchingFile}`);
        } else {
          console.error(`No migration file matches '${specificMigration}'`);
          process.exit(1);
        }
      }
    } else {
      // Default behavior: apply all migrations
      selectedFiles = migrationFiles;
      console.log('No specific migration specified, applying all migrations');
    }
    
    // First, check if we can execute SQL directly
    console.log('Checking if we can execute SQL directly...');
    
    const testSql = 'SELECT 1 as test';
    const testResult = await applyMigration(testSql);
    
    if (!testResult) {
      console.log('⚠️ Direct SQL execution not available.');
      return;
    }
    
    // Run each selected migration
    for (const file of selectedFiles) {
      const migrationPath = join(migrationsDir, file);
      const sql = readFileSync(migrationPath, 'utf8');
      
      console.log(`\nApplying migration: ${file}`);
      
      const success = await applyMigration(sql);
      
      if (success) {
        console.log(`✅ Migration ${file} applied successfully`);
      } else {
        console.error(`❌ Failed to apply migration ${file}`);
      }
    }
    
    console.log('\nVerifying database connection...');
    const { data, error } = await supabase
      .from('facilities')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error connecting to database after migrations:', error);
    } else {
      console.log('✅ Successfully connected to database after migrations');
      console.log(`Database query result: ${JSON.stringify(data)}`);
    }
    
    console.log('\nDirect SQL migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 