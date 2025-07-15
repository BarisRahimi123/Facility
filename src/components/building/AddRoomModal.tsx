'use client';

import { useState, useEffect } from 'react';
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
import { Calculator, Info, CheckCircle } from 'lucide-react';
import {
  calculateCapacityByCode,
  getCapacityCalculationDescription,
  getAvailableRoomFunctions,
} from '@/utils/capacityCalculator';

interface AddRoomModalProps {
  buildingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRoomModal({ buildingId, isOpen, onClose }: AddRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [roomFunction, setRoomFunction] = useState<string>('');
  const [squareFootage, setSquareFootage] = useState<string>('');
  const [occupancy, setOccupancy] = useState<string>('');
  const [isOccupancyManual, setIsOccupancyManual] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCreatedRoom, setLastCreatedRoom] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();
  
  const roomFunctions = getAvailableRoomFunctions();
  
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setShowSuccess(false);
    }
  }, [isOpen]);

  const resetForm = () => {
    setRoomFunction('');
    setSquareFootage('');
    setOccupancy('');
    setIsOccupancyManual(false);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('building_id', buildingId);
      
      // Ensure occupancy is included even if calculated
      if (occupancy) {
        formData.set('capacity', occupancy);
      }
      
      const roomNumber = formData.get('room_number')?.toString() || '';
      await createRoom(formData);
      
      // Show success state
      setLastCreatedRoom(roomNumber);
      setShowSuccess(true);
      
      // Refresh in background
      try {
        router.refresh();
      } catch (error) {
        console.warn('Failed to refresh router:', error);
      }
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

  const handleCreateAnother = () => {
    setShowSuccess(false);
    resetForm();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {showSuccess ? 'Room Created Successfully!' : 'Add Room'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {showSuccess 
              ? `Room ${lastCreatedRoom} has been added to the building.`
              : 'Add a new room to this building.'}
          </DialogDescription>
        </DialogHeader>
        
        {showSuccess ? (
          <div className="py-6">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <p className="text-center text-muted-foreground mb-6">
              Would you like to add another room or close this dialog?
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-border text-muted-foreground hover:bg-input hover:text-foreground"
              >
                Close
              </Button>
              <Button
                onClick={handleCreateAnother}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add Another Room
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_number" className="text-right text-muted-foreground">
                Room Number
              </Label>
              <Input
                id="room_number"
                name="room_number"
                placeholder="101"
                className="col-span-3 bg-input border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_function" className="text-right text-muted-foreground">
                Function
              </Label>
              <Select 
                name="room_function" 
                value={roomFunction}
                onValueChange={setRoomFunction}
                required
              >
                <SelectTrigger className="col-span-3 bg-input border-border text-foreground focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Select function" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-[300px] overflow-y-auto">
                  {roomFunctions.map((func) => (
                    <SelectItem key={func} value={func} className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">
                      {func}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="square_footage" className="text-right text-muted-foreground">
                Square Footage
              </Label>
              <Input
                id="square_footage"
                name="square_footage"
                type="number"
                placeholder="500"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
                className="col-span-3 bg-input border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right text-muted-foreground">
                  Occupancy
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="relative">
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      placeholder="30"
                      value={occupancy}
                      onChange={(e) => {
                        setOccupancy(e.target.value);
                        setIsOccupancyManual(true);
                      }}
                      className={`pr-10 bg-input border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary ${
                        !isOccupancyManual && occupancy ? 'bg-input/70' : ''
                      }`}
                    />
                    {!isOccupancyManual && occupancy && (
                      <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                    )}
                  </div>
                  {roomFunction && squareFootage && (
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
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
                              className="ml-1 text-primary hover:text-primary/80 underline"
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
              <Label htmlFor="floor" className="text-right text-muted-foreground">
                Floor
              </Label>
              <Input
                id="floor"
                name="floor"
                placeholder="1"
                className="col-span-3 bg-input border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary"
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-border text-muted-foreground hover:bg-input hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Room'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}        