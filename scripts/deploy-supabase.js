#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { readFileSync, readdirSync } = require('fs');
const { join, resolve } = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

// Get the directory of the current module
const __dirname = path.resolve();
const rootDir = __dirname;

// Load environment variables
dotenv.config({ path: join(rootDir, '.env.local') });

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ACCESS_TOKEN'
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

// Function to execute SQL directly against Supabase using the REST API
async function executeSql(sql) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      throw new Error(`SQL execution failed with status ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    return false;
  }
}

async function deployToSupabase() {
  try {
    console.log('Starting Supabase deployment...');
    
    // First, try to use the Supabase CLI to apply migrations
    console.log('Pushing migrations to Supabase...');
    try {
      // Try to link the project first if not already linked
      try {
        execSync(
          `npx supabase link --project-ref ahntaamtsypranvnofxy --password '@Eb745365'`,
          { stdio: 'inherit', cwd: rootDir }
        );
        console.log('✅ Project linked successfully');
      } catch (linkError) {
        console.warn('⚠️ Project already linked or link failed:', linkError.message);
      }
      
      // Now try to push the database changes
      execSync('npx supabase db push', { stdio: 'inherit', cwd: rootDir });
      console.log('✅ Migrations successfully applied via CLI');
    } catch (error) {
      console.warn('⚠️ Could not apply migrations via CLI, will try direct SQL execution...');
      console.warn(error.message);
      
      // Execute each migration file directly
      console.log('Applying migrations manually...');
      
      const migrationsDir = join(rootDir, 'supabase/migrations');
      const migrationFiles = readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure proper migration order
      
      for (const file of migrationFiles) {
        const migrationPath = join(migrationsDir, file);
        const sql = readFileSync(migrationPath, 'utf8');
        
        console.log(`Running migration: ${file}`);
        try {
          // Execute SQL using our helper function
          const success = await executeSql(sql);
          
          if (success) {
            console.log(`✅ Successfully applied migration: ${file}`);
          } else {
            console.error(`❌ Error applying migration ${file}`);
          }
        } catch (sqlError) {
          console.error(`Error applying migration ${file}:`, sqlError);
        }
      }
    }
    
    // Test connection to verify deployment
    console.log('Checking database connection after deployment...');
    const { data, error } = await supabase
      .from('facilities')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('⚠️ Error connecting to database after deployment:', error);
    } else {
      console.log('✅ Successfully connected to database after deployment');
      console.log(`Database query result: ${JSON.stringify(data)}`);
    }
    
    console.log('Deployment completed!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deployToSupabase(); 