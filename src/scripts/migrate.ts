import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function executeSql(sql: string) {
  try {
    // Skip empty statements
    if (!sql.trim()) {
      return null;
    }

    // At this point, we know supabaseServiceKey is defined due to the check above
    const serviceKey = supabaseServiceKey as string;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'resolution=merge-duplicates'
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.json();
      // Ignore errors for existing types and relations
      if (error.message?.includes('duplicate type') || 
          error.message?.includes('already exists') ||
          error.message?.includes('relation') && error.message?.includes('already exists')) {
        console.warn('Ignoring existing object:', error.message);
        return null;
      }
      throw new Error(`SQL execution failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && 
        (error.message.includes('duplicate type') || 
         error.message.includes('already exists'))) {
      console.warn('Ignoring existing object:', error.message);
      return null;
    }
    throw error;
  }
}

async function migrate() {
  try {
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'supabase', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + ';');

    // Execute each statement
    for (const statement of statements) {
      console.log('Executing:', statement);
      await executeSql(statement);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate(); 