import { useState } from 'react';
import { Search, Mail, MessageSquare, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { dummyUsers } from '@/services/users';
import type { User } from '@/types/users';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportUrl: string;
  reportTitle?: string;
}

export default function ShareReportModal({
  isOpen,
  onClose,
  reportUrl,
  reportTitle = 'Maintenance Report'
}: ShareReportModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<User[]>([]);
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'manual'>('contacts');
  const { toast } = useToast();

  const filteredUsers = dummyUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleContact = (user: User) => {
    setSelectedContacts(prev =>
      prev.some(c => c.id === user.id)
        ? prev.filter(c => c.id !== user.id)
        : [...prev, user]
    );
  };

  const handleShare = async () => {
    try {
      const recipients = activeTab === 'contacts'
        ? selectedContacts
        : [{
            id: 'custom',
            name: 'Custom Recipient',
            email: customEmail,
            phone: customPhone,
          }] as User[];

      // Make API calls to send SMS and email
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          reportUrl,
          reportTitle,
        }),
      });

      if (!response.ok) throw new Error('Failed to share report');

      toast({
        title: 'Report shared successfully',
        description: 'The report has been sent to the selected recipients.',
      });

      onClose();
    } catch (error) {
      console.error('Error sharing report:', error);
      toast({
        title: 'Failed to share report',
        description: 'There was an error sharing the report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contacts" className="w-full" onValueChange={(value) => setActiveTab(value as 'contacts' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                      selectedContacts.some(c => c.id === user.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleContact(user)}
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      )}
                    </div>
                    {selectedContacts.some(c => c.id === user.id) && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center mt-1.5">
                  <Mail className="w-5 h-5 text-gray-400 mr-2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center mt-1.5">
                  <MessageSquare className="w-5 h-5 text-gray-400 mr-2" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={
              (activeTab === 'contacts' && selectedContacts.length === 0) ||
              (activeTab === 'manual' && !customEmail && !customPhone)
            }
          >
            Share Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}  