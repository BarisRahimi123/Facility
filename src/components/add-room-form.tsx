'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddRoomFormProps {
  buildingId: string;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function AddRoomForm({ buildingId, onClose, onSave }: AddRoomFormProps) {
  const [formData, setFormData] = useState({
    room_number: '',
    room_function: '',
    square_footage: 0,
    floor: '',
    capacity: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="room_number">Room Number</Label>
        <Input
          id="room_number"
          value={formData.room_number}
          onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="room_function">Room Function</Label>
        <Select value={formData.room_function} onValueChange={(value) => setFormData(prev => ({ ...prev, room_function: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select function" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <SelectItem value="Classroom">Classroom</SelectItem>
            <SelectItem value="Laboratory">Laboratory</SelectItem>
            <SelectItem value="Library">Library</SelectItem>
            <SelectItem value="Auditorium">Auditorium</SelectItem>
            <SelectItem value="Gymnasium">Gymnasium</SelectItem>
            <SelectItem value="Office">Office</SelectItem>
            <SelectItem value="Conference">Conference</SelectItem>
            <SelectItem value="Reception">Reception</SelectItem>
            <SelectItem value="Break Room">Break Room</SelectItem>
            <SelectItem value="Medical Office">Medical Office</SelectItem>
            <SelectItem value="Treatment Room">Treatment Room</SelectItem>
            <SelectItem value="Patient Room">Patient Room</SelectItem>
            <SelectItem value="Storage">Storage</SelectItem>
            <SelectItem value="Mechanical">Mechanical</SelectItem>
            <SelectItem value="Janitorial">Janitorial</SelectItem>
            <SelectItem value="Electrical">Electrical</SelectItem>
            <SelectItem value="Restroom">Restroom</SelectItem>
            <SelectItem value="Hallway">Hallway</SelectItem>
            <SelectItem value="Lobby">Lobby</SelectItem>
            <SelectItem value="Cafeteria">Cafeteria</SelectItem>
            <SelectItem value="Kitchen">Kitchen</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="square_footage">Square Footage</Label>
        <Input
          id="square_footage"
          type="number"
          value={formData.square_footage}
          onChange={(e) => setFormData(prev => ({ ...prev, square_footage: parseInt(e.target.value) || 0 }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="floor">Floor</Label>
        <Input
          id="floor"
          value={formData.floor}
          onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          value={formData.capacity}
          onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Save Room
        </Button>
      </div>
    </form>
  );
} 