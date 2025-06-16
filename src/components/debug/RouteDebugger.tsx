'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface RouteDebuggerProps {
  pageName: string;
}

export default function RouteDebugger({ pageName }: RouteDebuggerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setUserAgent(window.navigator.userAgent);
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
      
      // Add current path to history
      setHistory(prev => {
        const newHistory = [...prev, pathname || ''];
        return newHistory.slice(-5); // Keep only last 5 entries
      });
      
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [pathname]);

  if (!mounted) return null;

  const mainRoutes = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Facilities', path: '/facilities' },
    { name: 'Buildings', path: '/buildings' },
    { name: 'Plans', path: '/plans' },
    { name: 'Virtual Tour', path: '/virtual-tour' },
    { name: 'Maintenance', path: '/maintenance' }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
      <div 
        className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium">
          Route Debugger: {pageName}
        </h3>
        <span>{isExpanded ? '▼' : '▲'}</span>
      </div>

      {isExpanded && (
        <div className="p-4 text-xs">
          <div className="mb-3">
            <p><strong>Current Path:</strong> {pathname}</p>
            <p><strong>User Agent:</strong> {userAgent.substring(0, 50)}...</p>
            <p><strong>Window Size:</strong> {windowSize.width}x{windowSize.height}</p>
          </div>

          <div className="mb-3">
            <p className="font-semibold mb-1">Navigation History:</p>
            <ul className="ml-4 list-disc">
              {history.map((path, i) => (
                <li key={i} className="mb-0.5">{path}</li>
              ))}
            </ul>
          </div>

          <div className="mb-3">
            <p className="font-semibold mb-1">Test Navigation:</p>
            <div className="flex flex-wrap gap-2">
              {mainRoutes.map(route => (
                <Link 
                  key={route.path} 
                  href={route.path}
                  className={`px-2 py-1 rounded text-xs ${
                    pathname === route.path 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {route.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-2">
            <button
              onClick={() => router.back()}
              className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 