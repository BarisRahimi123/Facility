import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Bell, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type NotificationMethod = 'email' | 'sms' | 'both';

interface NotificationPreferences {
  maintenance: {
    enabled: boolean;
    urgentOnly: boolean;
    method: NotificationMethod;
  };
  tasks: {
    enabled: boolean;
    assignmentNotifications: boolean;
    statusUpdates: boolean;
    deadlineReminders: boolean;
    method: NotificationMethod;
  };
  system: {
    enabled: boolean;
    securityAlerts: boolean;
    maintenanceUpdates: boolean;
    method: NotificationMethod;
  };
  buildings: {
    enabled: boolean;
    issueReports: boolean;
    renovationUpdates: boolean;
    systemAlerts: boolean;
    method: NotificationMethod;
  };
}

type SectionSettings = NotificationPreferences[keyof NotificationPreferences];

interface NotificationSectionProps {
  title: string;
  description: string;
  section: keyof NotificationPreferences;
  preferences: NotificationPreferences;
  onChange: (section: keyof NotificationPreferences, newValue: SectionSettings) => void;
}

const NOTIFICATION_METHODS: { value: NotificationMethod; label: string }[] = [
  { value: 'email', label: 'Email only' },
  { value: 'sms', label: 'SMS only' },
  { value: 'both', label: 'Email & SMS' },
];

interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  enabled: boolean;
}

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    maintenance: {
      enabled: true,
      urgentOnly: false,
      method: 'email',
    },
    tasks: {
      enabled: true,
      assignmentNotifications: true,
      statusUpdates: true,
      deadlineReminders: true,
      method: 'email',
    },
    system: {
      enabled: true,
      securityAlerts: true,
      maintenanceUpdates: true,
      method: 'email',
    },
    buildings: {
      enabled: true,
      issueReports: true,
      renovationUpdates: true,
      systemAlerts: true,
      method: 'email',
    },
  });
  const [smsConfig, setSMSConfig] = useState<SMSConfig>({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    enabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testSMSLoading, setTestSMSLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotificationSettings();
    loadSMSSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.preferences);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Failed to load notification settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const loadSMSSettings = async () => {
    try {
      const response = await fetch('/api/settings/sms');
      const data = await response.json();
      
      if (data.success) {
        setSMSConfig(data.settings);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading SMS settings:', error);
      toast({
        title: "Failed to load SMS settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Settings saved",
          description: "Notification preferences have been updated successfully.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSMSConfigSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: smsConfig }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Settings saved",
          description: "SMS configuration has been updated successfully.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) {
      toast({
        title: "Test phone number required",
        description: "Please enter a phone number to send the test SMS to.",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestSMSLoading(true);
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testPhone }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Test SMS sent",
          description: "Please check your phone for the test message.",
        });
        setTestPhone('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast({
        title: "Failed to send test SMS",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setTestSMSLoading(false);
    }
  };

  const NotificationSection = ({ 
    title, 
    description, 
    section, 
    preferences, 
    onChange 
  }: NotificationSectionProps) => (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <Switch
          checked={preferences[section].enabled}
          onCheckedChange={(checked) => 
            onChange(section, { ...preferences[section], enabled: checked })
          }
        />
      </div>

      {preferences[section].enabled && (
        <div className="space-y-4">
          {section === 'maintenance' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="urgentOnly">Only notify for urgent issues</Label>
              <Switch
                id="urgentOnly"
                checked={preferences.maintenance.urgentOnly}
                onCheckedChange={(checked) =>
                  onChange('maintenance', { ...preferences.maintenance, urgentOnly: checked })
                }
              />
            </div>
          )}

          {section === 'tasks' && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="assignmentNotifications">Assignment notifications</Label>
                <Switch
                  id="assignmentNotifications"
                  checked={preferences.tasks.assignmentNotifications}
                  onCheckedChange={(checked) =>
                    onChange('tasks', { ...preferences.tasks, assignmentNotifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="statusUpdates">Status updates</Label>
                <Switch
                  id="statusUpdates"
                  checked={preferences.tasks.statusUpdates}
                  onCheckedChange={(checked) =>
                    onChange('tasks', { ...preferences.tasks, statusUpdates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="deadlineReminders">Deadline reminders</Label>
                <Switch
                  id="deadlineReminders"
                  checked={preferences.tasks.deadlineReminders}
                  onCheckedChange={(checked) =>
                    onChange('tasks', { ...preferences.tasks, deadlineReminders: checked })
                  }
                />
              </div>
            </>
          )}

          {section === 'system' && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="securityAlerts">Security alerts</Label>
                <Switch
                  id="securityAlerts"
                  checked={preferences.system.securityAlerts}
                  onCheckedChange={(checked) =>
                    onChange('system', { ...preferences.system, securityAlerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenanceUpdates">System maintenance updates</Label>
                <Switch
                  id="maintenanceUpdates"
                  checked={preferences.system.maintenanceUpdates}
                  onCheckedChange={(checked) =>
                    onChange('system', { ...preferences.system, maintenanceUpdates: checked })
                  }
                />
              </div>
            </>
          )}

          {section === 'buildings' && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="issueReports">Issue reports</Label>
                <Switch
                  id="issueReports"
                  checked={preferences.buildings.issueReports}
                  onCheckedChange={(checked) =>
                    onChange('buildings', { ...preferences.buildings, issueReports: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="renovationUpdates">Renovation updates</Label>
                <Switch
                  id="renovationUpdates"
                  checked={preferences.buildings.renovationUpdates}
                  onCheckedChange={(checked) =>
                    onChange('buildings', { ...preferences.buildings, renovationUpdates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="systemAlerts">System alerts</Label>
                <Switch
                  id="systemAlerts"
                  checked={preferences.buildings.systemAlerts}
                  onCheckedChange={(checked) =>
                    onChange('buildings', { ...preferences.buildings, systemAlerts: checked })
                  }
                />
              </div>
            </>
          )}

          <div className="mt-4">
            <Label htmlFor={`${section}-method`}>Notification method</Label>
            <Select
              value={preferences[section].method}
              onValueChange={(value: NotificationMethod) => 
                onChange(section, { ...preferences[section], method: value })
              }
            >
              <SelectTrigger id={`${section}-method`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_METHODS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Notification Settings</h2>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Configuration
            </h3>
            <p className="text-sm text-gray-500">Configure Twilio SMS settings for notifications</p>
          </div>
          <Switch
            checked={smsConfig.enabled}
            onCheckedChange={(checked) => 
              setSMSConfig(prev => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {smsConfig.enabled && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountSid">Twilio Account SID</Label>
              <Input
                id="accountSid"
                type="password"
                value={smsConfig.accountSid}
                onChange={(e) => setSMSConfig(prev => ({ ...prev, accountSid: e.target.value }))}
                placeholder="AC..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Your Twilio Account SID should start with "AC"
              </p>
            </div>

            <div>
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                type="password"
                value={smsConfig.authToken}
                onChange={(e) => setSMSConfig(prev => ({ ...prev, authToken: e.target.value }))}
                placeholder="Enter your Twilio Auth Token"
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Twilio Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={smsConfig.phoneNumber}
                onChange={(e) => setSMSConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+1234567890"
              />
              <p className="text-sm text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure your Twilio phone number is verified and has SMS capabilities enabled.
              </AlertDescription>
            </Alert>

            <div className="pt-4 border-t">
              <Label htmlFor="testPhone">Test Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="testPhone"
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Enter phone number to test"
                />
                <Button
                  onClick={handleTestSMS}
                  disabled={testSMSLoading}
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {testSMSLoading ? "Sending..." : "Send Test"}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSMSConfigSave}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Saving..." : "Save SMS Settings"}
            </Button>
          </div>
        )}
      </Card>

      <NotificationSection
        title="Maintenance Notifications"
        description="Notifications for maintenance tasks and issues"
        section="maintenance"
        preferences={preferences}
        onChange={(section, newValue) => 
          setPreferences(prev => ({ ...prev, [section]: newValue }))
        }
      />

      <NotificationSection
        title="Task Notifications"
        description="Notifications for task assignments and updates"
        section="tasks"
        preferences={preferences}
        onChange={(section, newValue) => 
          setPreferences(prev => ({ ...prev, [section]: newValue }))
        }
      />

      <NotificationSection
        title="System Notifications"
        description="System-wide notifications and alerts"
        section="system"
        preferences={preferences}
        onChange={(section, newValue) => 
          setPreferences(prev => ({ ...prev, [section]: newValue }))
        }
      />

      <NotificationSection
        title="Building Notifications"
        description="Notifications for building-related events"
        section="buildings"
        preferences={preferences}
        onChange={(section, newValue) => 
          setPreferences(prev => ({ ...prev, [section]: newValue }))
        }
      />
    </div>
  );
} 