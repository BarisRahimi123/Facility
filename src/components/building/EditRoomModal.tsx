'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateRoom } from '@/app/actions/buildings';
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
import { Calculator, Info } from 'lucide-react';
import {
  calculateCapacityByCode,
  getCapacityCalculationDescription,
  getAvailableRoomFunctions,
} from '@/utils/capacityCalculator';

interface EditRoomModalProps {
  room: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditRoomModal({ room, isOpen, onClose }: EditRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFunction, setRoomFunction] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [occupancy, setOccupancy] = useState('');
  const [floor, setFloor] = useState('');
  const [isOccupancyManual, setIsOccupancyManual] = useState(false);
  
  const roomFunctions = getAvailableRoomFunctions();

  // Initialize form values when room changes
  useEffect(() => {
    if (room) {
      setRoomNumber(room.room_number || '');
      setRoomFunction(room.room_function || '');
      setSquareFootage(room.square_footage?.toString() || '');
      setOccupancy(room.capacity?.toString() || '');
      setFloor(room.floor || '');
      
      // If room has existing capacity, assume it was manually set
      setIsOccupancyManual(!!room.capacity);
    }
  }, [room]);

  // Calculate occupancy automatically when room function or square footage changes
  useEffect(() => {
    if (roomFunction && squareFootage && !isOccupancyManual) {
      const sqFt = parseInt(squareFootage);
      if (!isNaN(sqFt) && sqFt > 0) {
        const calculatedOccupancy = calculateCapacityByCode(roomFunction, sqFt);
        setOccupancy(calculatedOccupancy.toString());
      }
    }
  }, [roomFunction, squareFootage, isOccupancyManual]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('room_number', roomNumber);
      formData.append('room_function', roomFunction);
      formData.append('square_footage', squareFootage);
      if (occupancy) formData.append('capacity', occupancy);
      if (floor) formData.append('floor', floor);
      
      await updateRoom(room.id, formData);
      
      toast({
        title: 'Room updated',
        description: 'The room has been updated successfully.',
        variant: 'success',
      });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error updating room:', error);
      toast({
        title: 'Failed to update room',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Edit Room</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the details for this room.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_number" className="text-right text-gray-300">
                Room Number
              </Label>
              <Input
                id="room_number"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="101"
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_function" className="text-right text-gray-300">
                Function
              </Label>
              <Select value={roomFunction} onValueChange={setRoomFunction} required>
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
                type="number"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
                placeholder="500"
                className="col-span-3 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right text-gray-300">
                  Occupancy
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="relative">
                    <Input
                      id="capacity"
                      type="number"
                      value={occupancy}
                      onChange={(e) => {
                        setOccupancy(e.target.value);
                        setIsOccupancyManual(true);
                      }}
                      placeholder="30"
                      className={`pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500 ${
                        !isOccupancyManual && occupancy ? 'bg-gray-800/70' : ''
                      }`}
                    />
                    {!isOccupancyManual && occupancy && (
                      <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                    )}
                  </div>
                  {roomFunction && squareFootage && (
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500">
                        {isOccupancyManual ? (
                          <>
                            Manual override. Auto-calculated: {calculateCapacityByCode(roomFunction, parseInt(squareFootage) || 0)} people
                            <button
                              type="button"
                              onClick={() => {
                                setIsOccupancyManual(false);
                                const calculated = calculateCapacityByCode(roomFunction, parseInt(squareFootage) || 0);
                                setOccupancy(calculated.toString());
                              }}
                              className="ml-1 text-purple-400 hover:text-purple-300 underline"
                            >
                              Use calculated
                            </button>
                          </>
                        ) : (
                          getCapacityCalculationDescription(roomFunction)
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="floor" className="text-right text-gray-300">
                Floor
              </Label>
              <Input
                id="floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
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
              {loading ? 'Updating...' : 'Update Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 