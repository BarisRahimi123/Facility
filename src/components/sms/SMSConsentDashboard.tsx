'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Shield, 
  Phone, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface ConsentRecord {
  id: string;
  phone_number: string;
  consent_status: 'active' | 'revoked' | 'pending';
  message_types: string[];
  consented_at: string;
  verified_at: string | null;
  page_url: string;
}

interface ConsentHistory {
  id: string;
  action: string;
  created_at: string;
  source: string;
  details?: any;
}

export function SMSConsentDashboard({ userId }: { userId: string }) {
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null);
  const [history, setHistory] = useState<ConsentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConsentData();
  }, [userId]);

  const loadConsentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sms/consent?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setConsentRecord(data.consent);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading consent data:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptOut = async () => {
    if (!consentRecord) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/sms/consent/opt-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone_number: consentRecord.phone_number 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Unsubscribed",
          description: "You've been unsubscribed from SMS notifications"
        });
        loadConsentData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Preferences
          </CardTitle>
          <CardDescription>
            Manage your SMS notification preferences and consent status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consentRecord ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <p className="text-sm text-muted-foreground">{consentRecord.phone_number}</p>
                </div>
                <Badge variant={consentRecord.consent_status === 'active' ? 'default' : 'destructive'}>
                  {consentRecord.consent_status === 'active' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {consentRecord.consent_status}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium">Message Types</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {consentRecord.message_types.map((type) => (
                    <Badge key={type} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium">Consented At</Label>
                  <p className="text-muted-foreground">
                    {format(new Date(consentRecord.consented_at), 'PPp')}
                  </p>
                </div>
                {consentRecord.verified_at && (
                  <div>
                    <Label className="text-sm font-medium">Verified At</Label>
                    <p className="text-muted-foreground">
                      {format(new Date(consentRecord.verified_at), 'PPp')}
                    </p>
                  </div>
                )}
              </div>

              {consentRecord.consent_status === 'active' && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    onClick={handleOptOut}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Unsubscribe from SMS
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No SMS consent record found for this user.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Consent History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{record.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.created_at), 'PPp')} • {record.source}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
