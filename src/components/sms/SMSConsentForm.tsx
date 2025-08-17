'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Shield, MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SMSConsentFormProps {
  userId?: string;
  userEmail?: string;
  userName?: string;
  source?: 'website_form' | 'checkout' | 'account_signup' | 'mobile_app';
  onSuccess?: () => void;
  showInline?: boolean;
}

export function SMSConsentForm({ 
  userId, 
  userEmail, 
  userName,
  source = 'website_form',
  onSuccess,
  showInline = false 
}: SMSConsentFormProps) {
  const [formData, setFormData] = useState({
    phone: '',
    name: userName || '',
    email: userEmail || '',
    consentChecked: false,
    marketingConsent: true,
    transactionalConsent: true,
    alertsConsent: true,
    remindersConsent: true
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const getSelectedMessageTypes = () => {
    const types = [];
    if (formData.marketingConsent) types.push('marketing');
    if (formData.transactionalConsent) types.push('transactional');
    if (formData.alertsConsent) types.push('alerts');
    if (formData.remindersConsent) types.push('reminders');
    return types.length === 4 ? ['all'] : types;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consentChecked) {
      toast({
        title: "Consent Required",
        description: "Please agree to receive SMS messages to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const consentText = `I agree to receive ${getSelectedMessageTypes().join(', ')} SMS messages from FacilityCore at the phone number provided. I understand that message and data rates may apply, message frequency varies, and I can reply STOP to unsubscribe at any time.`;

      const response = await fetch('/api/sms/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formData.phone.replace(/\D/g, ''),
          full_name: formData.name,
          email: formData.email,
          user_id: userId,
          consent_source: source,
          message_types: getSelectedMessageTypes(),
          consent_text: consentText,
          page_url: window.location.href
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        toast({
          title: "Success!",
          description: "You've been subscribed to SMS notifications. Check your phone for a verification message."
        });
        
        if (onSuccess) onSuccess();
        
        // Reset form
        setTimeout(() => {
          setFormData({
            phone: '',
            name: '',
            email: '',
            consentChecked: false,
            marketingConsent: true,
            transactionalConsent: true,
            alertsConsent: true,
            remindersConsent: true
          });
          setSuccess(false);
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to save consent');
      }
    } catch (error) {
      console.error('Error saving SMS consent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save SMS preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success && !showInline) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Successfully Subscribed!</h3>
            <p className="text-muted-foreground">
              Check your phone for a verification message. Reply YES to confirm your subscription.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={showInline ? "border-0 shadow-none" : "max-w-2xl mx-auto"}>
      {!showInline && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Notification Preferences
          </CardTitle>
          <CardDescription>
            Stay updated with important facility alerts and maintenance notifications via SMS
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={showInline ? "p-0" : ""}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="pl-10"
                  required
                  maxLength={14}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                US phone number for SMS notifications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>

          {/* Message Type Preferences */}
          <div className="space-y-3">
            <Label>Notification Types</Label>
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, marketingConsent: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="font-normal cursor-pointer">
                    Marketing & Promotional Messages
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Special offers, new features, and facility updates
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="transactional"
                  checked={formData.transactionalConsent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, transactionalConsent: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="transactional" className="font-normal cursor-pointer">
                    Transactional Messages
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Booking confirmations, receipts, and account updates
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="alerts"
                  checked={formData.alertsConsent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, alertsConsent: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="alerts" className="font-normal cursor-pointer">
                    Maintenance Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Urgent maintenance issues and facility alerts
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="reminders"
                  checked={formData.remindersConsent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, remindersConsent: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="reminders" className="font-normal cursor-pointer">
                    Task Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Due date reminders and task assignments
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TCPA Consent */}
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>SMS Terms & Conditions</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Message frequency varies based on your preferences</li>
                  <li>• Message and data rates may apply</li>
                  <li>• Reply STOP to cancel at any time</li>
                  <li>• Reply HELP for assistance</li>
                  <li>• Carriers are not liable for delayed or undelivered messages</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-background">
              <Checkbox
                id="consent"
                checked={formData.consentChecked}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, consentChecked: checked as boolean }))
                }
                required
              />
              <Label htmlFor="consent" className="font-normal cursor-pointer leading-relaxed">
                I agree to receive automated SMS messages from FacilityCore at the phone number 
                provided. I understand that consent is not a condition of purchase, message and 
                data rates may apply, message frequency varies, and I can reply STOP to unsubscribe 
                at any time. View our{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </a>.
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !formData.consentChecked}
          >
            {loading ? "Subscribing..." : "Subscribe to SMS Notifications"}
          </Button>

          {/* Additional Info */}
          <p className="text-xs text-center text-muted-foreground">
            For support, text HELP to any message or email support@facilitycore.ai
          </p>
        </form>
      </CardContent>
    </Card>
  );
}