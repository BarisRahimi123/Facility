const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function measureQuery(name, queryFn) {
  console.log(`\nTesting: ${name}`);
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    console.log(`✓ Success in ${duration}ms`);
    return { success: true, duration, result };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`✗ Failed in ${duration}ms`);
    console.log(`  Error: ${error.message}`);
    return { success: false, duration, error };
  }
}

async function debugPerformance() {
  console.log('=== PERFORMANCE DEBUGGING ===\n');
  console.log('Testing various queries to identify bottlenecks...');
  
  // Test 1: Simple facilities query
  await measureQuery('Simple facilities query', async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .limit(10);
    if (error) throw error;
    return data;
  });
  
  // Test 2: Facilities with count
  await measureQuery('Facilities with count', async () => {
    const { data, error, count } = await supabase
      .from('facilities')
      .select('*', { count: 'exact' });
    if (error) throw error;
    return { data, count };
  });
  
  // Test 3: Single facility by ID
  const facilityId = 'e886edaf-0e7b-40b4-9a79-074ab496013a'; // Kabul facility
  await measureQuery('Single facility by ID', async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', facilityId)
      .single();
    if (error) throw error;
    return data;
  });
  
  // Test 4: Buildings for a facility
  await measureQuery('Buildings for facility', async () => {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('facility_id', facilityId);
    if (error) throw error;
    return data;
  });
  
  // Test 5: Complex query with joins (this might be slow)
  await measureQuery('Facility with buildings join', async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        buildings (*)
      `)
      .eq('id', facilityId)
      .single();
    if (error) throw error;
    return data;
  });
  
  // Test 6: Check table sizes
  console.log('\n=== TABLE SIZES ===');
  
  const tables = ['facilities', 'buildings', 'rooms'];
  for (const table of tables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`${table}: ${count || 0} rows`);
    } catch (error) {
      console.log(`${table}: Unable to count (${error.message})`);
    }
  }
  
  // Test 7: Check indexes
  console.log('\n=== CHECKING INDEXES ===');
  try {
    const { data: indexes } = await supabase.rpc('exec', {
      sql: `
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename IN ('facilities', 'buildings', 'rooms')
        ORDER BY tablename, indexname;
      `
    });
    
    if (indexes) {
      console.log('Existing indexes:');
      indexes.forEach(idx => {
        console.log(`  ${idx.tablename}.${idx.indexname}`);
      });
    }
  } catch (error) {
    console.log('Could not check indexes:', error.message);
  }
  
  // Test 8: Connection latency
  console.log('\n=== CONNECTION LATENCY ===');
  const pings = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await supabase.from('facilities').select('id').limit(1);
    const duration = Date.now() - start;
    pings.push(duration);
  }
  const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
  console.log(`Average latency: ${avgPing.toFixed(2)}ms`);
  console.log(`Min: ${Math.min(...pings)}ms, Max: ${Math.max(...pings)}ms`);
}

debugPerformance(); 