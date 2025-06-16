'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface PerformanceMetrics {
  componentLoadTime: string;
  renderCount: number;
  domContentLoaded?: string;
  domComplete?: string;
  firstPaint?: string;
  firstContentfulPaint?: string;
  jsHeapSize?: string;
  [key: string]: any;
}

interface PerformanceMonitorProps {
  componentName: string;
  startTime: number;
  showByDefault?: boolean;
}

export function PerformanceMonitor({ 
  componentName, 
  startTime, 
  showByDefault = false 
}: PerformanceMonitorProps) {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [showMetrics, setShowMetrics] = useState(showByDefault);
  const [activeTab, setActiveTab] = useState('metrics');
  const renderCount = useRef(0);
  
  // Measure render time
  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const timeToRender = endTime - startTime;
    setRenderTime(timeToRender);
    
    console.log(`[${componentName}] Render #${renderCount.current} completed in: ${timeToRender.toFixed(2)} ms`);
    
    // Get performance metrics
    const navigationEntries = performance.getEntriesByType('navigation');
    const paintEntries = performance.getEntriesByType('paint');
    const resourceEntries = performance.getEntriesByType('resource');
    
    const metrics: PerformanceMetrics = {
      componentLoadTime: timeToRender.toFixed(2) + ' ms',
      renderCount: renderCount.current,
      domContentLoaded: navigationEntries.length > 0 ? 
        (navigationEntries[0] as PerformanceNavigationTiming).domContentLoadedEventEnd.toFixed(2) + ' ms' : undefined,
      domComplete: navigationEntries.length > 0 ? 
        (navigationEntries[0] as PerformanceNavigationTiming).domComplete.toFixed(2) + ' ms' : undefined,
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime.toFixed(2) + ' ms',
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime.toFixed(2) + ' ms',
    };
    
    // Add memory info if available
    if ((window.performance as any).memory) {
      metrics.jsHeapSize = ((window.performance as any).memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) + ' MB';
      metrics.jsHeapLimit = ((window.performance as any).memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2) + ' MB';
    }
    
    // Add resource timing info
    metrics.resourceCount = resourceEntries.length;
    
    // Calculate total resource size if available
    if (resourceEntries.length > 0) {
      const totalSize = resourceEntries.reduce((total, entry) => {
        if ('transferSize' in entry) {
          return total + (entry as PerformanceResourceTiming).transferSize;
        }
        return total;
      }, 0);
      
      metrics.totalResourceSize = (totalSize / 1024).toFixed(2) + ' KB';
    }
    
    setPerformanceMetrics(metrics);
    console.log(`[${componentName}] Performance metrics:`, metrics);
    
    return () => {
      console.log(`[${componentName}] Component unmounted after being mounted for: ${(performance.now() - startTime).toFixed(2)} ms`);
    };
  }, [componentName, startTime]);
  
  if (!renderTime) return null;
  
  const getPerformanceRating = (time: number): 'good' | 'medium' | 'poor' => {
    if (time < 100) return 'good';
    if (time < 300) return 'medium';
    return 'poor';
  };
  
  const ratingColor = {
    good: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800'
  };
  
  const rating = getPerformanceRating(renderTime);
  
  return (
    <div className={`${ratingColor[rating]} p-3 rounded-md mb-4 transition-all duration-300`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="font-medium">{componentName} rendered in: {renderTime.toFixed(2)} ms</p>
          <Badge variant={rating === 'good' ? 'default' : rating === 'medium' ? 'secondary' : 'destructive'}>
            {rating === 'good' ? 'Fast' : rating === 'medium' ? 'Average' : 'Slow'}
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowMetrics(!showMetrics)}
        >
          {showMetrics ? 'Hide Details' : 'Show Performance Details'}
        </Button>
      </div>
      
      {showMetrics && performanceMetrics && (
        <Card className="mt-3 border-none shadow-sm">
          <CardHeader className="pb-2">
            <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="memory">Memory</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="metrics" className="mt-0">
              <ul className="space-y-1 text-sm">
                {['componentLoadTime', 'renderCount', 'domContentLoaded', 'domComplete', 'firstPaint', 'firstContentfulPaint'].map(key => 
                  performanceMetrics[key] ? (
                    <li key={key} className="flex justify-between py-1 border-b border-gray-100">
                      <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                      <span>{String(performanceMetrics[key])}</span>
                    </li>
                  ) : null
                )}
              </ul>
            </TabsContent>
            
            <TabsContent value="resources" className="mt-0">
              <ul className="space-y-1 text-sm">
                {['resourceCount', 'totalResourceSize'].map(key => 
                  performanceMetrics[key] ? (
                    <li key={key} className="flex justify-between py-1 border-b border-gray-100">
                      <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                      <span>{String(performanceMetrics[key])}</span>
                    </li>
                  ) : null
                )}
              </ul>
            </TabsContent>
            
            <TabsContent value="memory" className="mt-0">
              {performanceMetrics.jsHeapSize ? (
                <ul className="space-y-1 text-sm">
                  {['jsHeapSize', 'jsHeapLimit'].map(key => 
                    performanceMetrics[key] ? (
                      <li key={key} className="flex justify-between py-1 border-b border-gray-100">
                        <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                        <span>{String(performanceMetrics[key])}</span>
                      </li>
                    ) : null
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Memory metrics not available in this browser</p>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 