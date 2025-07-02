'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  MessageSquare,
  Settings,
  Shield,
  Building,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Timer,
  TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { 
  getReservations, 
  updateReservationStatus, 
  addReservationFee,
  updateReservation 
} from '@/app/actions/reservations';
import { getAllFacilities } from '@/app/actions/facilities';
import type { Reservation, ReservationSlot } from '@/types/reservation';
import type { Facility } from '@/types/facility';
import { useToast } from '@/components/ui/use-toast';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [adjustedTotal, setAdjustedTotal] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reservationsData, facilitiesData] = await Promise.all([
        getReservations(),
        getAllFacilities()
      ]);
      
      setReservations(reservationsData.data || []);
      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reservations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending Review</Badge>;
      case 'pre_approved':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Pre-Approved</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500">Payment Pending</Badge>;
      case 'deposit_paid':
        return <Badge variant="outline" className="text-blue-500">Deposit Paid</Badge>;
      case 'full_paid':
        return <Badge variant="outline" className="text-green-500">Paid in Full</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="text-gray-500">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInsuranceBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500">Insurance Pending</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="text-blue-500">Insurance Submitted</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500">Insurance Approved</Badge>;
      case 'deficient':
        return <Badge variant="outline" className="text-red-500">Insurance Deficient</Badge>;
      case 'not_required':
        return <Badge variant="outline" className="text-gray-500">Not Required</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApproval = async (action: 'pre_approve' | 'approve' | 'reject') => {
    if (!selectedReservation) return;

    setLoading(true);
    try {
      const newStatus = action === 'pre_approve' ? 'pre_approved' : 
                       action === 'approve' ? 'approved' : 'rejected';

      await updateReservationStatus(
        selectedReservation.id,
        newStatus,
        approvalNotes
      );

      // Update adjusted total if changed
      if (adjustedTotal && adjustedTotal !== selectedReservation.total_amount) {
        await updateReservation(selectedReservation.id, {
          total_amount: adjustedTotal,
        });
      }

      toast({
        title: 'Success',
        description: `Reservation ${action === 'reject' ? 'rejected' : 'approved'} successfully`,
      });

      // Refresh data
      await loadData();
      setShowApprovalDialog(false);
      setApprovalNotes('');
      setAdjustedTotal(null);
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reservation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFacility = facilityFilter === 'all' || reservation.facility_id === facilityFilter;
    
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'pending' && reservation.status === 'pending') ||
                      (selectedTab === 'pre_approved' && reservation.status === 'pre_approved') ||
                      (selectedTab === 'approved' && reservation.status === 'approved') ||
                      (selectedTab === 'rejected' && reservation.status === 'cancelled' && reservation.cancellation_reason?.includes('Rejected'));
    
    return matchesSearch && matchesFacility && matchesTab;
  });

  const ReservationRow = ({ reservation }: { reservation: Reservation }) => {
    const facility = facilities.find(f => f.id === reservation.facility_id);
    
    return (
      <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => {
        setSelectedReservation(reservation);
        setShowDetailsDialog(true);
      }}>
        <TableCell>
          <div className="space-y-1">
            <div className="font-medium">{reservation.event_name}</div>
            <div className="text-sm text-muted-foreground">
              {reservation.organization?.name || reservation.contact_name}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="text-sm">{facility?.name || 'Unknown Facility'}</div>
            <div className="text-sm text-muted-foreground">
              {/* Field will be determined from slots */}
              Field #{reservation.slots?.[0]?.field_id?.slice(0, 8)}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            {reservation.slots?.slice(0, 2).map((slot: ReservationSlot, index: number) => (
              <div key={index} className="text-sm">
                {format(parseISO(slot.date), 'MMM d')} • {slot.start_time} - {slot.end_time}
              </div>
            ))}
            {reservation.slots && reservation.slots.length > 2 && (
              <div className="text-sm text-muted-foreground">
                +{reservation.slots.length - 2} more dates
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div>{getStatusBadge(reservation.status)}</div>
            <div className="flex gap-1 mt-1">
              {getPaymentBadge(reservation.payment_status)}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-right">
            <div className="font-medium">${reservation.total_amount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              {reservation.estimated_attendees} attendees
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Button size="sm" variant="ghost">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  const QuickStats = () => {
    const pending = reservations.filter(r => r.status === 'pending').length;
    const preApproved = reservations.filter(r => r.status === 'pre_approved').length;
    const todayRevenue = reservations
      .filter(r => r.status === 'approved' && r.created_at && format(parseISO(r.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
      .reduce((sum, r) => sum + r.total_amount, 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{pending}</div>
            <p className="text-xs text-yellow-600 mt-1">Awaiting initial review</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Pre-Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{preApproved}</div>
            <p className="text-xs text-blue-600 mt-1">Awaiting final approval</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">${todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-green-600 mt-1">Approved bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{reservations.length}</div>
            <p className="text-xs text-purple-600 mt-1">All reservations</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Reservation Management</h1>
        <p className="text-muted-foreground mt-2">Review and approve facility rental requests</p>
      </div>

      <QuickStats />

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by event name, contact, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map(facility => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs and Table */}
      <Card>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <CardHeader>
            <TabsList className="grid w-full max-w-md grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="pre_approved">Pre-Approved</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event / Organization</TableHead>
                    <TableHead>Facility / Space</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount / Attendees</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No reservations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReservations.map(reservation => (
                      <ReservationRow key={reservation.id} reservation={reservation} />
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Reservation Details Dialog */}
      {selectedReservation && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reservation Details</DialogTitle>
              <DialogDescription>
                Review complete reservation information and take action
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Status Summary */}
              <div className="flex gap-2">
                {getStatusBadge(selectedReservation.status)}
                {getPaymentBadge(selectedReservation.payment_status)}
                {getInsuranceBadge(selectedReservation.insurance_status)}
              </div>

              {/* Event Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Event Name</Label>
                    <p className="font-medium">{selectedReservation.event_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Event Type</Label>
                    <p className="font-medium">{selectedReservation.event_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estimated Attendees</Label>
                    <p className="font-medium">{selectedReservation.estimated_attendees}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="font-medium">{selectedReservation.event_description || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Organization</Label>
                    <p className="font-medium">{selectedReservation.organization?.name || 'Individual'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contact Name</Label>
                    <p className="font-medium">{selectedReservation.contact_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedReservation.contact_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedReservation.contact_phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Emergency Contact</Label>
                    <p className="font-medium">{selectedReservation.emergency_contact_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Emergency Phone</Label>
                    <p className="font-medium">{selectedReservation.emergency_contact_phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Booking Dates */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Booking Schedule
                </h3>
                <div className="space-y-2">
                  {selectedReservation.slots?.map((slot: ReservationSlot, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="font-medium">
                        {format(parseISO(slot.date), 'EEEE, MMMM d, yyyy')}
                      </span>
                      <span className="text-muted-foreground">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Financial Summary */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${selectedReservation.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${selectedReservation.tax_amount.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${selectedReservation.total_amount.toFixed(2)}</span>
                  </div>
                  {selectedReservation.deposit_amount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Deposit Required</span>
                      <span>${selectedReservation.deposit_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {selectedReservation.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowApprovalDialog(true);
                      }}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowApprovalDialog(true);
                      }}
                    >
                      Pre-Approve
                    </Button>
                  </>
                )}
                {selectedReservation.status === 'pre_approved' && (
                  <Button 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setShowApprovalDialog(true);
                    }}
                  >
                    Final Approval
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Dialog */}
      {selectedReservation && (
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedReservation.status === 'pending' ? 'Pre-Approval Review' : 'Final Approval'}
              </DialogTitle>
              <DialogDescription>
                Review and {selectedReservation.status === 'pending' ? 'pre-approve' : 'approve'} this reservation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Current Total</Label>
                <p className="text-2xl font-bold">${selectedReservation.total_amount.toFixed(2)}</p>
              </div>

              <div>
                <Label htmlFor="adjusted-total">Adjusted Total (if applicable)</Label>
                <Input
                  id="adjusted-total"
                  type="number"
                  step="0.01"
                  placeholder="Leave empty to keep current total"
                  value={adjustedTotal || ''}
                  onChange={(e) => setAdjustedTotal(parseFloat(e.target.value) || null)}
                />
              </div>

              <div>
                <Label htmlFor="approval-notes">Notes</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any notes about this approval..."
                  rows={4}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={() => handleApproval('reject')}
              >
                Reject
              </Button>
              {selectedReservation.status === 'pending' ? (
                <Button 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => handleApproval('pre_approve')}
                >
                  Pre-Approve
                </Button>
              ) : (
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleApproval('approve')}
                >
                  Final Approval
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 