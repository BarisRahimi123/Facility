'use client';

import { useState, useEffect } from 'react';
import { Plus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskList from '@/components/maintenance/TaskList';
import { getTasks } from '@/lib/db/tasks';
import type { MaintenanceTask } from '@/types/maintenance';
import { useToast } from '@/components/ui/use-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (error) {
        console.error('Error loading tasks:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tasks. Please refresh the page.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [toast]);

  const generateShareableLink = async () => {
    if (isGeneratingLink) return;
    
    setIsGeneratingLink(true);
    try {
      // Generate a token with 24-hour expiration
      const response = await fetch('/api/tokens/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresIn: 24,
          metadata: {
            type: 'issue_report',
            defaultSystem: 'HVAC',
            defaultLocation: 'Building A'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate shareable link');
      }

      const data = await response.json();
      if (!data.success || !data.data?.token) {
        throw new Error(data.error || 'Invalid response from server');
      }

      // Create the shareable URL
      const baseUrl = window.location.origin;
      const url = new URL(`${baseUrl}/report/${data.data.token}`);
      
      // Add optional default parameters
      url.searchParams.set('system', 'HVAC');
      url.searchParams.set('location', 'Building A');
      
      // Copy to clipboard
      const shareableUrl = url.toString();
      await navigator.clipboard.writeText(shareableUrl);
      
      toast({
        title: 'Link Created',
        description: 'Shareable link has been copied to your clipboard. It will expire in 24 hours.',
      });
    } catch (error) {
      console.error('Error generating shareable link:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate shareable link. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Maintenance Tasks</h1>
        <div className="flex gap-2">
          <Button 
            onClick={generateShareableLink} 
            variant="outline"
            disabled={isGeneratingLink}
          >
            <Share2 className="w-4 h-4 mr-2" />
            {isGeneratingLink ? 'Generating...' : 'Share Issue Form'}
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>
      
      <TaskList tasks={tasks} />
    </div>
  );
} 