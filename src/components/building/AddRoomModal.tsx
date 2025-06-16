'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/app/actions/buildings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface AddRoomModalProps {
  buildingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const roomFunctions = [
  'Classroom',
  'Office',
  'Conference',
  'Laboratory',
  'Storage',
  'Restroom',
  'Mechanical',
  'Electrical',
  'Cafeteria',
  'Library',
  'Gymnasium',
  'Auditorium',
  'Other'
];

export default function AddRoomModal({ buildingId, isOpen, onClose }: AddRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('building_id', buildingId);
      
      await createRoom(formData);
      
      toast({
        title: 'Room added',
        description: 'The room has been added successfully.',
        variant: 'success',
      });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error adding room:', error);
      toast({
        title: 'Failed to add room',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Room</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new room to this building.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_number" className="text-right text-gray-300">
                Room Number
              </Label>
              <Input
                id="room_number"
                name="room_number"
                placeholder="101"
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_function" className="text-right text-gray-300">
                Function
              </Label>
              <Select name="room_function" required>
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue placeholder="Select function" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {roomFunctions.map((func) => (
                    <SelectItem key={func} value={func} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                      {func}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="square_footage" className="text-right text-gray-300">
                Square Footage
              </Label>
              <Input
                id="square_footage"
                name="square_footage"
                type="number"
                placeholder="500"
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right text-gray-300">
                Capacity
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                placeholder="30"
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="floor" className="text-right text-gray-300">
                Floor
              </Label>
              <Input
                id="floor"
                name="floor"
                placeholder="1"
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 