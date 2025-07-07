'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateBuilding } from '@/app/actions/buildings';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface EditBuildingModalProps {
  building: any;
  isOpen: boolean;
  onClose: () => void;
}

const buildingTypes = [
  'office',
  'residential',
  'commercial',
  'industrial',
  'educational',
  'healthcare',
  'retail',
  'warehouse',
  'mixed_use',
  'other'
];

export default function EditBuildingModal({ building, isOpen, onClose }: EditBuildingModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [buildingType, setBuildingType] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [constructionDate, setConstructionDate] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize form values when building changes
  useEffect(() => {
    if (building) {
      console.log('EditBuildingModal received building data:', JSON.stringify(building, null, 2));
      
      setName(building.name || '');
      setBuildingNumber(building.building_number || '');
      setBuildingType(building.building_type || '');
      setSquareFootage(building.square_footage?.toString() || '');
      setConstructionDate(building.construction_date || '');
      setYearBuilt(building.year_built?.toString() || '');
      setNotes(building.notes || '');
    }
  }, [building]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('building_number', buildingNumber);
      formData.append('building_type', buildingType);
      formData.append('square_footage', squareFootage);
      formData.append('construction_date', constructionDate);
      formData.append('year_built', yearBuilt);
      formData.append('notes', notes);
      
      console.log('Submitting building data:', {
        name,
        building_number: buildingNumber,
        building_type: buildingType,
        square_footage: squareFootage,
        construction_date: constructionDate,
        year_built: yearBuilt,
        notes
      });
      
      await updateBuilding(building.id, formData);
      
      toast({
        title: 'Building updated',
        description: 'The building has been updated successfully.',
        variant: 'success',
      });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error updating building:', error);
      toast({
        title: 'Failed to update building',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (!building) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Edit Building</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the details for this building.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-300 mb-2 block">
                  Building Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Main Building"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="buildingNumber" className="text-gray-300 mb-2 block">
                  Building Number
                </Label>
                <Input
                  id="buildingNumber"
                  value={buildingNumber}
                  onChange={(e) => setBuildingNumber(e.target.value)}
                  placeholder="e.g., 1A, B-200"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buildingType" className="text-gray-300 mb-2 block">
                  Building Type *
                </Label>
                <Select value={buildingType} onValueChange={setBuildingType} required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {buildingTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="squareFootage" className="text-gray-300 mb-2 block">
                  Square Footage *
                </Label>
                <Input
                  id="squareFootage"
                  type="number"
                  value={squareFootage}
                  onChange={(e) => setSquareFootage(e.target.value)}
                  placeholder="e.g., 5000"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="constructionDate" className="text-gray-300 mb-2 block">
                  Construction Date
                </Label>
                <Input
                  id="constructionDate"
                  type="date"
                  value={constructionDate}
                  onChange={(e) => setConstructionDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="yearBuilt" className="text-gray-300 mb-2 block">
                  Year Built
                </Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="e.g., 2010"
                  min="1800"
                  max={new Date().getFullYear()}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-300 mb-2 block">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about the building..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500 min-h-[80px]"
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
              {loading ? 'Updating...' : 'Update Building'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 