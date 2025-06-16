import { Button } from '@/components/ui/button';
import { Plus, Grid, List, Filter } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default async function ProjectsPage() {
  const supabase = createClient();
  
  // Fetch projects from Supabase
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <Link href="/projects/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search projects..."
            className="px-3 py-2 border rounded-lg w-[300px]"
          />
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <div
            key={project.id}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium mb-2">{project.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{project.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
              <span className={`px-2 py-1 rounded text-sm ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 