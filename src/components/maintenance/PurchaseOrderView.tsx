'use client';

import { useState, useEffect } from 'react';
import { X, Download, Mail, MessageSquare, Users } from 'lucide-react';
import Image from 'next/image';
import type { PurchaseOrder, Vendor } from '@/types/maintenance';
import { generatePDF, shareViaEmail, shareViaSMS, downloadBlob, formatPOForSharing } from '@/utils/share';
import AssignUserModal from '@/components/common/AssignUserModal';
import { getPOAssignments, assignPurchaseOrder } from '@/services/users';
import type { POAssignment } from '@/types/users';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PurchaseOrderViewProps {
  purchaseOrder: PurchaseOrder;
  vendor: Vendor;
  onClose: () => void;
  companyLogo?: string;
  companyName?: string;
}

const PurchaseOrderView: React.FC<PurchaseOrderViewProps> = ({
  purchaseOrder,
  vendor,
  onClose,
  companyLogo = '',
  companyName = 'Your Company',
}) => {
  const [logo, setLogo] = useState<string>(companyLogo);
  const [activeTab, setActiveTab] = useState<'details' | 'assignments'>('details');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<POAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser } = useAuth();

  // Load assignments when the component mounts
  useEffect(() => {
    loadAssignments();
  }, [purchaseOrder.id]);

  const loadAssignments = async () => {
    try {
      const data = await getPOAssignments(purchaseOrder.id);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleAssign = async (data: {
    userId?: string;
    email?: string;
    phone?: string;
    role: 'assignee' | 'approver' | 'observer';
  }) => {
    if (!currentUser?.id) {
      toast.error('You must be logged in to assign users');
      return;
    }

    try {
      const assignment = {
        poId: purchaseOrder.id,
        userId: data.userId,
        email: data.email,
        phone: data.phone,
        role: data.role,
        created_by: currentUser.id,
        createdAt: new Date().toISOString()
      };

      await assignPurchaseOrder(assignment);
      
      // Refresh assignments
      const updatedAssignments = await getPOAssignments(purchaseOrder.id);
      setAssignments(updatedAssignments);
      toast.success('Successfully assigned to purchase order');
    } catch (error) {
      console.error('Error assigning to purchase order:', error);
      toast.error('Failed to assign to purchase order');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const pdf = await generatePDF('po-content');
      downloadBlob(pdf, `purchase-order-${purchaseOrder.poNumber}.pdf`);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailShare = async () => {
    try {
      setIsLoading(true);
      const pdf = await generatePDF('po-content');
      const subject = `Purchase Order: ${purchaseOrder.poNumber}`;
      const body = formatPOForSharing(purchaseOrder, vendor);
      await shareViaEmail(subject, body, pdf, `purchase-order-${purchaseOrder.poNumber}.pdf`);
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Failed to share via email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSMSShare = async () => {
    try {
      const text = formatPOForSharing(purchaseOrder, vendor);
      await shareViaSMS(text);
    } catch (error) {
      console.error('Error sharing via SMS:', error);
      alert('Failed to share via SMS. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Purchase Order Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-3 px-2 text-sm font-medium border-b-2 ${
                activeTab === 'assignments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Assignments
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'details' ? (
            <div id="po-content">
              {/* Company Header */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
                <div className="text-sm text-gray-500">
                  <div>PO Number: {purchaseOrder.poNumber}</div>
                  <div>Date: {new Date(purchaseOrder.requestDate).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Vendor Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Vendor Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <div className="mt-1">{vendor.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="mt-1">{vendor.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <div className="mt-1">{vendor.phone}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <div className="mt-1">{vendor.address}</div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Total Amount:</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">${purchaseOrder.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{purchaseOrder.status.replace('_', ' ')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested By</label>
                  <div className="mt-1">{purchaseOrder.requestedBy}</div>
                </div>
                {purchaseOrder.notes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <div className="mt-1">{purchaseOrder.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Assignments Tab
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Purchase Order Assignments</h3>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign User
                </button>
              </div>

              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        {assignment.user ? (
                          <div>
                            <div className="font-medium">{assignment.user.full_name}</div>
                            <div className="text-sm text-gray-500">{assignment.user.email}</div>
                          </div>
                        ) : assignment.invitation ? (
                          <div>
                            <div className="font-medium">
                              {assignment.invitation.email || assignment.invitation.phone}
                            </div>
                            <div className="text-sm text-gray-500">Invitation Pending</div>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 capitalize">{assignment.role}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          assignment.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No assignments yet. Click "Assign User" to add someone to this purchase order.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 p-4 border-t">
          <button
            onClick={handleSMSShare}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Share via SMS
          </button>
          <button
            onClick={handleEmailShare}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Mail className="w-4 h-4 mr-2" />
            Share via Email
          </button>
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Assign User Modal */}
      {isAssignModalOpen && (
        <AssignUserModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleAssign}
          title="Assign User to Purchase Order"
          roles={[
            { value: 'assignee', label: 'Assignee' },
            { value: 'approver', label: 'Approver' },
            { value: 'observer', label: 'Observer' },
          ]}
          defaultRole="assignee"
        />
      )}
    </div>
  );
};

export default PurchaseOrderView; 