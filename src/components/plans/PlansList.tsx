'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { deletePlan, type Plan } from '@/app/actions/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import {
  Eye,
  Download,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  FileImage,
} from 'lucide-react';

interface PlansListProps {
  plans: Plan[];
  folderId: string;
}

export default function PlansList({ plans, folderId }: PlansListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const getPlanIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) {
      return <FileImage className="w-10 h-10 text-blue-400" />;
    }
    if (['pdf', 'dwg', 'dxf'].includes(type)) {
      return <FileText className="w-10 h-10 text-red-400" />;
    }
    return <FileText className="w-10 h-10 text-gray-400" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    
    setIsDeleting(id);
    try {
      await deletePlan(id);
      toast({
        title: 'Plan deleted',
        description: 'The plan has been deleted successfully.',
        variant: 'success',
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Failed to delete plan',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className="overflow-hidden bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors">
          <div className="aspect-video relative bg-gray-900 flex items-center justify-center">
            {plan.thumbnail_url ? (
              <Image
                src={plan.thumbnail_url}
                alt={plan.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              getPlanIcon(plan.type)
            )}
          </div>
          
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <h3 className="font-semibold truncate text-white">{plan.title}</h3>
                <p className="text-sm text-gray-400 truncate">{plan.name}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-600 hover:bg-gray-700">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    <Link href={`/plans/${folderId}/${plan.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>View Details</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    <Link href={`/plans/${folderId}/edit/${plan.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    <a href={plan.url || '#'} target="_blank" rel="noopener noreferrer">
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Open</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    <a href={plan.url || '#'} download>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(plan.id)}
                    disabled={isDeleting === plan.id}
                    className="text-red-400 hover:bg-gray-700 hover:text-red-300 focus:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{isDeleting === plan.id ? 'Deleting...' : 'Delete'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-col gap-1 mt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sheet #:</span>
                <span className="text-gray-300">{plan.sheet_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Revision:</span>
                <span className="text-gray-300">{plan.revision}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scale:</span>
                <span className="text-gray-300">{plan.scale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="text-gray-300">{plan.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Size:</span>
                <span className="text-gray-300">{formatFileSize(plan.size)}</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="p-4 pt-0 text-xs text-gray-500 border-t border-gray-700">
            <div className="w-full flex justify-between">
              <span>Uploaded: {formatDate(plan.uploaded_at)}</span>
              <span>v{plan.version}</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 