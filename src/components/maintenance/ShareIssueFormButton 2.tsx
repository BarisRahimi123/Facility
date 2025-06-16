'use client';

import { useState } from 'react';
import { Share2, Mail, Copy, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

export default function ShareIssueFormButton() {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  // Generate a shareable URL when the share dialog opens
  const handleOpenShareDialog = () => {
    // Generate a unique token (in a real app, this would be stored in a database)
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const baseUrl = window.location.origin;
    setShareUrl(`${baseUrl}/maintenance/report/${token}`);
    setIsShareDialogOpen(true);
  };

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast({
        title: "Link Copied",
        description: "The form link has been copied to your clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };
  
  // Handle email share
  const handleEmailShare = () => {
    const subject = encodeURIComponent('Report a Maintenance Issue');
    const body = encodeURIComponent(`Please use this link to report a maintenance issue: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  
  // Handle SMS share
  const handleSmsShare = () => {
    const message = encodeURIComponent(`Please use this link to report a maintenance issue: ${shareUrl}`);
    window.open(`sms:?body=${message}`);
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={handleOpenShareDialog}
      >
        <Share2 className="h-4 w-4" />
        Share Issue Form
      </Button>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Issue Report Form</DialogTitle>
            <DialogDescription>
              Share this form with others to report maintenance issues.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                readOnly
                value={shareUrl}
                className="w-full"
              />
            </div>
            <Button 
              type="button" 
              size="sm" 
              className="px-3" 
              onClick={handleCopyLink}
            >
              <span className="sr-only">Copy</span>
              {isCopied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleEmailShare}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleSmsShare}
            >
              <MessageSquare className="h-4 w-4" />
              SMS
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogDescription>
              The link will expire in 24 hours.
            </DialogDescription>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 