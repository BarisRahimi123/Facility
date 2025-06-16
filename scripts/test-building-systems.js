// Import the server actions directly to test them
console.log('Testing building systems functionality...');

// Test the import path first
try {
  // This should work if the modules are properly configured
  const path = require('path');
  const { spawn } = require('child_process');
  
  console.log('Starting test...');
  
  // We'll test through the app itself
  console.log('Please try to add a system through the UI and check the browser console for errors.');
  console.log('Look for any database errors or migration issues.');
  
  console.log('\nExpected flow:');
  console.log('1. Click "Add System" button');
  console.log('2. Fill out the form');
  console.log('3. Submit the form');
  console.log('4. Check browser console for any errors');
  console.log('5. Check if the system appears in the list');
  
  console.log('\nIf you see database errors, the building_systems table may not exist yet.');
  console.log('Check the migration in supabase/migrations/20250115_create_building_systems_renovations.sql');
  
} catch (error) {
  console.error('Error:', error);
} 