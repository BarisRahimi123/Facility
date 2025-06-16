'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadPlan } from '@/app/actions/plans';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';

interface UploadPlanButtonProps {
  folderId: string;
}

export default function UploadPlanButton({ folderId }: UploadPlanButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('folderId', folderId);
    
    try {
      await uploadPlan(file, formData);
      
      toast({
        title: 'Plan uploaded',
        description: 'Your plan has been uploaded successfully.',
        variant: 'success',
      });
      
      setOpen(false);
      setFile(null);
      setFileName('');
      router.refresh();
    } catch (error) {
      console.error('Error uploading plan:', error);
      toast({
        title: 'Failed to upload plan',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Upload className="w-4 h-4" />
          <span>Upload Plan</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-gray-900 border-gray-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Upload Plan</DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload a new plan to this folder. Supported file types: PDF, DWG, DXF, JPG, PNG.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="file" className="text-gray-300">File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
                  className="flex-1 bg-gray-800 border-gray-700 text-white file:bg-gray-700 file:text-gray-300 file:border-0 file:mr-4 hover:file:bg-gray-600"
                  required
                />
              </div>
              {fileName && (
                <p className="text-sm text-gray-400">{fileName}</p>
              )}
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="name" className="text-gray-300">Display Name (optional)</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Display name for the file"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="title" className="text-gray-300">Title</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Plan title"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="description" className="text-gray-300">Description (optional)</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Brief description of the plan"
                rows={3}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="sheetNumber" className="text-gray-300">Sheet #</Label>
                <Input 
                  id="sheetNumber" 
                  name="sheetNumber" 
                  placeholder="A1.01"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div className="grid items-center gap-2">
                <Label htmlFor="revision" className="text-gray-300">Revision</Label>
                <Input 
                  id="revision" 
                  name="revision" 
                  placeholder="0"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div className="grid items-center gap-2">
                <Label htmlFor="scale" className="text-gray-300">Scale</Label>
                <Input 
                  id="scale" 
                  name="scale" 
                  placeholder="1:100"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!file || loading}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 