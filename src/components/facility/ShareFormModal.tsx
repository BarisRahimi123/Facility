'use client';

import { useState } from 'react';
import { X, Copy, Mail, Link, QrCode, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShareFormModalProps {
  formId: string;
  onClose: () => void;
}

export default function ShareFormModal({ formId, onClose }: ShareFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sharedUrl, setSharedUrl] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [responseLimit, setResponseLimit] = useState<number | null>(null);
  const [accessType, setAccessType] = useState<'public' | 'private'>('public');
  const [customSlug, setCustomSlug] = useState('');

  const handleGenerateLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/forms/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          password: isPasswordProtected ? password : undefined,
          expiryDays,
          responseLimit,
          accessType,
          customSlug: customSlug || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSharedUrl(data.url);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEmailShare = async () => {
    const emailSubject = 'Facility System Form';
    const emailBody = `Please fill out this facility system form: ${sharedUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  const generateQRCode = () => {
    // TODO: Implement QR code generation
    console.log('Generate QR code for:', sharedUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Share Form</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Access Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {accessType === 'public' ? (
                  <Globe className="w-5 h-5 text-green-500" />
                ) : (
                  <Lock className="w-5 h-5 text-blue-500" />
                )}
                <span className="font-medium">Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="access-type">Private</Label>
                <Switch
                  id="access-type"
                  checked={accessType === 'public'}
                  onCheckedChange={(checked) => setAccessType(checked ? 'public' : 'private')}
                />
                <Label htmlFor="access-type">Public</Label>
              </div>
            </div>

            {/* Custom URL */}
            <div className="space-y-2">
              <Label htmlFor="custom-slug">Custom URL</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-slug"
                  placeholder="custom-form-name"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                />
              </div>
            </div>

            {/* Password Protection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password-protection">Password Protection</Label>
                <Switch
                  id="password-protection"
                  checked={isPasswordProtected}
                  onCheckedChange={setIsPasswordProtected}
                />
              </div>
              {isPasswordProtected && (
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </div>

            {/* Expiration and Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-days">Expires After (days)</Label>
                <Input
                  id="expiry-days"
                  type="number"
                  min="1"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response-limit">Response Limit</Label>
                <Input
                  id="response-limit"
                  type="number"
                  min="1"
                  value={responseLimit || ''}
                  onChange={(e) => setResponseLimit(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>

          {/* Generate Link Button */}
          <Button 
            onClick={handleGenerateLink} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Share Link'}
          </Button>

          {/* Share Options */}
          {sharedUrl && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input value={sharedUrl} readOnly />
                <Button onClick={copyToClipboard} variant="outline">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleEmailShare} variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Share via Email
                </Button>
                <Button onClick={generateQRCode} variant="outline" className="flex-1">
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 