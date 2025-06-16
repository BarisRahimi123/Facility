'use client';

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { createBuildingSystem } from "@/app/actions/buildings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuildingSystemType, SystemCondition, MaintenanceFrequency } from "@/types/building";

interface AddBuildingSystemFormProps {
  buildingId: string;
  onSuccess: () => void;
}

interface SystemField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: string[];
}

const SYSTEM_TYPES = [
  'HVAC',
  'AC',
  'Electrical',
  'Plumbing',
  'Roofing',
  'Fire Safety',
  'Security',
  'IT Infrastructure',
  'Other'
] as const;

const CONDITIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Critical'
] as const;

const MAINTENANCE_FREQUENCIES = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semi_annually',
  'annually'
] as const;

const SYSTEM_SPECIFIC_FIELDS: Record<BuildingSystemType, SystemField[]> = {
  'HVAC': [
    { name: 'cooling_capacity', label: 'Cooling Capacity (BTU/hr)', type: 'number' },
    { name: 'heating_capacity', label: 'Heating Capacity (BTU/hr)', type: 'number' },
    { name: 'air_flow_rate', label: 'Air Flow Rate (CFM)', type: 'number' },
    { name: 'energy_efficiency', label: 'Energy Efficiency Rating (SEER)', type: 'number' },
    { name: 'refrigerant_type', label: 'Refrigerant Type', type: 'text' },
    { name: 'zone_coverage', label: 'Zone Coverage', type: 'text', placeholder: 'Enter zones (comma-separated)' }
  ],
  'AC': [
    { name: 'cooling_capacity', label: 'Cooling Capacity (BTU/hr)', type: 'number' },
    { name: 'air_flow_rate', label: 'Air Flow Rate (CFM)', type: 'number' },
    { name: 'energy_efficiency', label: 'Energy Efficiency Rating (SEER)', type: 'number' },
    { name: 'refrigerant_type', label: 'Refrigerant Type', type: 'text' },
    { name: 'zone_coverage', label: 'Zone Coverage', type: 'text', placeholder: 'Enter zones (comma-separated)' }
  ],
  'Electrical': [
    { name: 'voltage_rating', label: 'Voltage Rating (V)', type: 'number' },
    { name: 'amperage_rating', label: 'Amperage Rating (A)', type: 'number' },
    { name: 'phase_type', label: 'Phase Type', type: 'select', options: ['Single', 'Three'] },
    { name: 'number_of_circuits', label: 'Number of Circuits', type: 'number' },
    { name: 'main_breaker_size', label: 'Main Breaker Size (A)', type: 'number' },
    { name: 'service_type', label: 'Service Type', type: 'text' }
  ],
  'Plumbing': [
    { name: 'pipe_material', label: 'Pipe Material', type: 'text' },
    { name: 'pipe_size', label: 'Pipe Size', type: 'text' },
    { name: 'water_heater_make', label: 'Water Heater Make', type: 'text' },
    { name: 'water_heater_model', label: 'Water Heater Model', type: 'text' },
    { name: 'water_heater_capacity', label: 'Water Heater Capacity (gallons)', type: 'number' },
    { name: 'pressure_rating', label: 'Pressure Rating (PSI)', type: 'number' },
    { name: 'backflow_prevention_type', label: 'Backflow Prevention Type', type: 'text' },
    { name: 'water_source', label: 'Water Source', type: 'text' },
    { name: 'waste_system_type', label: 'Waste System Type', type: 'text' }
  ],
  'Roofing': [
    { name: 'material_type', label: 'Material Type', type: 'text' },
    { name: 'r_value', label: 'R-Value', type: 'number' },
    { name: 'surface_area', label: 'Surface Area (sq ft)', type: 'number' },
    { name: 'drainage_system_type', label: 'Drainage System Type', type: 'text' },
    { name: 'last_inspection_date', label: 'Last Inspection Date', type: 'date' },
    { name: 'expected_lifespan', label: 'Expected Lifespan (years)', type: 'number' }
  ],
  'Fire Safety': [
    { name: 'number_of_zones', label: 'Number of Zones', type: 'number' },
    { name: 'sprinkler_type', label: 'Sprinkler Type', type: 'text' },
    { name: 'fire_alarm_type', label: 'Fire Alarm Type', type: 'text' },
    { name: 'monitoring_service', label: 'Monitoring Service', type: 'text' },
    { name: 'certification_date', label: 'Certification Date', type: 'date' },
    { name: 'inspection_frequency', label: 'Inspection Frequency', type: 'text' }
  ],
  'Security': [
    { name: 'control_panel_make', label: 'Control Panel Make', type: 'text' },
    { name: 'control_panel_model', label: 'Control Panel Model', type: 'text' },
    { name: 'camera_system_make', label: 'Camera System Make', type: 'text' },
    { name: 'camera_system_model', label: 'Camera System Model', type: 'text' },
    { name: 'number_of_cameras', label: 'Number of Cameras', type: 'number' },
    { name: 'access_control_type', label: 'Access Control Type', type: 'text' },
    { name: 'monitoring_service', label: 'Monitoring Service', type: 'text' },
    { name: 'backup_system_type', label: 'Backup System Type', type: 'text' },
    { name: 'coverage_areas', label: 'Coverage Areas', type: 'text', placeholder: 'Enter areas (comma-separated)' }
  ],
  'IT Infrastructure': [
    { name: 'network_equipment_make', label: 'Network Equipment Make', type: 'text' },
    { name: 'network_equipment_model', label: 'Network Equipment Model', type: 'text' },
    { name: 'server_types', label: 'Server Types', type: 'text', placeholder: 'Enter types (comma-separated)' },
    { name: 'bandwidth_capacity', label: 'Bandwidth Capacity', type: 'text' },
    { name: 'backup_systems', label: 'Backup Systems', type: 'text' },
    { name: 'ups_make', label: 'UPS Make', type: 'text' },
    { name: 'ups_model', label: 'UPS Model', type: 'text' },
    { name: 'ups_capacity', label: 'UPS Capacity', type: 'text' },
    { name: 'cable_category', label: 'Cable Category', type: 'text' },
    { name: 'number_of_data_points', label: 'Number of Data Points', type: 'number' },
    { name: 'wireless_coverage', label: 'Wireless Coverage Areas', type: 'text', placeholder: 'Enter areas (comma-separated)' }
  ],
  'Other': []
};

