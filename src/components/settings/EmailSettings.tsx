import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  defaultTemplate: string;
}

export default function EmailSettings() {
  const [config, setConfig] = useState<EmailConfig>({
    apiKey: '',
    fromEmail: '',
    fromName: '',
    replyTo: '',
    defaultTemplate: '',
  });
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      setIsInitialLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/settings/email', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.settings);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      setError(error instanceof Error ? error.message : "Failed to load settings");
      toast({
        title: "Failed to load email settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Settings saved",
          description: "Email configuration has been updated successfully.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setError(error instanceof Error ? error.message : "Failed to save settings");
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Test email required",
        description: "Please enter an email address to send the test email to.",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Test email sent",
          description: "Please check your inbox for the test email.",
        });
        setTestEmail('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setError(error instanceof Error ? error.message : "Failed to send test email");
      toast({
        title: "Failed to send test email",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Email Configuration</h2>
          <div className="space-y-4">
            <div>
              <Label>SendGrid API Key</Label>
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Label>From Email</Label>
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Label>From Name</Label>
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Label>Reply-To Email</Label>
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Label>Default Email Template</Label>
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Email Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey">SendGrid API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="SG.xxxxxx"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your SendGrid API key should start with "SG."
            </p>
          </div>

          <div>
            <Label htmlFor="fromEmail">From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={config.fromEmail}
              onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
              placeholder="noreply@yourdomain.com"
            />
          </div>

          <div>
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              value={config.fromName}
              onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
              placeholder="Your Company Name"
            />
          </div>

          <div>
            <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
            <Input
              id="replyTo"
              type="email"
              value={config.replyTo}
              onChange={(e) => setConfig({ ...config, replyTo: e.target.value })}
              placeholder="support@yourdomain.com"
            />
          </div>

          <div>
            <Label htmlFor="defaultTemplate">Default Email Template (Optional)</Label>
            <Textarea
              id="defaultTemplate"
              value={config.defaultTemplate}
              onChange={(e) => setConfig({ ...config, defaultTemplate: e.target.value })}
              placeholder="Enter your default HTML email template..."
              rows={6}
            />
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Make sure to verify your sender domain in SendGrid to improve email deliverability.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Test Email Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="testEmail">Test Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email to test"
              />
              <Button
                onClick={handleTestEmail}
                disabled={testLoading}
                variant="outline"
              >
                {testLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The test email will be sent using your current email configuration.
              Make sure to save any changes before testing.
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    </div>
  );
} 