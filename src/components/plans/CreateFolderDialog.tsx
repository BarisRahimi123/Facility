'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createFolder } from '@/app/actions/plans';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CreateFolderDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [phase, setPhase] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('discipline', discipline);
      formData.append('phase', phase);

      const folder = await createFolder(formData);
      
      toast({
        title: 'Folder created',
        description: `"${name}" folder has been created successfully.`,
        variant: 'success',
      });
      
      setOpen(false);
      setName('');
      setDiscipline('');
      setPhase('');
      router.refresh();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Failed to create folder',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Create Folder</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new folder to organize your facility plans.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-gray-300">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                placeholder="Enter folder name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discipline" className="text-right text-gray-300">
                Discipline
              </Label>
              <Select 
                value={discipline} 
                onValueChange={setDiscipline}
                required
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500" id="discipline">
                  <SelectValue placeholder="Select discipline" className="text-gray-400" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="architectural" className="text-gray-300 focus:bg-gray-700 focus:text-white">Architectural</SelectItem>
                  <SelectItem value="structural" className="text-gray-300 focus:bg-gray-700 focus:text-white">Structural</SelectItem>
                  <SelectItem value="mechanical" className="text-gray-300 focus:bg-gray-700 focus:text-white">Mechanical</SelectItem>
                  <SelectItem value="electrical" className="text-gray-300 focus:bg-gray-700 focus:text-white">Electrical</SelectItem>
                  <SelectItem value="plumbing" className="text-gray-300 focus:bg-gray-700 focus:text-white">Plumbing</SelectItem>
                  <SelectItem value="civil" className="text-gray-300 focus:bg-gray-700 focus:text-white">Civil</SelectItem>
                  <SelectItem value="landscaping" className="text-gray-300 focus:bg-gray-700 focus:text-white">Landscaping</SelectItem>
                  <SelectItem value="interiors" className="text-gray-300 focus:bg-gray-700 focus:text-white">Interiors</SelectItem>
                  <SelectItem value="fire_protection" className="text-gray-300 focus:bg-gray-700 focus:text-white">Fire Protection</SelectItem>
                  <SelectItem value="technology" className="text-gray-300 focus:bg-gray-700 focus:text-white">Technology</SelectItem>
                  <SelectItem value="other" className="text-gray-300 focus:bg-gray-700 focus:text-white">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phase" className="text-right text-gray-300">
                Phase
              </Label>
              <Select 
                value={phase} 
                onValueChange={setPhase}
                required
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500" id="phase">
                  <SelectValue placeholder="Select phase" className="text-gray-400" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="schematic" className="text-gray-300 focus:bg-gray-700 focus:text-white">Schematic Design</SelectItem>
                  <SelectItem value="design_development" className="text-gray-300 focus:bg-gray-700 focus:text-white">Design Development</SelectItem>
                  <SelectItem value="construction_documents" className="text-gray-300 focus:bg-gray-700 focus:text-white">Construction Documents</SelectItem>
                  <SelectItem value="bidding" className="text-gray-300 focus:bg-gray-700 focus:text-white">Bidding</SelectItem>
                  <SelectItem value="construction" className="text-gray-300 focus:bg-gray-700 focus:text-white">Construction</SelectItem>
                  <SelectItem value="as_built" className="text-gray-300 focus:bg-gray-700 focus:text-white">As-Built</SelectItem>
                  <SelectItem value="closeout" className="text-gray-300 focus:bg-gray-700 focus:text-white">Closeout</SelectItem>
                  <SelectItem value="other" className="text-gray-300 focus:bg-gray-700 focus:text-white">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 