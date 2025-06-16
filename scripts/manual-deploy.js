#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { readFileSync, readdirSync } = require('fs');
const { join, resolve } = require('path');
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

// Function to execute raw SQL using the Supabase REST API
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

async function manualDeploy() {
  try {
    console.log('Starting manual database deployment...');
    
    const migrationsDir = join(rootDir, 'supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper migration order
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found in supabase/migrations');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration files to apply`);
    
    // Ask which migration to run
    console.log('Available migrations:');
    migrationFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    // Get migration file from command line argument or ask for input
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
    
    // Run each selected migration
    for (const file of selectedFiles) {
      const migrationPath = join(migrationsDir, file);
      const sql = readFileSync(migrationPath, 'utf8');
      
      console.log(`\nApplying migration: ${file}`);
      
      try {
        // Execute SQL using our helper function
        const success = await executeSql(sql);
        
        if (success) {
          console.log(`✅ Migration ${file} applied successfully`);
        } else {
          console.error(`❌ Error applying migration ${file}`);
        }
      } catch (error) {
        console.error(`❌ Failed to apply migration ${file}:`, error);
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
    
    console.log('\nManual deployment completed');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

manualDeploy(); 