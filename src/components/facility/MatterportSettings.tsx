'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Settings, Save, X, Link, ExternalLink } from 'lucide-react';
import { updateFacilityMatterportUrl } from '@/app/actions/facilities';
import toast from 'react-hot-toast';

interface MatterportSettingsProps {
  facilityId: string;
  currentUrl: string;
  onUpdate: () => void;
}

export function MatterportSettings({ facilityId, currentUrl, onUpdate }: MatterportSettingsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [matterportUrl, setMatterportUrl] = useState(currentUrl);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Basic validation
    if (matterportUrl && !isValidMatterportUrl(matterportUrl)) {
      toast.error('Please enter a valid Matterport URL');
      return;
    }

    setIsSaving(true);
    try {
      await updateFacilityMatterportUrl(facilityId, matterportUrl);
      toast.success('Virtual tour updated successfully');
      setShowSettings(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update virtual tour');
    } finally {
      setIsSaving(false);
    }
  };

  const isValidMatterportUrl = (url: string) => {
    // Matterport URLs typically look like:
    // https://my.matterport.com/show/?m=XXXXXXXXXX
    // or https://my.matterport.com/show/?m=XXXXXXXXXX&play=1
    return url.includes('matterport.com/show/') || url === '';
  };

  const extractMatterportId = (url: string) => {
    const match = url.match(/[?&]m=([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <>
      <Button
        onClick={() => setShowSettings(true)}
        variant="outline"
        className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800"
      >
        <Settings className="h-4 w-4 mr-2" />
        {currentUrl ? 'Update Virtual Tour' : 'Add Virtual Tour'}
      </Button>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Virtual Tour Settings</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add or update the Matterport virtual tour for this facility
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matterport-url" className="text-white">
                Matterport Showcase URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="matterport-url"
                  value={matterportUrl}
                  onChange={(e) => setMatterportUrl(e.target.value)}
                  placeholder="https://my.matterport.com/show/?m=..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
                {matterportUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(matterportUrl, '_blank')}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Enter the full URL from your Matterport showcase (e.g., https://my.matterport.com/show/?m=XXXXXXXXXX)
              </p>
            </div>

            {matterportUrl && extractMatterportId(matterportUrl) && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">
                  <span className="font-medium text-white">Showcase ID:</span> {extractMatterportId(matterportUrl)}
                </p>
              </div>
            )}

            <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Link className="h-4 w-4" />
                How to get your Matterport URL
              </h4>
              <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                <li>Log in to your Matterport account</li>
                <li>Navigate to your model/space</li>
                <li>Click on "Share" or "Embed"</li>
                <li>Copy the showcase URL (starts with https://my.matterport.com/show/)</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMatterportUrl(currentUrl);
                setShowSettings(false);
              }}
              disabled={isSaving}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Virtual Tour
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 