export function AddBuildingSystemForm({ buildingId, onSuccess }: AddBuildingSystemFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<BuildingSystemType>("HVAC");
  const [maintenanceFrequency, setMaintenanceFrequency] = useState<MaintenanceFrequency>("monthly");
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const { toast } = useToast();

  const getSystemNamePlaceholder = (type: BuildingSystemType) => {
    switch (type) {
      case 'HVAC': return 'Main Building HVAC System';
      case 'AC': return 'Main Building AC System';
      case 'Electrical': return 'Main Electrical Distribution System';
      case 'Plumbing': return 'Main Water Supply System';
      case 'Roofing': return 'Main Building Roof';
      case 'Fire Safety': return 'Fire Alarm System';
      case 'Security': return 'Building Security System';
      case 'IT Infrastructure': return 'Network Infrastructure';
      default: return 'System Name';
    }
  };

  const getModelPlaceholder = (type: BuildingSystemType) => {
    switch (type) {
      case 'HVAC': return 'e.g., RTU-2000';
      case 'AC': return 'e.g., AC-5000';
      case 'Electrical': return 'e.g., PD-Series 800A';
      case 'Plumbing': return 'e.g., PEX-1000';
      case 'Roofing': return 'e.g., TPO-60';
      case 'Fire Safety': return 'e.g., FA-100';
      case 'Security': return 'e.g., SEC-2000';
      case 'IT Infrastructure': return 'e.g., NET-5000';
      default: return 'Model Number';
    }
  };

  const getManufacturerPlaceholder = (type: BuildingSystemType) => {
    switch (type) {
      case 'HVAC': return 'e.g., Carrier, Trane';
      case 'Electrical': return 'e.g., Square D, Siemens';
      case 'Plumbing': return 'e.g., Viega, Uponor';
      case 'Roofing': return 'e.g., GAF, Firestone';
      case 'Fire Safety': return 'e.g., Honeywell, Simplex';
      case 'Security': return 'e.g., Bosch, Hikvision';
      case 'IT Infrastructure': return 'e.g., Cisco, HP';
      default: return 'Manufacturer Name';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Validate required fields
      const name = formData.get('name');
      const installationDate = formData.get('installationDate');
      const condition = formData.get('condition');
      const maintenanceSchedule = formData.get('maintenanceSchedule');
      
      if (!name || !installationDate || !condition || !maintenanceSchedule) {
        throw new Error('Please fill in all required fields');
      }

      formData.append('buildingId', buildingId);
      formData.append('systemType', selectedType);

      await createBuildingSystem(formData);

      toast({
        title: "Success",
        description: "System has been added successfully",
        variant: "success",
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating system:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add system. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Required Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="systemType" className="required">System Type</Label>
            <Select
              name="systemType"
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as BuildingSystemType)}
            >
              <SelectTrigger id="systemType" className="w-full bg-white">
                <SelectValue placeholder="Select system type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {SYSTEM_TYPES.map((type) => (
                  <SelectItem 
                    key={type} 
                    value={type}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name" className="required">System Name</Label>
            <Input
              id="name"
              name="name"
              placeholder={getSystemNamePlaceholder(selectedType)}
              required
            />
          </div>

          <div>
            <Label htmlFor="installationDate" className="required">Installation Date</Label>
            <Input
              id="installationDate"
              name="installationDate"
              type="date"
              required
            />
          </div>

          <div>
            <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
            <Input
              id="warrantyExpiry"
              name="warrantyExpiry"
              type="date"
            />
          </div>

          <div>
            <Label htmlFor="condition" className="required">Condition</Label>
            <Select name="condition" defaultValue="Good">
              <SelectTrigger id="condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maintenanceSchedule" className="required">Maintenance Schedule</Label>
            <Select
              name="maintenanceSchedule"
              value={maintenanceFrequency}
              onValueChange={(value) => setMaintenanceFrequency(value as MaintenanceFrequency)}
            >
              <SelectTrigger id="maintenanceSchedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Optional Fields Toggle */}
      <div className="border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="w-full flex items-center justify-center gap-2"
        >
          {showOptionalFields ? (
            <>Hide Optional Fields <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Show Optional Fields <ChevronDown className="h-4 w-4" /></>
          )}
        </Button>
      </div>

      {/* Optional Fields */}
      {showOptionalFields && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                name="manufacturer"
                placeholder={getManufacturerPlaceholder(selectedType)}
              />
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                placeholder={getModelPlaceholder(selectedType)}
              />
            </div>

            <div>
              <Label htmlFor="lastMaintenanceDate">Last Maintenance Date</Label>
              <Input
                id="lastMaintenanceDate"
                name="lastMaintenanceDate"
                type="date"
              />
            </div>

            <div>
              <Label htmlFor="nextMaintenanceDate">Next Maintenance Date</Label>
              <Input
                id="nextMaintenanceDate"
                name="nextMaintenanceDate"
                type="date"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="maintenanceDescription">Maintenance Notes</Label>
              <textarea
                id="maintenanceDescription"
                name="maintenanceDescription"
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Enter any maintenance notes or special instructions"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Add System'
          )}
        </Button>
      </div>
    </form>
  );
} 