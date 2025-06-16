'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, SlidersHorizontal, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProjectCard from '@/components/dashboard/ProjectCard';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

// Sample project data
const sampleProjects = [
  {
    id: '1',
    title: 'Office Tower',
    location: 'New York, NY',
    status: 'active',
    lastVisited: '2 hours ago',
    thumbnail: null,
    thumbnailUrl: null,
    members: 8,
    plansCount: 15,
    tasksCount: 24,
    progress: 65,
    isStarred: true,
  },
  {
    id: '2',
    title: 'Washington Elementary',
    location: 'Minnesota',
    status: 'active',
    lastVisited: '1 day ago',
    thumbnail: null,
    thumbnailUrl: null,
    members: 5,
    plansCount: 8,
    tasksCount: 12,
    progress: 40,
    isStarred: false,
  },
  {
    id: '3',
    title: 'Hospital Renovation',
    location: 'Boston, MA',
    status: 'active',
    lastVisited: '3 days ago',
    thumbnail: null,
    thumbnailUrl: null,
    members: 10,
    plansCount: 12,
    tasksCount: 18,
    progress: 45,
    isStarred: false,
  },
  {
    id: '4',
    title: 'Shopping Mall',
    location: 'Dallas, TX',
    status: 'active',
    lastVisited: '1 week ago',
    thumbnail: null,
    thumbnailUrl: null,
    members: 6,
    plansCount: 28,
    tasksCount: 42,
    progress: 30,
    isStarred: false,
  }
];

// Sample tasks data
const sampleTasks = [
  {
    id: '1',
    title: 'Review contractor proposal',
    project: 'Office Tower',
    dueDate: '2023-04-15',
    status: 'pending',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Schedule building inspection',
    project: 'Washington Elementary',
    dueDate: '2023-04-12',
    status: 'in-progress',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Approve material orders',
    project: 'Hospital Renovation',
    dueDate: '2023-04-18',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: '4',
    title: 'Update maintenance schedule',
    project: 'Shopping Mall',
    dueDate: '2023-04-20',
    status: 'completed',
    priority: 'low'
  },
  {
    id: '5',
    title: 'Review architectural changes',
    project: 'Office Tower',
    dueDate: '2023-04-10',
    status: 'overdue',
    priority: 'high'
  }
];

interface Project {
  id: string;
  title: string;
  location: string;
  status: string;
  lastVisited: string;
  thumbnail: File | null;
  thumbnailUrl?: string | null;
  members: number;
  plansCount: number;
  tasksCount: number;
  progress: number;
  isStarred: boolean;
}

interface Task {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [tasks, setTasks] = useState(sampleTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // In a real application, you would filter projects based on the search query
  };

  // Add error handling wrapper for component rendering
  useEffect(() => {
    try {
      // Initialize any needed data or connections here
      console.log("Dashboard component mounted successfully");
    } catch (err) {
      console.error("Error initializing dashboard:", err);
      setError("Failed to initialize dashboard. Please try refreshing the page.");
    }
  }, []);

  // Calculate dashboard statistics - with error handling
  let totalProjects = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let upcomingDeadlines = 0;

  try {
    totalProjects = projects?.length || 0;
    totalTasks = tasks?.length || 0;
    completedTasks = tasks?.filter(task => task?.status === 'completed')?.length || 0;
    upcomingDeadlines = tasks?.filter(task => 
      task?.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
      task?.status !== 'completed'
    )?.length || 0;
  } catch (err) {
    console.error("Error calculating dashboard statistics:", err);
  }

  // If there's an error, show error message
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search projects..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTasks - completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingDeadlines}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Link href="/projects" className="text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.isArray(projects) && projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Tasks</h2>
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map(task => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{task.project}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 