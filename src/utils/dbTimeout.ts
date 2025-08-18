/**
 * Utility to wrap Supabase queries with timeout protection
 * Prevents hanging queries that block page loading
 */

/**
 * Execute a Supabase query with timeout protection
 * @param queryPromise The Supabase query promise
 * @param timeoutMs Timeout in milliseconds (default 5000)
 * @param fallbackValue Value to return if timeout occurs
 * @returns Query result or fallback value
 */
export async function queryWithTimeout<T>(
  queryPromise: Promise<any>,
  timeoutMs: number = 5000,
  fallbackValue: T | null = null
): Promise<T | null> {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    
    if (result?.error) {
      console.error('Query error:', result.error);
      return fallbackValue;
    }
    
    return result?.data || fallbackValue;
  } catch (error) {
    console.error('Query timeout or error:', error);
    return fallbackValue;
  }
}

/**
 * Execute multiple queries in parallel with timeout protection
 * @param queries Array of query configurations
 * @param overallTimeoutMs Overall timeout for all queries
 * @returns Results array
 */
export async function parallelQueriesWithTimeout(
  queries: Array<{
    name: string;
    promise: Promise<any>;
    fallback?: any;
  }>,
  overallTimeoutMs: number = 10000
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  try {
    // Set overall timeout
    const overallTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Overall query timeout')), overallTimeoutMs)
    );
    
    // Execute all queries in parallel with individual timeouts
    const queryPromises = queries.map(async (query) => {
      const result = await queryWithTimeout(
        query.promise,
        Math.min(5000, overallTimeoutMs / 2), // Individual timeout is half of overall
        query.fallback
      );
      results[query.name] = result;
    });
    
    // Wait for all queries or overall timeout
    await Promise.race([
      Promise.all(queryPromises),
      overallTimeout
    ]);
    
  } catch (error) {
    console.error('Parallel queries timeout:', error);
    // Fill in fallback values for any missing results
    queries.forEach(query => {
      if (!(query.name in results)) {
        results[query.name] = query.fallback || null;
      }
    });
  }
  
  return results;
}
