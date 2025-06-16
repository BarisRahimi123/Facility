import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ModalProps,
  ROOM_FUNCTIONS,
  SYSTEM_TYPES,
  SYSTEM_CONDITIONS,
  RoomData,
  SystemData,
  RenovationData,
} from '@/types/modals'

const roomSchema = z.object({
  number: z.string(),
  function: z.nativeEnum(ROOM_FUNCTIONS),
  squareFootage: z.number().min(0),
  floorNumber: z.number().min(0),
  capacity: z.number().min(0),
}) satisfies z.ZodType<RoomData>

const systemSchema = z.object({
  type: z.nativeEnum(SYSTEM_TYPES),
  condition: z.nativeEnum(SYSTEM_CONDITIONS),
  installationDate: z.string(),
  lastMaintenanceDate: z.string(),
}) satisfies z.ZodType<SystemData>

const renovationSchema = z.object({
  scope_of_work: z.string(),
  status: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  budget: z.number().min(0),
  contractor: z.string(),
}) satisfies z.ZodType<RenovationData>

export function RoomModal({ isOpen, onClose, onSubmit, buildingId }: ModalProps) {
  const form = useForm<RoomData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      number: '',
      function: ROOM_FUNCTIONS.Classroom,
      squareFootage: 0,
      floorNumber: 0,
      capacity: 0,
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Room</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit({ ...data, buildingId }))}>
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="function"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Function</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select function" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ROOM_FUNCTIONS).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="submit">Add Room</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function SystemModal({ isOpen, onClose, onSubmit, buildingId }: ModalProps) {
  const form = useForm<SystemData>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      type: SYSTEM_TYPES.HVAC,
      condition: SYSTEM_CONDITIONS.Good,
      installationDate: '',
      lastMaintenanceDate: '',
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add System</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit({ ...data, buildingId }))}>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SYSTEM_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SYSTEM_CONDITIONS).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="submit">Add System</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function RenovationModal({ isOpen, onClose, onSubmit, buildingId }: ModalProps) {
  const form = useForm<RenovationData>({
    resolver: zodResolver(renovationSchema),
    defaultValues: {
      scope_of_work: '',
      status: 'Planned',
      start_date: '',
      end_date: '',
      budget: 0,
      contractor: '',
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Renovation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit({ ...data, buildingId }))}>
            <FormField
              control={form.control}
              name="scope_of_work"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope of Work</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contractor</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit">Add Renovation</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function FilesModal({ isOpen, onClose, onSubmit, buildingId }: ModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ files: selectedFiles, buildingId })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Referenced Files</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FormItem>
            <FormLabel>Select Files</FormLabel>
            <FormControl>
              <Input type="file" multiple onChange={handleFileChange} />
            </FormControl>
          </FormItem>
          <Button type="submit">Add Files</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
