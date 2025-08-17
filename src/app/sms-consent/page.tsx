import { Metadata } from 'next';
import { SMSConsentForm } from '@/components/sms/SMSConsentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, MessageSquare, CheckCircle, Phone, Bell, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SMS Notification Consent | FacilityCore',
  description: 'Subscribe to receive important facility maintenance alerts and updates via SMS from FacilityCore.',
  openGraph: {
    title: 'SMS Notification Consent | FacilityCore',
    description: 'Subscribe to receive important facility maintenance alerts and updates via SMS.',
    url: 'https://facilitycore.ai/sms-consent',
    siteName: 'FacilityCore',
    type: 'website',
  },
};

export default function SMSConsentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold">FacilityCore</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">SMS Notification Consent</h1>
            <p className="text-lg text-muted-foreground">
              Stay informed with real-time facility alerts and maintenance updates
            </p>
          </div>

          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <Bell className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Real-Time Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get instant notifications about urgent maintenance issues and facility updates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CheckCircle className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Task Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Never miss a deadline with automated reminders for maintenance tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <MessageSquare className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Easy Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Reply STOP to unsubscribe or HELP for support at any time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Consent Form */}
          <SMSConsentForm source="website_form" />

          {/* Privacy & Terms Section */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">TCPA Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  FacilityCore complies with the Telephone Consumer Protection Act (TCPA). 
                  We will only send SMS messages to phone numbers that have provided explicit consent.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Your phone number and preferences are securely stored and never shared with third parties. 
                  All consent records are maintained for compliance purposes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Message Frequency</h3>
                <p className="text-sm text-muted-foreground">
                  Message frequency varies based on your preferences and facility activity. 
                  Standard message and data rates may apply.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <div className="text-center space-y-4 py-8 border-t">
            <h2 className="text-xl font-semibold">Need Help?</h2>
            <p className="text-muted-foreground">
              For support, text HELP to any message or contact us:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@facilitycore.ai" className="text-primary hover:underline">
                support@facilitycore.ai
              </a>
              <span className="text-muted-foreground hidden sm:block">•</span>
              <a href="tel:+18885551234" className="text-primary hover:underline">
                1-888-555-1234
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © 2024 FacilityCore. All rights reserved.
            </p>
            <div className="flex gap-4 justify-center text-sm">
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
              <a href="/sms-terms" className="text-primary hover:underline">SMS Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}