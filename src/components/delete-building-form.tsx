'use client';

import { Button } from '@/components/ui/button';
import { Building } from '@/types/building';

interface DeleteBuildingFormProps {
  building: Building;
  onClose: () => void;
  onDelete: (buildingId: string) => void;
}

export function DeleteBuildingForm({ building, onClose, onDelete }: DeleteBuildingFormProps) {
  const handleDelete = () => {
    onDelete(building.id);
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Are you sure you want to delete "{building.name}"? This action cannot be undone.
      </p>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Building
        </Button>
      </div>
    </div>
  );
} 