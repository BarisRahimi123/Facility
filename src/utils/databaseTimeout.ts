/**
 * Database query timeout utility
 * Applies the same timeout pattern used in AuthContext to prevent hanging queries
 */

export interface TimeoutQueryResult<T> {
  data: T | null;
  error: any;
  timedOut: boolean;
}

interface UserRoleData {
  role: string;
}

/**
 * Wraps a Supabase query with a timeout to prevent hanging in production
 * @param queryPromise - The Supabase query promise
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @param queryName - Name for logging purposes
 * @returns Promise with timeout protection
 */
export async function withTimeout<T>(
  queryPromise: Promise<any>,
  timeoutMs: number = 5000,
  queryName: string = 'Database query'
): Promise<TimeoutQueryResult<T>> {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${queryName} timeout after ${timeoutMs/1000}s`)), timeoutMs)
    );
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    
    return {
      data: result?.data || null,
      error: result?.error || null,
      timedOut: false
    };
  } catch (timeoutError) {
    console.error(`${queryName} timed out or failed:`, timeoutError);
    return {
      data: null,
      error: timeoutError,
      timedOut: true
    };
  }
}

/**
 * Wraps a user role query with timeout and fallback to basic auth info
 * @param supabase - Supabase client
 * @param authUser - Authenticated user from supabase.auth.getUser()
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns User role or fallback role
 */
export async function getUserRoleWithTimeout(
  supabase: any,
  authUser: any,
  timeoutMs: number = 5000
): Promise<string | null> {
  const idResult = await withTimeout(
    supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single(),
    timeoutMs,
    'User role query by ID'
  );
  
  if (!idResult.error && idResult.data && (idResult.data as UserRoleData).role) {
    console.log('User role loaded by ID:', (idResult.data as UserRoleData).role);
    return (idResult.data as UserRoleData).role;
  }
  
  const emailResult = await withTimeout(
    supabase
      .from('users')
      .select('role')
      .eq('email', authUser.email)
      .limit(1)
      .maybeSingle(),
    timeoutMs,
    'User role query by email'
  );
  
  if (!emailResult.error && emailResult.data && (emailResult.data as UserRoleData).role) {
    console.log('User role loaded by email:', (emailResult.data as UserRoleData).role);
    return (emailResult.data as UserRoleData).role;
  }
  
  console.log('Database queries timed out, using email-based role fallback');
  if (authUser.email === '85baris@gmail.com') {
    return 'master_admin';
  }
  
  return authUser.user_metadata?.role || 'staff';
}
