'use client';

import { useState } from 'react';
import { MaintenanceRequest, MaintenanceStats } from '@/types/maintenance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  AlertOctagon,
  XCircle,
  Plus,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  CheckSquare,
  XSquare,
  PlayCircle,
  StopCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface MaintenanceRequestListProps {
  requests: MaintenanceRequest[];
  stats: MaintenanceStats;
  onAddRequest: () => void;
  onEditRequest: (request: MaintenanceRequest) => void;
  onDeleteRequest: (request: MaintenanceRequest) => void;
  onUpdateStatus: (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => void;
  canManage?: boolean;
}

export default function MaintenanceRequestList({
  requests,
  stats,
  onAddRequest,
  onEditRequest,
  onDeleteRequest,
  onUpdateStatus,
  canManage = false,
}: MaintenanceRequestListProps) {
  const [selectedFilter, setSelectedFilter] = useState<MaintenanceRequest['status'] | 'all'>('all');

  const filteredRequests = selectedFilter === 'all' 
    ? requests 
    : requests.filter(request => request.status === selectedFilter);

  const getStatusBadge = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <CheckSquare className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Wrench className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            <StopCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'low':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Low
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Medium
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            High
          </Badge>
        );
      case 'urgent':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        );
      case 'emergency':
        return (
          <Badge variant="outline" className="bg-red-700/10 text-red-700 border-red-700/20">
            <AlertOctagon className="w-3 h-3 mr-1" />
            Emergency
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.in_progress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.by_priority.high + stats.by_priority.urgent + stats.by_priority.emergency}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Maintenance Requests</CardTitle>
            <Button onClick={onAddRequest}>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No maintenance requests</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first maintenance request
              </p>
              <Button onClick={onAddRequest}>
                <Plus className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.title}</div>
                          {request.room_id && (
                            <div className="text-xs text-muted-foreground">
                              Room: {request.room_id}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{request.type}</TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.due_date ? format(new Date(request.due_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {request.status === 'pending' && canManage && (
                              <>
                                <DropdownMenuItem onClick={() => onUpdateStatus(request, 'approved')}>
                                  <CheckSquare className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateStatus(request, 'rejected')}>
                                  <XSquare className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {request.status === 'approved' && canManage && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(request, 'in_progress')}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Start Work
                              </DropdownMenuItem>
                            )}
                            {request.status === 'in_progress' && canManage && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(request, 'completed')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                            {['pending', 'approved'].includes(request.status) && (
                              <>
                                <DropdownMenuItem onClick={() => onEditRequest(request)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateStatus(request, 'cancelled')}>
                                  <StopCircle className="mr-2 h-4 w-4" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                            {canManage && (
                              <DropdownMenuItem onClick={() => onDeleteRequest(request)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 