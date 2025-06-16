'use client';

import { useEffect, useRef } from 'react';

interface MatterportViewerProps {
  modelId: string;
  width?: string;
  height?: string;
}

export default function MatterportViewer({ 
  modelId, 
  width = '100%', 
  height = '100%'
}: MatterportViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Initialize Matterport Showcase SDK if needed
    const loadMatterportSDK = async () => {
      try {
        // You can initialize the Matterport SDK here if needed
        // const mpSdk = await window.MP_SDK.connect(iframeRef.current);
      } catch (error) {
        console.error('Error loading Matterport SDK:', error);
      }
    };

    loadMatterportSDK();
  }, [modelId]);

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        style={{ width, height }}
        src={`https://my.matterport.com/show/?m=${modelId}`}
        frameBorder="0"
        allow="xr-spatial-tracking"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
} 