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
      setUpdating(