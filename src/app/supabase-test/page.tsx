import SupabaseTest from '../supabase-test';
import EnvCheck from './env-check';

export default function SupabaseTestPage() {
  return (
    <div className="container mx-auto py-8">
      <EnvCheck />
      <SupabaseTest />
    </div>
  );
} 