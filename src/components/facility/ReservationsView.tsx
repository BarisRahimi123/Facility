'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  List, 
  Search, 
  Filter, 
  User, 
  Clock, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  ChevronDown,
  FileText,
  Shield,
  Users,
  Calendar as CalendarIcon,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Reservation, Field } from '@/types/field';
import { useToast } from '@/components/ui/use-toast';
import { FieldCalendarView } from './FieldCalendarView';

interface ReservationsViewProps {
  facilityId: string;
  fields: Field[];
}

export function ReservationsView({ facilityId, fields }: ReservationsViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'funnel'>('table');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  
  // Modal states
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'request_resubmit'>('approve');
  const [approvalReason, setApprovalReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();

  // Mock reservations data for now
  useEffect(() => {
    // TODO: Replace with actual API call
    const mockReservations: Reservation[] = [
      {
        id: '1',
        field_id: fields[0]?.id || 'field-1',
        facility_id: facilityId,
        start_time: '2025-01-20T10:00:00Z',
        end_time: '2025-01-20T12:00:00Z',
        booking_type: 'hourly',
        renter_name: 'John Smith',
        renter_email: 'john.smith@email.com',
        renter_phone: '(555) 123-4567',
        organization_name: 'Youth Soccer League',
        purpose_of_use: 'Soccer practice for ages 8-10',
        estimated_attendees: 20,
        total_amount: 100.00,
        hourly_rate: 50.00,
        discount_amount: 0,
        tax_amount: 8.50,
        deposit_amount: 25.00,
        status: 'confirmed',
        approval_required: false,
        payment_status: 'paid',
        paid_amount: 100.00,
        liability_waiver_signed: true,
        created_at: '2025-01-15T09:00:00Z',
        updated_at: '2025-01-15T09:00:00Z'
      },
      {
        id: '2',
        field_id: fields[0]?.id || 'field-1',
        facility_id: facilityId,
        start_time: '2025-01-22T14:00:00Z',
        end_time: '2025-01-22T23:59:59Z',
        booking_type: 'daily',
        renter_name: 'Sarah Johnson',
        renter_email: 'sarah.johnson@school.edu',
        renter_phone: '(555) 987-6543',
        organization_name: 'Lincoln High School',
        purpose_of_use: 'Annual sports day event',
        estimated_attendees: 150,
        total_amount: 300.00,
        daily_rate: 300.00,
        discount_amount: 0,
        tax_amount: 25.50,
        deposit_amount: 75.00,
        status: 'pending',
        approval_required: true,
        payment_status: 'pending',
        paid_amount: 0,
        liability_waiver_signed: false,
        created_at: '2025-01-18T15:30:00Z',
        updated_at: '2025-01-18T15:30:00Z'
      },
      {
        id: '3',
        field_id: fields[1]?.id || 'field-2',
        facility_id: facilityId,
        start_time: '2025-01-25T09:00:00Z',
        end_time: '2025-01-25T11:00:00Z',
        booking_type: 'hourly',
        renter_name: 'Mike Rodriguez',
        renter_email: 'mike.r@company.com',
        renter_phone: '(555) 456-7890',
        organization_name: 'Corporate Fitness Group',
        purpose_of_use: 'Team building activities',
        estimated_attendees: 30,
        total_amount: 120.00,
        hourly_rate: 60.00,
        discount_amount: 10.00,
        tax_amount: 9.35,
        deposit_amount: 30.00,
        status: 'confirmed',
        approval_required: false,
        payment_status: 'partial',
        paid_amount: 60.00,
        liability_waiver_signed: true,
        created_at: '2025-01-16T11:20:00Z',
        updated_at: '2025-01-19T14:15:00Z'
      }
    ];

    setReservations(mockReservations);
    setFilteredReservations(mockReservations);
    setIsLoading(false);
  }, [facilityId, fields]);

  // Filter reservations based on search and filters
  useEffect(() => {
    let filtered = reservations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.renter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.renter_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    // Field filter
    if (fieldFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.field_id === fieldFilter);
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter, fieldFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getFieldName = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.name || 'Unknown Field';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getTotalRevenue = () => {
    return filteredReservations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + r.total_amount, 0);
  };

  const getUpcomingReservations = () => {
    const now = new Date();
    return filteredReservations.filter(r => new Date(r.start_time) > now).length;
  };

  // Funnel calculations
  const getFunnelData = () => {
    const total = filteredReservations.length;
    
    const stages = [
      {
        id: 'inquiry',
        name: 'Inquiries',
        description: 'All reservation requests',
        count: total,
        revenue: filteredReservations.reduce((sum, r) => sum + r.total_amount, 0),
        color: 'bg-blue-500',
        reservations: filteredReservations
      },
      {
        id: 'pending',
        name: 'Pending Approval',
        description: 'Awaiting admin approval',
        count: filteredReservations.filter(r => r.status === 'pending').length,
        revenue: filteredReservations.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.total_amount, 0),
        color: 'bg-yellow-500',
        reservations: filteredReservations.filter(r => r.status === 'pending')
      },
      {
        id: 'confirmed',
        name: 'Confirmed',
        description: 'Approved bookings',
        count: filteredReservations.filter(r => r.status === 'confirmed').length,
        revenue: filteredReservations.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.total_amount, 0),
        color: 'bg-green-500',
        reservations: filteredReservations.filter(r => r.status === 'confirmed')
      },
      {
        id: 'paid',
        name: 'Paid',
        description: 'Payment completed',
        count: filteredReservations.filter(r => r.payment_status === 'paid').length,
        revenue: filteredReservations.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + r.total_amount, 0),
        color: 'bg-emerald-500',
        reservations: filteredReservations.filter(r => r.payment_status === 'paid')
      },
      {
        id: 'completed',
        name: 'Completed',
        description: 'Events finished',
        count: filteredReservations.filter(r => r.status === 'completed').length,
        revenue: filteredReservations.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.total_amount, 0),
        color: 'bg-purple-500',
        reservations: filteredReservations.filter(r => r.status === 'completed')
      }
    ];

    // Calculate conversion rates
    return stages.map((stage, index) => ({
      ...stage,
      percentage: total > 0 ? (stage.count / total) * 100 : 0,
      conversionRate: index > 0 ? (stage.count / stages[index - 1].count) * 100 : 100
    }));
  };

  // Modal and approval functions
  const handleViewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDetailModalOpen(true);
  };

  const handleApprovalAction = (reservation: Reservation, action: 'approve' | 'reject' | 'request_resubmit') => {
    setSelectedReservation(reservation);
    setApprovalAction(action);
    setApprovalReason('');
    setIsApprovalModalOpen(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedReservation) return;
    
    setIsProcessing(true);
    try {
      // TODO: Replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      let updatedStatus = selectedReservation.status;
      if (approvalAction === 'approve') {
        updatedStatus = 'confirmed';
      } else if (approvalAction === 'reject') {
        updatedStatus = 'cancelled';
      }
      // request_resubmit keeps status as pending but adds a note
      
      // Update the reservation in local state
      setReservations(prev => prev.map(r => 
        r.id === selectedReservation.id 
          ? { ...r, status: updatedStatus, approval_reason: approvalReason || undefined }
          : r
      ));
      
      toast({
        title: approvalAction === 'approve' ? "Reservation Approved" 
              : approvalAction === 'reject' ? "Reservation Rejected"
              : "Resubmission Requested",
        description: approvalAction === 'approve' 
                    ? `${selectedReservation.renter_name}'s reservation has been approved.`
                    : approvalAction === 'reject'
                    ? `${selectedReservation.renter_name}'s reservation has been rejected.`
                    : `${selectedReservation.renter_name} has been asked to resubmit their reservation.`,
      });
      
      setIsApprovalModalOpen(false);
      setSelectedReservation(null);
      setApprovalReason('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the approval action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Field Reservations</h3>
          <p className="text-muted-foreground mt-1">Manage field bookings and track revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
          >
            <List className="h-4 w-4 mr-2" />
            Table View
          </Button>
          <Button
            variant={viewMode === 'funnel' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('funnel')}
            className={viewMode === 'funnel' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Funnel View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reservations</p>
                <p className="text-2xl font-bold text-foreground">{filteredReservations.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-foreground">{getUpcomingReservations()}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue (Paid)</p>
                <p className="text-2xl font-bold text-foreground">${getTotalRevenue().toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReservations.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, organization, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-input border-border text-foreground">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-foreground hover:bg-accent">All Status</SelectItem>
                <SelectItem value="pending" className="text-foreground hover:bg-accent">Pending</SelectItem>
                <SelectItem value="confirmed" className="text-foreground hover:bg-accent">Confirmed</SelectItem>
                <SelectItem value="completed" className="text-foreground hover:bg-accent">Completed</SelectItem>
                <SelectItem value="cancelled" className="text-foreground hover:bg-accent">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger className="w-full md:w-48 bg-input border-border text-foreground">
                <SelectValue placeholder="Filter by field" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-foreground hover:bg-accent">All Fields</SelectItem>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id} className="text-foreground hover:bg-accent">{field.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'funnel' ? (
        <div className="space-y-6">
          {/* Enhanced Funnel View - Individual Reservations */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                Reservation Funnel - Interactive View
              </CardTitle>
              <p className="text-sm text-muted-foreground">Click on reservations to view details, approve, or reject. Pending items are highlighted.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {getFunnelData().map((stage, stageIndex) => (
                  <div key={stage.id} className="space-y-4">
                    {/* Stage Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{stage.name}</h3>
                          <p className="text-sm text-muted-foreground">{stage.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">{stage.count}</div>
                        <div className="text-sm text-muted-foreground">${stage.revenue.toFixed(0)} revenue</div>
                      </div>
                    </div>

                    {/* Individual Reservation Cards */}
                    {stage.reservations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stage.reservations.map((reservation) => {
                          const startDateTime = formatDateTime(reservation.start_time);
                          const endDateTime = formatDateTime(reservation.end_time);
                          const isPending = reservation.status === 'pending';
                          
                          return (
                            <Card 
                              key={reservation.id} 
                              className={`
                                relative cursor-pointer transition-all duration-200 hover:shadow-lg
                                ${isPending 
                                  ? 'bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 animate-pulse' 
                                  : 'bg-card border-border hover:bg-card/80'
                                }
                              `}
                              onClick={() => handleViewReservation(reservation)}
                            >
                              {/* Blinking indicator for pending */}
                              {isPending && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
                              )}
                              
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  {/* Header with status */}
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold text-foreground">{reservation.renter_name}</h4>
                                      <p className="text-sm text-muted-foreground">{reservation.organization_name}</p>
                                    </div>
                                    <Badge className={`${getStatusColor(reservation.status)} border text-xs`}>
                                      {reservation.status}
                                    </Badge>
                                  </div>

                                  {/* Field and time */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-foreground">{getFieldName(reservation.field_id)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-foreground">{startDateTime.date}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground ml-6">
                                      {startDateTime.time} - {endDateTime.time}
                                    </div>
                                  </div>

                                  {/* Amount and contact */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm">
                                      <DollarSign className="h-4 w-4 text-green-500" />
                                      <span className="font-medium text-foreground">${reservation.total_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">{reservation.estimated_attendees || 'N/A'}</span>
                                    </div>
                                  </div>

                                  {/* Quick actions for pending items */}
                                  {isPending && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApprovalAction(reservation, 'approve');
                                        }}
                                      >
                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApprovalAction(reservation, 'reject');
                                        }}
                                      >
                                        <ThumbsDown className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApprovalAction(reservation, 'request_resubmit');
                                        }}
                                      >
                                        <RefreshCw className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground">No reservations in this stage</div>
                      </div>
                    )}

                    {/* Stage separator arrow */}
                    {stageIndex < getFunnelData().length - 1 && (
                      <div className="flex justify-center py-4">
                        <ChevronDown className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : viewMode === 'table' ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Reservation</TableHead>
                  <TableHead className="text-foreground">Field</TableHead>
                  <TableHead className="text-foreground">Date & Time</TableHead>
                  <TableHead className="text-foreground">Contact</TableHead>
                  <TableHead className="text-foreground">Amount</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Payment</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => {
                  const startDateTime = formatDateTime(reservation.start_time);
                  const endDateTime = formatDateTime(reservation.end_time);
                  
                  return (
                    <TableRow key={reservation.id} className="border-border hover:bg-card/50">
                      <TableCell>
                        <div>
                          <p className="text-foreground font-medium">{reservation.renter_name}</p>
                          <p className="text-sm text-muted-foreground">{reservation.organization_name}</p>
                          <p className="text-xs text-muted-foreground">{reservation.purpose_of_use}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{getFieldName(reservation.field_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-foreground">{startDateTime.date}</p>
                          <p className="text-sm text-muted-foreground">
                            {startDateTime.time} - {endDateTime.time}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {reservation.booking_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{reservation.renter_email}</span>
                          </div>
                          {reservation.renter_phone && (
                            <div className="flex items-center gap-1 text-sm mt-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{reservation.renter_phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-foreground font-medium">${reservation.total_amount.toFixed(2)}</p>
                          {reservation.deposit_amount > 0 && (
                            <p className="text-xs text-muted-foreground">Deposit: ${reservation.deposit_amount.toFixed(2)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(reservation.status)} border text-xs`}>
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPaymentStatusColor(reservation.payment_status)} border text-xs`}>
                          {reservation.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <FieldCalendarView
          facilityId={facilityId}
          fields={fields}
          reservations={filteredReservations}
        />
      )}

      {/* Reservation Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reservation Details
            </DialogTitle>
            <DialogDescription>
              Complete information for this reservation request
            </DialogDescription>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-6">
              {/* Customer Information */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Renter Name</Label>
                      <p className="text-foreground">{selectedReservation.renter_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
                      <p className="text-foreground">{selectedReservation.organization_name || 'Individual'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-foreground">{selectedReservation.renter_email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-foreground">{selectedReservation.renter_phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Purpose of Use</Label>
                    <p className="text-foreground">{selectedReservation.purpose_of_use}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estimated Attendees</Label>
                      <p className="text-foreground">{selectedReservation.estimated_attendees || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
                      <p className="text-foreground">
                        {selectedReservation.emergency_contact_name && selectedReservation.emergency_contact_phone
                          ? `${selectedReservation.emergency_contact_name} - ${selectedReservation.emergency_contact_phone}`
                          : 'Not provided'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Booking Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Field</Label>
                      <p className="text-foreground">{getFieldName(selectedReservation.field_id)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Booking Type</Label>
                      <p className="text-foreground capitalize">{selectedReservation.booking_type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Start Date & Time</Label>
                      <p className="text-foreground">
                        {formatDateTime(selectedReservation.start_time).date} at {formatDateTime(selectedReservation.start_time).time}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">End Date & Time</Label>
                      <p className="text-foreground">
                        {formatDateTime(selectedReservation.end_time).date} at {formatDateTime(selectedReservation.end_time).time}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                      <p className="text-foreground font-semibold">${selectedReservation.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                      <Badge className={`${getPaymentStatusColor(selectedReservation.payment_status)} border text-xs`}>
                        {selectedReservation.payment_status}
                      </Badge>
                    </div>
                    {selectedReservation.deposit_amount && selectedReservation.deposit_amount > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Deposit Amount</Label>
                        <p className="text-foreground">${selectedReservation.deposit_amount.toFixed(2)}</p>
                      </div>
                    )}
                    {selectedReservation.tax_amount && selectedReservation.tax_amount > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Tax Amount</Label>
                        <p className="text-foreground">${selectedReservation.tax_amount.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Compliance */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Compliance & Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Liability Waiver</Label>
                      <p className={`text-sm ${selectedReservation.liability_waiver_signed ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedReservation.liability_waiver_signed ? '✓ Signed' : '✗ Not Signed'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Insurance Certificate</Label>
                      <p className={`text-sm ${selectedReservation.insurance_certificate_url ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedReservation.insurance_certificate_url ? '✓ Uploaded' : '✗ Not Provided'}
                      </p>
                    </div>
                  </div>
                  {selectedReservation.special_requests && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Special Requests</Label>
                      <p className="text-foreground text-sm">{selectedReservation.special_requests}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {selectedReservation.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleApprovalAction(selectedReservation, 'approve');
                    }}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approve Reservation
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleApprovalAction(selectedReservation, 'reject');
                    }}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleApprovalAction(selectedReservation, 'request_resubmit');
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Action Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === 'approve' && <ThumbsUp className="h-5 w-5 text-green-600" />}
              {approvalAction === 'reject' && <ThumbsDown className="h-5 w-5 text-red-600" />}
              {approvalAction === 'request_resubmit' && <RefreshCw className="h-5 w-5 text-orange-600" />}
              {approvalAction === 'approve' && 'Approve Reservation'}
              {approvalAction === 'reject' && 'Reject Reservation'}
              {approvalAction === 'request_resubmit' && 'Request Resubmission'}
            </DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <>
                  {approvalAction === 'approve' && `Approve the reservation for ${selectedReservation.renter_name}?`}
                  {approvalAction === 'reject' && `Reject the reservation for ${selectedReservation.renter_name}? Please provide a reason.`}
                  {approvalAction === 'request_resubmit' && `Request ${selectedReservation.renter_name} to resubmit their reservation with additional information or corrections.`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {approvalAction !== 'approve' && (
              <div>
                <Label htmlFor="reason" className="text-sm font-medium">
                  {approvalAction === 'reject' ? 'Reason for Rejection *' : 'What needs to be corrected? *'}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={
                    approvalAction === 'reject' 
                      ? 'Please provide a reason for rejecting this reservation...'
                      : 'Please specify what documents or information need to be corrected or added...'
                  }
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
                {approvalAction === 'request_resubmit' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Common reasons: Missing insurance certificate, incorrect dates, insufficient documentation, etc.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsApprovalModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${
                  approvalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : approvalAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } text-white`}
                onClick={handleApprovalSubmit}
                disabled={isProcessing || (approvalAction !== 'approve' && !approvalReason.trim())}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === 'approve' && 'Approve'}
                    {approvalAction === 'reject' && 'Reject'}
                    {approvalAction === 'request_resubmit' && 'Request Resubmission'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 