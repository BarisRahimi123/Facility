// This is a server component
export default function EnvCheck() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return (
    <div className="p-4 mb-6 bg-gray-100 rounded-md">
      <h2 className="text-xl font-semibold mb-2">Environment Check</h2>
      <div className="grid gap-2">
        <div>
          <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>{' '}
          {supabaseUrl ? (
            <span className="text-green-600">✓ Set</span>
          ) : (
            <span className="text-red-600">✗ Not set</span>
          )}
        </div>
        <div>
          <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{' '}
          {supabaseKey ? (
            <span className="text-green-600">✓ Set</span>
          ) : (
            <span className="text-red-600">✗ Not set</span>
          )}
        </div>
      </div>
    </div>
  );
} 